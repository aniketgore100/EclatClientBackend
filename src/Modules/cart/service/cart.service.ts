import { cartRepository, type CartRow, type VariantRow } from "../repository/cart.repository.js";
import { AppError, NotFoundError } from "../../../common/errors.js";
import { MAX_CART_LINES, MAX_QTY_PER_LINE } from "../dto/cart.dto.js";
import type { Prisma } from "../../../generated/prisma/client.js";

// Prices are stored in paise; the storefront deals in whole rupees.
const rupees = (paise: number) => Math.round(paise / 100);

type LineIssue = "UNAVAILABLE" | "OUT_OF_STOCK" | "INSUFFICIENT_STOCK";

const stockOf = (v: Pick<VariantRow, "inventory">) => Math.max(0, (v.inventory?.onHand ?? 0) - (v.inventory?.reserved ?? 0));
const isSellable = (v: VariantRow) =>
  v.status === "ACTIVE" && v.product.status === "ACTIVE" && v.product.category.status === "ACTIVE";

function optionsLabel(options: unknown): string {
  return Object.entries((options ?? {}) as Record<string, string>)
    .map(([name, value]) => (name === "size" ? `Size ${value}` : value.charAt(0).toUpperCase() + value.slice(1)))
    .join(" · ");
}

// A cart line is only variant + quantity. Price, name, image and availability are read live from
// the catalogue every time, so a stale cart can never carry an old price into checkout.
function toCart(cart: CartRow | null) {
  const lines = (cart?.items ?? []).map((item) => {
    const v = item.variant;
    const stock = stockOf(v);
    const issue: LineIssue | null = !isSellable(v)
      ? "UNAVAILABLE"
      : stock <= 0
        ? "OUT_OF_STOCK"
        : item.quantity > stock
          ? "INSUFFICIENT_STOCK"
          : null;
    const image = v.product.images[0];
    return {
      variantId: v.id,
      quantity: item.quantity,
      category: v.product.category.slug,
      stock,
      issue,
      snapshot: {
        slug: v.product.slug,
        name: v.product.name,
        image: image ? { url: image.url, alt: image.alt ?? v.product.name, kind: image.kind } : null,
        price: rupees(v.price),
        optionsLabel: optionsLabel(v.options),
      },
    };
  });
  return {
    lines,
    // True when every line can be bought right now — the gate for the Checkout button.
    checkoutReady: lines.length > 0 && lines.every((l) => l.issue === null),
    count: lines.reduce((n, l) => n + l.quantity, 0),
    // Only lines that can actually be bought count towards the total.
    subtotal: lines.filter((l) => l.issue === null).reduce((n, l) => n + l.quantity * l.snapshot.price, 0),
  };
}

function assertCanHold(variant: VariantRow | undefined, quantity: number): asserts variant is VariantRow {
  if (!variant) throw NotFoundError("This item doesn't exist", "VARIANT_NOT_FOUND");
  if (!isSellable(variant)) throw new AppError(409, "VARIANT_UNAVAILABLE", "This item is no longer available");
  if (quantity > MAX_QTY_PER_LINE) {
    throw new AppError(409, "MAX_QUANTITY", `You can add up to ${MAX_QTY_PER_LINE} of each piece`);
  }
  const stock = stockOf(variant);
  if (stock <= 0) throw new AppError(409, "OUT_OF_STOCK", "Sold out");
  if (quantity > stock) {
    throw new AppError(409, "INSUFFICIENT_STOCK", `Only ${stock} left`, { available: stock });
  }
}

async function setLine(tx: Prisma.TransactionClient, customerId: string, variantId: string, quantity: number, mode: "add" | "set") {
  const cart = await cartRepository.ensure(tx, customerId);
  const [variant] = await cartRepository.findVariants(tx, [variantId]);
  const existing = await tx.cartItem.findUnique({ where: { cartId_variantId: { cartId: cart.id, variantId } } });
  const target = mode === "add" ? (existing?.quantity ?? 0) + quantity : quantity;
  assertCanHold(variant, target);
  if (!existing) {
    const lines = await tx.cartItem.count({ where: { cartId: cart.id } });
    if (lines >= MAX_CART_LINES) throw new AppError(409, "CART_FULL", `Your bag can hold up to ${MAX_CART_LINES} different pieces`);
  }
  await tx.cartItem.upsert({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
    create: { cartId: cart.id, variantId, quantity: target },
    update: { quantity: target },
  });
}

export const cartService = {
  async get(customerId: string) {
    return toCart(await cartRepository.find(customerId));
  },

  // Adds on top of what's already there (the "Add to bag" button).
  async addItem(customerId: string, variantId: string, quantity: number) {
    await cartRepository.transaction((tx) => setLine(tx, customerId, variantId, quantity, "add"));
    return this.get(customerId);
  },

  // Absolute quantity (the stepper). 0 removes the line.
  async setQuantity(customerId: string, variantId: string, quantity: number) {
    if (quantity === 0) return this.removeItem(customerId, variantId);
    await cartRepository.transaction((tx) => setLine(tx, customerId, variantId, quantity, "set"));
    return this.get(customerId);
  },

  async removeItem(customerId: string, variantId: string) {
    const cart = await cartRepository.find(customerId);
    if (cart) {
      await cartRepository.transaction((tx) => tx.cartItem.deleteMany({ where: { cartId: cart.id, variantId } }));
    }
    return this.get(customerId);
  },

  async clear(customerId: string) {
    const cart = await cartRepository.find(customerId);
    if (cart) await cartRepository.transaction((tx) => tx.cartItem.deleteMany({ where: { cartId: cart.id } }));
    return this.get(customerId);
  },

  // Folds a guest's browser cart into the account cart at login. Quantities add up, capped at
  // stock and the per-line maximum; anything that can't be bought is skipped and reported back.
  // Safe to call twice with the same items — the client clears its copy after success.
  async merge(customerId: string, items: { variantId: string; quantity: number }[]) {
    const wanted = new Map<string, number>();
    for (const { variantId, quantity } of items) wanted.set(variantId, (wanted.get(variantId) ?? 0) + quantity);

    const notices: { variantId: string; reason: LineIssue | "CART_FULL" | "NOT_FOUND" }[] = [];
    await cartRepository.transaction(async (tx) => {
      const cart = await cartRepository.ensure(tx, customerId);
      const variants = new Map((await cartRepository.findVariants(tx, [...wanted.keys()])).map((v) => [v.id, v]));
      const existing = new Map((await tx.cartItem.findMany({ where: { cartId: cart.id } })).map((i) => [i.variantId, i.quantity]));

      for (const [variantId, quantity] of wanted) {
        const variant = variants.get(variantId);
        if (!variant) { notices.push({ variantId, reason: "NOT_FOUND" }); continue; }
        if (!isSellable(variant)) { notices.push({ variantId, reason: "UNAVAILABLE" }); continue; }
        const stock = stockOf(variant);
        if (stock <= 0) { notices.push({ variantId, reason: "OUT_OF_STOCK" }); continue; }
        const current = existing.get(variantId) ?? 0;
        if (current === 0 && existing.size >= MAX_CART_LINES) { notices.push({ variantId, reason: "CART_FULL" }); continue; }
        const target = Math.max(current, Math.min(current + quantity, MAX_QTY_PER_LINE, stock));
        if (target < current + quantity) notices.push({ variantId, reason: "INSUFFICIENT_STOCK" });
        if (target === current) continue;
        await tx.cartItem.upsert({
          where: { cartId_variantId: { cartId: cart.id, variantId } },
          create: { cartId: cart.id, variantId, quantity: target },
          update: { quantity: target },
        });
        existing.set(variantId, target);
      }
    });
    return { ...(await this.get(customerId)), notices };
  },
};
