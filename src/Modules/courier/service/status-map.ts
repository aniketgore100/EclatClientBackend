import type { ShipmentStatus } from "../../../generated/prisma/client.js";

// How far along a shipment is. Updates only ever move it forward, so a late or repeated message
// can't drag a delivered parcel back to "in transit".
export const RANK: Record<ShipmentStatus, number> = {
  CREATED: 0,
  AWB_ASSIGNED: 1,
  PICKUP_SCHEDULED: 2,
  IN_TRANSIT: 3,
  OUT_FOR_DELIVERY: 4,
  RTO: 5, // heading back to us: a dead end, not "delivered"
  DELIVERED: 6,
  CANCELLED: 7,
};

const IN_TRANSIT = ["PICKED UP", "SHIPPED", "IN TRANSIT", "REACHED AT DESTINATION HUB", "REACHED WAREHOUSE", "HANDED OVER TO COURIER", "IN FLIGHT", "MISROUTED", "DELAYED", "UNDELIVERED", "SHIPMENT BOOKED"];
const PRE_PICKUP = ["PICKUP SCHEDULED", "PICKUP GENERATED", "OUT FOR PICKUP", "PICKUP RESCHEDULED", "MANIFEST GENERATED", "READY TO SHIP", "AWB ASSIGNED", "NEW"];
const DELIVERED = ["DELIVERED", "FULFILLED", "SELF FULFILLED"];
const CANCELLED = ["CANCELED", "CANCELLED", "CANCELLED BEFORE DISPATCHED", "CUSTOM CANCELLED"];

// Turns the courier platform's wording into ours. Anything unrecognised (lost, damaged, pickup
// errors…) returns null: it's recorded in the tracking history but doesn't move the order.
export function mapStatus(label: string | undefined | null): ShipmentStatus | null {
  const l = (label ?? "").toUpperCase().replace(/\s+/g, " ").trim();
  if (!l) return null;
  if (DELIVERED.includes(l)) return "DELIVERED";
  if (l === "OUT FOR DELIVERY") return "OUT_FOR_DELIVERY";
  if (l.startsWith("RTO")) return "RTO";
  if (CANCELLED.includes(l)) return "CANCELLED";
  if (IN_TRANSIT.includes(l)) return "IN_TRANSIT";
  if (PRE_PICKUP.includes(l)) return "PICKUP_SCHEDULED";
  return null;
}
