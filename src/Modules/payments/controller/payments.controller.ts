import type { Request, Response } from "express";
import { z } from "zod";
import { paymentsService } from "../service/payments.service.js";
import { requireParam } from "../../../common/params.js";
import { AppError } from "../../../common/errors.js";

const me = (req: Request) => req.customerId!;

const verifySchema = z.object({
  razorpay_order_id: z.string().min(1).max(100),
  razorpay_payment_id: z.string().min(1).max(100),
  razorpay_signature: z.string().min(1).max(200),
});

export const paymentsController = {
  // (Re)start payment for a pending online order.
  async initiate(req: Request, res: Response) {
    res.json({ data: await paymentsService.initiate(me(req), requireParam(req, "number")) });
  },

  async verify(req: Request, res: Response) {
    const input = verifySchema.parse(req.body);
    res.json({ data: await paymentsService.verify(me(req), requireParam(req, "number"), input) });
  },

  async cancel(req: Request, res: Response) {
    res.json({ data: await paymentsService.cancel(me(req), requireParam(req, "number")) });
  },

  // Razorpay → us. The body arrives raw (the signature covers the exact bytes).
  async webhook(req: Request, res: Response) {
    const raw = req.body;
    if (!Buffer.isBuffer(raw)) throw new AppError(400, "INVALID_PAYLOAD", "Expected a JSON body");
    const signature = req.headers["x-razorpay-signature"];
    const eventId = req.headers["x-razorpay-event-id"];
    const result = await paymentsService.handleWebhook(
      raw,
      typeof signature === "string" ? signature : undefined,
      typeof eventId === "string" ? eventId : undefined,
    );
    res.status(200).json(result);
  },
};
