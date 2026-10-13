import type { Request, Response } from "express";
import { courierWebhookService } from "../service/courier-webhook.service.js";

export const courierController = {
  // Shiprocket → us. It expects a plain 200; every refusal (bad token) is a 401 so it shows as failed
  // in their dashboard rather than silently succeeding.
  async webhook(req: Request, res: Response) {
    const header = req.headers["x-api-key"];
    const result = await courierWebhookService.handle(typeof header === "string" ? header : undefined, req.body);
    res.status(200).json(result);
  },
};
