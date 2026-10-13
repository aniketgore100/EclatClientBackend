import { Prisma } from "../../../generated/prisma/client.js";

type Tx = Prisma.TransactionClient;
type OrderWithItems = Prisma.OrderGetPayload<{ include: { items: true } }>;

// Every stock change goes through here so it is always paired with a ledger row.
export const inventory = {
  async reserve(tx: Tx, variantId: string, quantity: number, orderId: string) {
    await tx.inventory.update({ where: { variantId }, data: { reserved: { increment: quantity } } });
    await tx.inventoryMovement.create({ data: { variantId, orderId, type: "RESERVE", reservedDelta: quantity } });
  },

  // A paid-for-on-the-spot sale (COD): units leave on-hand directly.
  async sell(tx: Tx, variantId: string, quantity: number, orderId: string) {
    await tx.inventory.update({ where: { variantId }, data: { onHand: { decrement: quantity } } });
    await tx.inventoryMovement.create({ data: { variantId, orderId, type: "SALE", onHandDelta: -quantity } });
  },

  async release(tx: Tx, variantId: string, quantity: number, orderId: string, note: string) {
    const { count } = await tx.inventory.updateMany({
      where: { variantId, reserved: { gte: quantity } },
      data: { reserved: { decrement: quantity } },
    });
    if (count === 1) {
      await tx.inventoryMovement.create({ data: { variantId, orderId, type: "RELEASE", reservedDelta: -quantity, note } });
    }
  },
};

// Cancels an unpaid order and gives its stock back. The status flip is an atomic claim, so when
// the sweeper, another checkout and a payment callback race for the same order only one releases it.
export async function cancelHeldOrder(tx: Tx, order: OrderWithItems, note: string) {
  const claimed = await tx.order.updateMany({
    where: { id: order.id, status: "PENDING_PAYMENT" },
    data: { status: "CANCELLED", holdExpiresAt: null, cancelledAt: new Date(), cancelReason: note },
  });
  if (claimed.count !== 1) return false;
  // Sorted so concurrent releases touch inventory rows in the same order (no deadlocks).
  for (const item of [...order.items].sort((a, b) => (a.variantId ?? "").localeCompare(b.variantId ?? ""))) {
    if (item.variantId) await inventory.release(tx, item.variantId, item.quantity, order.id, note);
  }
  return true;
}

// Online orders nobody paid for within the hold window.
export async function releaseExpiredHolds(tx: Tx): Promise<number> {
  const expired = await tx.order.findMany({
    where: { status: "PENDING_PAYMENT", holdExpiresAt: { lt: new Date() } },
    include: { items: true },
  });
  let released = 0;
  for (const order of expired) if (await cancelHeldOrder(tx, order, "hold expired")) released++;
  return released;
}

// A customer has at most one open (unpaid) order: starting a new checkout replaces it, so retrying
// a failed or abandoned payment never makes someone block their own stock.
export async function supersedeOpenOrders(tx: Tx, customerId: string): Promise<number> {
  const open = await tx.order.findMany({ where: { customerId, status: "PENDING_PAYMENT" }, include: { items: true } });
  let released = 0;
  for (const order of open) if (await cancelHeldOrder(tx, order, "replaced by a new checkout")) released++;
  return released;
}

// `reserved` must always equal the units held by unpaid (PENDING_PAYMENT) orders. If the two ever
// disagree — an order row removed by hand, a crash mid-way — the counter would block stock for
// nobody, so each sweep recomputes it from the orders and corrects any drift, leaving a ledger row.
export async function reconcileReservations(tx: Tx): Promise<number> {
  const drifted = await tx.$queryRaw<{ variantId: string }[]>`
    SELECT i."variantId"
    FROM inventory i
    LEFT JOIN (
      SELECT oi."variantId", SUM(oi.quantity)::int AS held
      FROM order_items oi JOIN orders o ON o.id = oi."orderId"
      WHERE o.status = 'PENDING_PAYMENT' AND oi."variantId" IS NOT NULL
      GROUP BY oi."variantId"
    ) h ON h."variantId" = i."variantId"
    WHERE i.reserved <> COALESCE(h.held, 0)`;
  let fixed = 0;
  for (const { variantId } of drifted) {
    // Lock first, then recompute, so an in-flight checkout finishes before we judge the numbers.
    await tx.$queryRaw`SELECT "variantId" FROM inventory WHERE "variantId" = ${variantId} FOR UPDATE`;
    const held = await tx.orderItem.aggregate({
      where: { variantId, order: { status: "PENDING_PAYMENT" } },
      _sum: { quantity: true },
    });
    const expected = held._sum.quantity ?? 0;
    const current = await tx.inventory.findUnique({ where: { variantId } });
    if (!current || current.reserved === expected) continue;
    await tx.inventory.update({ where: { variantId }, data: { reserved: expected } });
    await tx.inventoryMovement.create({
      data: {
        variantId,
        type: "ADJUSTMENT",
        reservedDelta: expected - current.reserved,
        note: `reconciled: reserved was ${current.reserved}, open orders hold ${expected}`,
      },
    });
    fixed++;
  }
  return fixed;
}

// A paid order takes its units out of stock for good. `fromReservation` is the normal path (the
// units were reserved at checkout, so reserved and on-hand both drop); otherwise — a late payment
// for an order whose hold already lapsed — the units must still be free right now. All-or-nothing:
// rows are locked in a fixed order and checked first, so a refusal changes nothing.
export async function takeStockForPaidOrder(
  tx: Tx,
  order: OrderWithItems,
  fromReservation: boolean,
  note: string,
): Promise<boolean> {
  const wanted = new Map<string, number>();
  for (const item of order.items) {
    if (item.variantId) wanted.set(item.variantId, (wanted.get(item.variantId) ?? 0) + item.quantity);
  }
  const ids = [...wanted.keys()].sort();
  if (ids.length === 0) return true;

  await tx.$queryRaw`SELECT "variantId" FROM inventory WHERE "variantId" IN (${Prisma.join(ids)}) ORDER BY "variantId" FOR UPDATE`;
  const rows = new Map((await tx.inventory.findMany({ where: { variantId: { in: ids } } })).map((r) => [r.variantId, r]));

  for (const id of ids) {
    const row = rows.get(id);
    const qty = wanted.get(id)!;
    if (!row) return false;
    const ok = fromReservation ? row.reserved >= qty && row.onHand >= qty : row.onHand - row.reserved >= qty;
    if (!ok) return false;
  }
  for (const id of ids) {
    const qty = wanted.get(id)!;
    await tx.inventory.update({
      where: { variantId: id },
      data: fromReservation ? { reserved: { decrement: qty }, onHand: { decrement: qty } } : { onHand: { decrement: qty } },
    });
    await tx.inventoryMovement.create({
      data: { variantId: id, orderId: order.id, type: "SALE", onHandDelta: -qty, reservedDelta: fromReservation ? -qty : 0, note },
    });
  }
  return true;
}
