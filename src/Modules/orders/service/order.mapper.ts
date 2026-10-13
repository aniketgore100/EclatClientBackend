import type { OrderRow } from "../repository/orders.repository.js";
import { getGateway } from "../../payments/gateway/index.js";

// Prices are stored in paise; the storefront deals in whole rupees.
const rupees = (paise: number) => Math.round(paise / 100);

// What the browser needs to open the payment window. Only the public key id is exposed.
export function paymentSession(o: OrderRow) {
  const payment = o.payments[0];
  if (o.paymentMethod !== "ONLINE" || o.status !== "PENDING_PAYMENT" || !payment) return null;
  if (payment.status === "CAPTURED" || payment.status === "REFUNDED" || payment.status === "REFUND_PENDING") return null;
  return {
    provider: "razorpay" as const,
    keyId: getGateway().keyId,
    orderId: payment.providerOrderId,
    amount: payment.amount,
    currency: payment.currency,
    expiresAt: o.holdExpiresAt?.toISOString() ?? null,
  };
}

export function optionsLabel(options: unknown): string {
  return Object.entries((options ?? {}) as Record<string, string>)
    .map(([name, value]) => (name === "size" ? `Size ${value}` : value.charAt(0).toUpperCase() + value.slice(1)))
    .join(" · ");
}

// Only once a courier is booked and has a tracking number does the customer see a shipment — the
// earlier "being prepared" stages stay internal.
function shipmentView(o: OrderRow) {
  const s = o.shipments[0];
  if (!s?.awb) return null;
  return {
    status: s.status.toLowerCase(),
    courierName: s.courierName,
    awb: s.awb,
    trackingUrl: s.trackingUrl,
    etd: s.etd?.toISOString() ?? null,
    deliveredAt: s.deliveredAt?.toISOString() ?? null,
    events: s.events.map((e) => ({ status: e.status, activity: e.activity, location: e.location, at: e.occurredAt.toISOString() })),
  };
}

export function toOrder(o: OrderRow) {
  const payment = o.payments[0];
  return {
    id: o.id,
    number: o.number,
    status: o.status.toLowerCase() as Lowercase<OrderRow["status"]>,
    paymentMethod: o.paymentMethod.toLowerCase(),
    lines: o.items.map((i) => ({
      variantId: i.variantId,
      sku: i.sku,
      name: i.name,
      unitPrice: rupees(i.unitPrice),
      quantity: i.quantity,
      slug: i.slug,
      category: i.variant?.product.category.slug ?? null,
      optionsLabel: i.optionsLabel,
      image: i.imageUrl ? { url: i.imageUrl, alt: i.name } : null,
    })),
    totals: {
      subtotal: rupees(o.subtotal),
      shipping: rupees(o.shippingFee),
      cod: rupees(o.codFee),
      total: rupees(o.total),
      currency: o.currency,
    },
    shippingAddress: o.shippingAddress,
    giftNote: o.giftNote,
    // Present while an online order is waiting for payment.
    payment: paymentSession(o),
    paymentStatus: payment ? payment.status.toLowerCase() : null,
    paidAt: o.paidAt?.toISOString() ?? null,
    shippedAt: o.shippedAt?.toISOString() ?? null,
    deliveredAt: o.deliveredAt?.toISOString() ?? null,
    shipment: shipmentView(o),
    cancelReason: o.cancelReason,
    createdAt: o.createdAt.toISOString(),
  };
}
