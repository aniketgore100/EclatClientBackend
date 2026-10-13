import { prisma } from "../../../config/prisma.js";
import { reconcileReservations, releaseExpiredHolds } from "./inventory.service.js";
import { paymentsService } from "../../payments/service/payments.service.js";

const INTERVAL_MS = 60 * 1000;

// Gives back the stock of unpaid online orders once their hold runs out, and repairs any drift
// between the `reserved` counters and the open orders. It lives in the API
// process — no external cron needed — and is safe with several instances running: each release is
// an atomic claim on the order, so an order is released exactly once.
export function startHoldSweeper() {
  let runs = 0;
  const run = async () => {
    runs++;
    try {
      const { released, reconciled } = await prisma.$transaction(
        async (tx) => ({ released: await releaseExpiredHolds(tx), reconciled: await reconcileReservations(tx) }),
        { timeout: 15_000 },
      );
      if (released > 0) console.log(`Hold sweeper released ${released} expired order(s)`);
      if (reconciled > 0) console.warn(`Hold sweeper corrected reserved stock on ${reconciled} variant(s) — see inventory_movements`);
    } catch (err) {
      console.error("Hold sweeper failed:", err);
    }
    // Every 5 minutes: ask the payment provider about payments that never reported back, and
    // retry any refund that didn't go through.
    if (runs % 5 === 0) {
      try {
        const r = await paymentsService.reconcile();
        if (r.confirmed || r.refunded) console.log(`Payment reconcile: confirmed ${r.confirmed}, refunds retried ${r.refunded}`);
      } catch (err) {
        console.error("Payment reconcile failed:", err);
      }
    }
  };
  void run();
  return setInterval(run, INTERVAL_MS).unref();
}
