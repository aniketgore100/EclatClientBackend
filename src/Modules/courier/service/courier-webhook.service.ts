import crypto from "node:crypto";
import { prisma } from "../../../config/prisma.js";
import { env } from "../../../config/env.js";
import { AppError } from "../../../common/errors.js";
import { mapStatus, RANK } from "./status-map.js";

interface Scan {
  date?: string;
  status?: string;
  activity?: string;
  location?: string;
  "sr-status"?: string | number;
}
interface Payload {
  awb?: string | number;
  current_status?: string;
  shipment_status?: string;
  current_timestamp?: string;
  order_id?: string;
  sr_order_id?: string | number;
  etd?: string;
  scans?: Scan[];
  is_return?: number | boolean;
}

// Shiprocket reports times in India time.
const parseIst = (v: string | undefined): Date | null => {
  if (!v) return null;
  const d = new Date(`${v.trim().replace(" ", "T")}+05:30`);
  return Number.isNaN(d.getTime()) ? null : d;
};

const sameToken = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

export const courierWebhookService = {
  // `token` is what the request sent in x-api-key. Shiprocket gives us nothing stronger than a shared
  // secret, so it's compared in constant time, and unknown parcels are ignored rather than trusted.
  async handle(token: string | undefined, body: unknown) {
    if (!env.SHIPROCKET_WEBHOOK_TOKEN) {
      throw new AppError(503, "WEBHOOK_NOT_CONFIGURED", "Shipping webhook isn't configured");
    }
    if (!token || !sameToken(token, env.SHIPROCKET_WEBHOOK_TOKEN)) {
      throw new AppError(401, "INVALID_TOKEN", "Invalid webhook token");
    }
    if (typeof body !== "object" || body === null) throw new AppError(400, "INVALID_PAYLOAD", "Expected a JSON body");

    const p = body as Payload;
    const awb = p.awb !== undefined && p.awb !== null ? String(p.awb) : "";
    if (!awb) return { handled: false, reason: "no awb" };

    const shipment =
      (await prisma.shipment.findUnique({ where: { awb } })) ??
      (p.sr_order_id ? await prisma.shipment.findUnique({ where: { providerOrderId: String(p.sr_order_id) } }) : null);
    // A parcel we never created (another store on the same account, a typo): acknowledge and move on.
    if (!shipment) return { handled: false, reason: "unknown shipment" };

    const rawStatus = (p.current_status ?? p.shipment_status ?? "").trim();
    const mapped = mapStatus(rawStatus);
    const scans = Array.isArray(p.scans) ? p.scans : [];
    const fingerprint = (parts: (string | undefined)[]) => crypto.createHash("sha1").update(parts.map((x) => x ?? "").join("|")).digest("hex");

    const events = scans
      .map((s) => ({ at: parseIst(s.date), s }))
      .filter((x): x is { at: Date; s: Scan } => x.at !== null)
      .map(({ at, s }) => ({
        shipmentId: shipment.id,
        fingerprint: fingerprint([s.date, String(s["sr-status"] ?? ""), s.status, s.activity, s.location]),
        status: (s.status || s.activity || rawStatus || "UPDATE").toUpperCase(),
        activity: s.activity ?? null,
        location: s.location ?? null,
        occurredAt: at,
      }));
    if (events.length === 0 && rawStatus) {
      const at = parseIst(p.current_timestamp) ?? new Date();
      events.push({ shipmentId: shipment.id, fingerprint: fingerprint([awb, p.current_timestamp, rawStatus]), status: rawStatus.toUpperCase(), activity: null, location: null, occurredAt: at });
    }

    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM shipments WHERE id = ${shipment.id} FOR UPDATE`;
      if (events.length) await tx.shipmentEvent.createMany({ data: events, skipDuplicates: true });

      const current = await tx.shipment.findUniqueOrThrow({ where: { id: shipment.id } });
      const etd = parseIst(p.etd);
      const data: Record<string, unknown> = { ...(rawStatus ? { rawStatus } : {}), ...(etd ? { etd } : {}) };

      // Forward only — except that a cancellation or a return always wins over "in transit".
      // A parcel that is already delivered or cancelled is finished: nothing moves it again.
      const finished = current.status === "CANCELLED" || current.status === "DELIVERED";
      const advance = mapped !== null && !finished && RANK[mapped] > RANK[current.status];
      if (advance && mapped) {
        data.status = mapped;
        if (mapped === "DELIVERED") data.deliveredAt = events.at(-1)?.occurredAt ?? new Date();
      }
      await tx.shipment.update({ where: { id: shipment.id }, data });

      // The order follows the parcel. Orders that are cancelled or already done are left alone.
      const status = advance ? mapped : null;
      if (status === "IN_TRANSIT" || status === "OUT_FOR_DELIVERY") {
        await tx.order.updateMany({ where: { id: shipment.orderId, status: "CONFIRMED" }, data: { status: "SHIPPED", shippedAt: new Date() } });
      } else if (status === "DELIVERED") {
        await tx.order.updateMany({ where: { id: shipment.orderId, status: { in: ["CONFIRMED", "SHIPPED"] } }, data: { status: "DELIVERED", deliveredAt: new Date() } });
        // A delivery message can arrive without an earlier "shipped": fill that in only if it was never set.
        await tx.order.updateMany({ where: { id: shipment.orderId, shippedAt: null }, data: { shippedAt: new Date() } });
      } else if (status === "CANCELLED") {
        // Cancelled on the courier side: the order goes back to "confirmed, not shipped".
        await tx.order.updateMany({ where: { id: shipment.orderId, status: "SHIPPED" }, data: { status: "CONFIRMED", shippedAt: null } });
      }
    });

    return { handled: true, status: mapped ?? "recorded" };
  },
};
