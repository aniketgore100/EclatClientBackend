import type { Request, Response } from "express";
import { ordersService } from "../service/orders.service.js";
import { AppError } from "../../../common/errors.js";
import { createOrderSchema, idempotencyKeySchema } from "../dto/create-order.dto.js";
import { requireParam } from "../../../common/params.js";
import { parseUserAgent } from "../../../common/userAgent.js";

const me = (req: Request) => req.customerId!;

export const ordersController = {
  async create(req: Request, res: Response) {
    const dto = createOrderSchema.parse(req.body);
    const header = req.headers["idempotency-key"];
    if (typeof header !== "string") {
      throw new AppError(400, "IDEMPOTENCY_KEY_REQUIRED", "Send an Idempotency-Key header with each order attempt");
    }
    const key = idempotencyKeySchema.parse(header);
    const { order, replayed } = await ordersService.create(me(req), dto, key, parseUserAgent(req.headers["user-agent"]));
    // 200 when this attempt had already been processed, 201 when it just created the order.
    res.status(replayed ? 200 : 201).json({ data: order });
  },

  async list(req: Request, res: Response) {
    res.json({ data: await ordersService.list(me(req)) });
  },

  async get(req: Request, res: Response) {
    res.json({ data: await ordersService.get(me(req), requireParam(req, "number")) });
  },
};
