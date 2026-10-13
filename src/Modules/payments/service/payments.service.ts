import crypto from "node:crypto";
import { prisma } from "../../../config/prisma.js";
import { Prisma } from "../../../generated/prisma/client.js";
import { AppError, NotFoundError } from "../../../common/errors.js";
import { ordersRepository } from "../../orders/repository/orders.repository.js";
import { toOrder } from "../../orders/service/order.mapper.js";
import { cancelHeldOrder, takeStockForPaidOrder } from "../../orders/service/inventory.service.js";
import { getGateway } from "../gateway/index.js";
import type { GatewayPayment } from "../gateway/types.js";

type Tx = Prisma.TransactionClient;

// While a customer is paying, their stock hold is stretched to at least this long…
const MIN_PAYMENT_WINDOW_MS = 15 * 60 * 1000;
// …but never past this long after the order was created.
const MAX_HOLD_MS = 2 * 60 * 60 * 1000;

const lockOrder = (tx: Tx, orderId: string) => tx.$queryRaw`SELECT id FROM orders WHERE id = ${orderId} FOR UPDATE`;

export type ConfirmOutcome = "confirmed" | "already" | "revived" | "refund" | "unknown";

interface Captured {
  providerOrderId: string;
  providerPaymentId: string;
  amount: number;
  method?: string;
}

// Takes the paid-for units out of the customer's bag (if they've since added more of the same
// piece, only the ordered quantity goes).
async function clearOrderedFromBag(tx: Tx, customerId: string, items: { variantId: string | null; quantity: number }[]) {
  const cart = await tx.cart.findUnique({ where: { customerId }, include: { items: true } });
  if (!cart) return;
  for (const item of items) {
    const line = cart.items.find((l) => l.variantId === item.variantId);
    if (!line) continue;
    if (line.quantity <= item.quantity) await tx.cartItem.delete({ where: { id: line.id } });
    else await tx.cartItem.update({ where: { id: line.id }, data: { quantity: { decrement: item.quantity } } });
  }
}

export const paymentsService = {
  /* ------------------------------------------------------------- starting a payment */

  // Makes sure a pending online order has a gateway order to pay against, and keeps its stock hold
  // alive while the customer pays. Safe to call repeatedly (retry after a closed window, a replayed
  // checkout): the same gateway order is reused.
  async initiate(customerId: string, number: string) {
    const gateway = getGateway();
    if (!gateway.configured) {
      throw new AppError(503, "PAYMENT_NOT_CONFIGURED", "Online payment isn't available right now. Please choose cash on delivery or try again later.");
    }
    const found = await ordersRepository.findForCustomer(customerId, number);
    if (!found) throw NotFoundError("Order not found", "ORDER_NOT_FOUND");
    if (found.paymentMethod !== "ONLINE") throw new AppError(409, "NOT_AN_ONLINE_ORDER", "This order is paid on delivery");
    // Paid or cancelled: nothing to start — the caller reads the state off the order.
    if (found.status !== "PENDING_PAYMENT") return toOrder(found);

    await prisma.$transaction(
      async (tx) => {
        await lockOrder(tx, found.id);
        const order = await tx.order.findUnique({ where: { id: found.id }, include: { payments: true, items: true } });
        if (!order || order.status !== "PENDING_PAYMENT") return;

        const now = Date.now();
        if (order.holdExpiresAt && order.holdExpiresAt.getTime() < now) {
          await cancelHeldOrder(tx, order, "hold expired");
          return;
        }
        const wanted = Math.min(order.createdAt.getTime() + MAX_HOLD_MS, now + MIN_PAYMENT_WINDOW_MS);
        if (!order.holdExpiresAt || order.holdExpiresAt.getTime() < wanted) {
          await tx.order.update({ where: { id: order.id }, data: { holdExpiresAt: new Date(wanted) } });
        }

        // The gateway order can be paid again after a failed attempt, so it's reused.
        if (!order.payments.some((p) => p.status === "CREATED" || p.status === "FAILED")) {
          const go = await gateway.createOrder({
            amount: order.total,
            currency: order.currency,
            receipt: order.number,
            notes: { orderId: order.id, orderNumber: order.number },
          });
          await tx.payment.create({
            data: { orderId: order.id, provider: gateway.name, providerOrderId: go.id, amount: order.total, currency: order.currency },
          });
        }
      },
      { timeout: 20_000 },
    );

    const fresh = await ordersRepository.findForCustomer(customerId, number);
    return toOrder(fresh!);
  },

  /* --------------------------------------------------------- confirming a payment */

  // The browser's success callback. The signature proves Razorpay issued it; where the provider can
  // be queried we also confirm the payment really is captured, for this order, for this amount.
  async verify(
    customerId: string,
    number: string,
    input: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string },
  ) {
    const gateway = getGateway();
    const order = await ordersRepository.findForCustomer(customerId, number);
    if (!order) throw NotFoundError("Order not found", "ORDER_NOT_FOUND");

    const payment = await prisma.payment.findUnique({ where: { providerOrderId: input.razorpay_order_id } });
    if (!payment || payment.orderId !== order.id) {
      throw new AppError(400, "PAYMENT_MISMATCH", "This payment doesn't belong to this order");
    }
    if (!gateway.verifyCheckoutSignature(input.razorpay_order_id, input.razorpay_payment_id, input.razorpay_signature)) {
      throw new AppError(400, "PAYMENT_SIGNATURE_INVALID", "We couldn't verify this payment");
    }

    let amount = payment.amount;
    let method: string | undefined;
    if (gateway.canQueryPayments) {
      let gp: GatewayPayment = await gateway.fetchPayment(input.razorpay_payment_id);
      if (gp.orderId !== payment.providerOrderId) throw new AppError(400, "PAYMENT_MISMATCH", "This payment doesn't belong to this order");
      if (gp.status === "authorized") gp = await gateway.capturePayment(gp.id, gp.amount, gp.currency);
      if (gp.status !== "captured") {
        throw new AppError(402, "PAYMENT_NOT_CAPTURED", "The payment hasn't gone through. You haven't been charged.");
      }
      amount = gp.amount;
      method = gp.method;
    }

    const outcome = await this.confirmPayment({
      providerOrderId: payment.providerOrderId,
      providerPaymentId: input.razorpay_payment_id,
      amount,
      method,
    });
    const fresh = (await ordersRepository.findForCustomer(customerId, number))!;
    // Money arrived but the order couldn't be honoured (stock gone) — it's been, or is being, refunded.
    if (outcome === "refund" || fresh.status === "CANCELLED") {
      throw new AppError(
        409,
        "PAYMENT_REFUNDED",
        "Your payment arrived after this item sold out, so it's being refunded to your original payment method.",
      );
    }
    return toOrder(fresh);
  },

  // The one place a payment turns into a confirmed order. Called by the browser callback, the
  // webhook and the reconciliation job, in any order and any number of times — all idempotent.
  async confirmPayment(captured: Captured): Promise<ConfirmOutcome> {
    const known = await prisma.payment.findUnique({ where: { providerOrderId: captured.providerOrderId } });
    if (!known) return "unknown";

    const outcome = await prisma.$transaction(
      async (tx): Promise<ConfirmOutcome> => {
        await lockOrder(tx, known.orderId);
        const order = await tx.order.findUnique({ where: { id: known.orderId }, include: { items: true } });
        const payment = await tx.payment.findUnique({ where: { id: known.id } });
        if (!order || !payment) return "unknown";

        // Already handled (verify + webhook both arrive for every payment).
        if (payment.status === "CAPTURED" || payment.status === "REFUND_PENDING" || payment.status === "REFUNDED") return "already";

        const paidFields = {
          status: "CAPTURED" as const,
          providerPaymentId: captured.providerPaymentId,
          method: captured.method ?? payment.method,
          capturedAt: new Date(),
          failureCode: null,
          failureReason: null,
        };

        // The money received must be exactly the order total. Anything else is never fulfilled.
        if (captured.amount !== order.total) {
          await tx.payment.update({ where: { id: payment.id }, data: { ...paidFields, failureCode: "AMOUNT_MISMATCH", failureReason: `received ${captured.amount}, expected ${order.total}` } });
          console.error(`Payment ${captured.providerPaymentId}: amount mismatch on order ${order.number} (got ${captured.amount}, expected ${order.total}) — refunding`);
          return "refund";
        }

        if (order.status === "CONFIRMED" || order.status === "SHIPPED" || order.status === "DELIVERED") {
          await tx.payment.update({ where: { id: payment.id }, data: paidFields });
          return "already";
        }

        if (order.status === "PENDING_PAYMENT") {
          // Normal path: the checkout reserved the units; now they leave stock for good. If the
          // reservation was lost somehow, fall back to "are they still free?".
          const took =
            (await takeStockForPaidOrder(tx, order, true, "paid")) || (await takeStockForPaidOrder(tx, order, false, "paid (reservation had lapsed)"));
          if (!took) {
            await tx.order.updateMany({
              where: { id: order.id, status: "PENDING_PAYMENT" },
              data: { status: "CANCELLED", holdExpiresAt: null, cancelledAt: new Date(), cancelReason: "paid but stock was gone — refunded" },
            });
            await tx.payment.update({ where: { id: payment.id }, data: paidFields });
            return "refund";
          }
          await tx.order.update({ where: { id: order.id }, data: { status: "CONFIRMED", paidAt: new Date(), holdExpiresAt: null } });
          await tx.payment.update({ where: { id: payment.id }, data: paidFields });
          await clearOrderedFromBag(tx, order.customerId, order.items);
          return "confirmed";
        }

        // CANCELLED: the hold lapsed (or the customer cancelled) and then the money arrived anyway.
        // Honour it if the stock is still free; otherwise give the money back.
        if (await takeStockForPaidOrder(tx, order, false, "late payment")) {
          await tx.order.update({
            where: { id: order.id },
            data: { status: "CONFIRMED", paidAt: new Date(), holdExpiresAt: null, cancelledAt: null, cancelReason: null },
          });
          await tx.payment.update({ where: { id: payment.id }, data: paidFields });
          await clearOrderedFromBag(tx, order.customerId, order.items);
          return "revived";
        }
        await tx.payment.update({ where: { id: payment.id }, data: paidFields });
        await tx.order.update({ where: { id: order.id }, data: { cancelReason: "payment arrived after the hold expired and stock was gone — refunded" } });
        return "refund";
      },
      { timeout: 20_000 },
    );

    if (outcome === "refund") await this.refundPayment(known.id, "stock unavailable");
    return outcome;
  },

  /* -------------------------------------------------------------------- refunds */

  // Sends the money back. If the provider call fails the payment stays CAPTURED on a cancelled
  // order, and the reconciliation job retries.
  async refundPayment(paymentId: string, reason: string): Promise<void> {
    const gateway = getGateway();
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment?.providerPaymentId) return;
    if (payment.status === "REFUNDED" || payment.status === "REFUND_PENDING") return;
    try {
      // A previous attempt may have gone through even though we never saw the reply.
      if (gateway.canQueryPayments) {
        const gp = await gateway.fetchPayment(payment.providerPaymentId);
        if (gp.status === "refunded") {
          await prisma.payment.update({ where: { id: payment.id }, data: { status: "REFUNDED", refundedAmount: payment.amount } });
          return;
        }
      }
      const refund = await gateway.refund(payment.providerPaymentId, payment.amount, { reason, paymentId: payment.id });
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: refund.status === "processed" ? "REFUNDED" : "REFUND_PENDING",
          refundId: refund.id,
          refundedAmount: refund.amount,
        },
      });
    } catch (err) {
      console.error(`Refund for payment ${payment.providerPaymentId} failed — will be retried:`, err);
    }
  },

  /* ---------------------------------------------------------------- cancelling */

  // The customer backs out of an unpaid order: the stock goes back at once. If they pay anyway
  // (window still open in another tab) the late-payment path honours or refunds it.
  async cancel(customerId: string, number: string) {
    const found = await ordersRepository.findForCustomer(customerId, number);
    if (!found) throw NotFoundError("Order not found", "ORDER_NOT_FOUND");
    if (found.status === "CANCELLED") return toOrder(found);
    if (found.status !== "PENDING_PAYMENT") {
      throw new AppError(409, "CANNOT_CANCEL", "This order is already confirmed. Contact support to change or cancel it.");
    }
    await prisma.$transaction(async (tx) => {
      await lockOrder(tx, found.id);
      const order = await tx.order.findUnique({ where: { id: found.id }, include: { items: true } });
      if (order) await cancelHeldOrder(tx, order, "cancelled by customer");
    });
    return toOrder((await ordersRepository.findForCustomer(customerId, number))!);
  },

  // Used when starting the payment for a brand-new order fails: put everything back.
  async abandon(orderId: string, reason: string) {
    await prisma.$transaction(async (tx) => {
      await lockOrder(tx, orderId);
      const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
      if (order) await cancelHeldOrder(tx, order, reason);
    });
  },

  /* ------------------------------------------------------------------- webhooks */

  async handleWebhook(rawBody: Buffer, signature: string | undefined, eventId: string | undefined) {
    const gateway = getGateway();
    if (!signature || !gateway.verifyWebhookSignature(rawBody, signature)) {
      throw new AppError(400, "INVALID_SIGNATURE", "Invalid webhook signature");
    }
    let event: {
      event?: string;
      payload?: {
        payment?: { entity?: { id: string; order_id: string; amount: number; method?: string; error_code?: string | null; error_description?: string | null } };
        refund?: { entity?: { id: string; payment_id: string; amount: number } };
      };
    };
    try {
      event = JSON.parse(rawBody.toString("utf8"));
    } catch {
      throw new AppError(400, "INVALID_PAYLOAD", "Webhook body isn't valid JSON");
    }

    const id = eventId || crypto.createHash("sha256").update(rawBody).digest("hex");
    const type = event.event ?? "unknown";
    const pay = event.payload?.payment?.entity;
    const refund = event.payload?.refund?.entity;

    // Everything below is idempotent, so a redelivery (or a duplicate racing us) is harmless; the
    // event row just lets us skip the work quickly. It's written only after success, so a failure
    // answers 5xx and the provider redelivers.
    if (await prisma.webhookEvent.findUnique({ where: { id } })) return { handled: true, duplicate: true };

    if ((type === "payment.captured" || type === "order.paid") && pay) {
      await this.confirmPayment({ providerOrderId: pay.order_id, providerPaymentId: pay.id, amount: pay.amount, method: pay.method });
    } else if (type === "payment.failed" && pay) {
      await prisma.payment.updateMany({
        where: { providerOrderId: pay.order_id, status: { in: ["CREATED", "FAILED"] } },
        data: { status: "FAILED", providerPaymentId: pay.id, method: pay.method, failureCode: pay.error_code ?? null, failureReason: pay.error_description ?? null },
      });
    } else if (type === "refund.processed" && refund) {
      await prisma.payment.updateMany({
        where: { providerPaymentId: refund.payment_id },
        data: { status: "REFUNDED", refundId: refund.id, refundedAmount: refund.amount },
      });
    } else if (type === "refund.failed" && refund) {
      console.error(`Razorpay refund ${refund.id} for payment ${refund.payment_id} failed — needs attention`);
    }

    await prisma.webhookEvent.createMany({ data: [{ id, provider: gateway.name, type }], skipDuplicates: true });
    return { handled: true, duplicate: false };
  },

  /* ------------------------------------------------------------- reconciliation */

  // Safety net for lost webhooks and failed refunds. (a) Payments still unresolved a few minutes
  // after they started are asked about at the provider: a captured one confirms its order.
  // (b) Money taken for orders that ended up cancelled gets refunded.
  async reconcile(): Promise<{ checked: number; confirmed: number; refunded: number }> {
    const gateway = getGateway();
    let checked = 0;
    let confirmed = 0;
    let refunded = 0;

    if (gateway.configured && gateway.canQueryPayments) {
      const now = Date.now();
      const unresolved = await prisma.payment.findMany({
        where: { status: { in: ["CREATED", "FAILED"] }, createdAt: { gt: new Date(now - 48 * 3600_000), lt: new Date(now - 3 * 60_000) } },
        orderBy: { updatedAt: "asc" },
        take: 25,
      });
      for (const p of unresolved) {
        try {
          const captured = (await gateway.fetchOrderPayments(p.providerOrderId)).find((x) => x.status === "captured");
          if (captured) {
            const outcome = await this.confirmPayment({ providerOrderId: p.providerOrderId, providerPaymentId: captured.id, amount: captured.amount, method: captured.method });
            if (outcome === "confirmed" || outcome === "revived") confirmed++;
          } else {
            await prisma.payment.update({ where: { id: p.id }, data: { updatedAt: new Date() } }); // checked; move to the back
          }
          checked++;
        } catch (err) {
          console.error(`Reconcile: could not check ${p.providerOrderId}:`, err);
        }
      }
    }

    const owed = await prisma.payment.findMany({
      where: { status: "CAPTURED", refundedAmount: 0, order: { status: "CANCELLED" } },
      take: 25,
    });
    for (const p of owed) {
      await this.refundPayment(p.id, "order cancelled");
      refunded++;
    }
    return { checked, confirmed, refunded };
  },
};
