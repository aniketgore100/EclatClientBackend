import crypto from "node:crypto";
import { Prisma } from "../../../generated/prisma/client.js";
import { ordersRepository } from "../repository/orders.repository.js";
import { optionsLabel, toOrder } from "./order.mapper.js";
import { AppError, NotFoundError } from "../../../common/errors.js";
import { PAYMENT_HOLD_MINUTES, SHIPPING } from "../../../config/shipping.js";
import { MAX_QTY_PER_LINE, type CreateOrderDto } from "../dto/create-order.dto.js";
import { inventory, releaseExpiredHolds, supersedeOpenOrders } from "./inventory.service.js";
import type { DeviceInfo } from "../../../common/userAgent.js";
import { getGateway } from "../../payments/gateway/index.js";
import { paymentsService } from "../../payments/service/payments.service.js";

const rupees = (paiseAmount: number) => Math.round(paiseAmount / 100);
const paise = (rupeeAmount: number) => rupeeAmount * 100;

const orderNumber = () => `EE${crypto.randomInt(100000, 1000000)}`;

export const ordersService = {
  // Builds the order from the customer's server-side bag. `idempotencyKey` identifies one checkout
  // attempt: sending it again (double-click, retry after a dropped connection) returns the same order.
  async create(customerId: string, dto: CreateOrderDto, idempotencyKey: string, device?: DeviceInfo): Promise<{ order: ReturnType<typeof toOrder>; replayed: boolean }> {
    const prior = await ordersRepository.findByKey(customerId, idempotencyKey);
    if (prior) {
      // A replayed online checkout hands back its payment details again so the window can reopen.
      if (prior.paymentMethod === "ONLINE" && prior.status === "PENDING_PAYMENT") {
        return { order: await paymentsService.initiate(customerId, prior.number), replayed: true };
      }
      return { order: toOrder(prior), replayed: true };
    }

    // Refuse online orders up front when payment isn't set up — better than reserving stock first.
    if (dto.paymentMethod === "online" && !getGateway().configured) {
      throw new AppError(503, "PAYMENT_NOT_CONFIGURED", "Online payment isn't available right now. Please choose cash on delivery or try again later.");
    }

    for (let attempt = 0; ; attempt++) {
      try {
        const order = await ordersRepository.transaction(async (tx) => {
          // Stock first: give back expired holds and this customer's own unpaid order, so neither
          // blocks the stock this checkout needs.
          await releaseExpiredHolds(tx);
          await supersedeOpenOrders(tx, customerId);

          const cart = await tx.cart.findUnique({ where: { customerId }, include: { items: true } });
          if (!cart || cart.items.length === 0) throw new AppError(409, "CART_EMPTY", "Your bag is empty");
          const wanted = new Map(cart.items.map((i) => [i.variantId, i.quantity]));
          const ids = [...wanted.keys()].sort(); // stable lock order → no deadlocks between concurrent orders

          // Row-lock the inventory so two checkouts can't both take the last unit.
          await tx.$queryRaw`SELECT "variantId" FROM inventory WHERE "variantId" IN (${Prisma.join(ids)}) ORDER BY "variantId" FOR UPDATE`;
          const variants = await tx.variant.findMany({
            where: { id: { in: ids } },
            include: {
              inventory: true,
              product: {
                select: { slug: true, name: true, status: true, codAllowed: true, category: { select: { status: true } }, images: { orderBy: { position: "asc" }, take: 1 } },
              },
            },
          });
          const byId = new Map(variants.map((v) => [v.id, v]));

          let subtotal = 0;
          const lines: Prisma.OrderItemCreateWithoutOrderInput[] = [];
          for (const id of ids) {
            const v = byId.get(id);
            const quantity = wanted.get(id)!;
            if (!v) throw new AppError(409, "VARIANT_NOT_FOUND", "An item in your bag no longer exists. Remove it and try again.");
            const name = v.product.name;
            if (v.status !== "ACTIVE" || v.product.status !== "ACTIVE" || v.product.category.status !== "ACTIVE") {
              throw new AppError(409, "VARIANT_UNAVAILABLE", `${name} is no longer available`, { variantId: id });
            }
            if (quantity > MAX_QTY_PER_LINE) {
              throw new AppError(409, "MAX_QUANTITY", `You can order up to ${MAX_QTY_PER_LINE} of each piece`, { variantId: id });
            }
            const available = Math.max(0, (v.inventory?.onHand ?? 0) - (v.inventory?.reserved ?? 0));
            if (available <= 0) throw new AppError(409, "OUT_OF_STOCK", `${name} is out of stock`, { variantId: id });
            if (quantity > available) {
              throw new AppError(409, "INSUFFICIENT_STOCK", `${name} — only ${available} left`, { variantId: id, available });
            }
            if (dto.paymentMethod === "cod" && !v.product.codAllowed) {
              throw new AppError(409, "COD_NOT_AVAILABLE", `Cash on delivery isn't available for ${name}`, { variantId: id });
            }
            // Always priced from the database — the browser's price is never trusted.
            subtotal += v.price * quantity;
            const image = v.product.images[0];
            lines.push({
              variant: { connect: { id } },
              sku: v.sku,
              name,
              slug: v.product.slug,
              optionsLabel: optionsLabel(v.options),
              imageUrl: image?.url ?? null,
              unitPrice: v.price,
              quantity,
            });
          }

          const method = SHIPPING.methods[dto.shippingMethod];
          const shippingFee = dto.shippingMethod === "standard" && subtotal >= paise(SHIPPING.freeAbove) ? 0 : paise(method.fee);
          const cod = dto.paymentMethod === "cod";
          const codFee = cod ? paise(SHIPPING.codFee) : 0;
          const total = subtotal + shippingFee + codFee;

          if (rupees(total) !== dto.expectedTotal) {
            throw new AppError(409, "PRICE_CHANGED", "Prices changed while you were checking out. Review your bag and try again.", {
              total: rupees(total),
            });
          }

          const created = await tx.order.create({
            data: {
              number: orderNumber(),
              customerId,
              status: cod ? "CONFIRMED" : "PENDING_PAYMENT",
              paymentMethod: cod ? "COD" : "ONLINE",
              subtotal,
              shippingFee,
              codFee,
              total,
              shippingMethod: dto.shippingMethod,
              contactEmail: dto.customer.email,
              contactPhone: dto.customer.phone,
              marketingOptIn: dto.customer.marketingOptIn,
              shippingAddress: dto.shippingAddress,
              giftNote: dto.giftNote || null,
              holdExpiresAt: cod ? null : new Date(Date.now() + PAYMENT_HOLD_MINUTES * 60 * 1000),
              idempotencyKey,
              deviceType: device?.deviceType ?? null,
              os: device?.os ?? null,
              browser: device?.browser ?? null,
              userAgent: device?.userAgent ?? null,
              items: { create: lines },
            },
            include: ordersRepository.orderInclude,
          });

          // COD is confirmed on the spot, so the units leave stock now. Online orders only reserve
          // them until payment lands (or the hold expires).
          for (const id of ids) {
            const quantity = wanted.get(id)!;
            if (cod) await inventory.sell(tx, id, quantity, created.id);
            else await inventory.reserve(tx, id, quantity, created.id);
          }

          // A confirmed order empties the bag. (An unpaid online order leaves it alone so they can retry.)
          if (cod) await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
          return created;
        });
        if (order.paymentMethod === "ONLINE") {
          // Open the payment with the provider. If that can't be done, undo the reservation rather
          // than leave stock held for an order nobody can pay.
          try {
            return { order: await paymentsService.initiate(customerId, order.number), replayed: false };
          } catch (err) {
            await paymentsService.abandon(order.id, "could not start payment").catch(() => {});
            throw err;
          }
        }
        return { order: toOrder(order), replayed: false };
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
          // Either the same attempt landed twice at once (return the winner) or a random order
          // number collided (draw another).
          const winner = await ordersRepository.findByKey(customerId, idempotencyKey);
          if (winner) return { order: toOrder(winner), replayed: true };
          if (attempt < 4) continue;
        }
        throw err;
      }
    }
  },

  async list(customerId: string) {
    return { items: (await ordersRepository.listForCustomer(customerId)).map(toOrder) };
  },

  async get(customerId: string, number: string) {
    const order = await ordersRepository.findForCustomer(customerId, number);
    if (!order) throw NotFoundError("Order not found", "ORDER_NOT_FOUND");
    return toOrder(order);
  },
};
