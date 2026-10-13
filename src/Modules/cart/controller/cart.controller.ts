import type { Request, Response } from "express";
import { cartService } from "../service/cart.service.js";
import { addItemSchema, mergeSchema, setQuantitySchema, variantParamSchema } from "../dto/cart.dto.js";

const me = (req: Request) => req.customerId!;

export const cartController = {
  async get(req: Request, res: Response) {
    res.json({ data: await cartService.get(me(req)) });
  },

  async addItem(req: Request, res: Response) {
    const { variantId, quantity } = addItemSchema.parse(req.body);
    res.json({ data: await cartService.addItem(me(req), variantId, quantity) });
  },

  async setQuantity(req: Request, res: Response) {
    const { variantId } = variantParamSchema.parse(req.params);
    const { quantity } = setQuantitySchema.parse(req.body);
    res.json({ data: await cartService.setQuantity(me(req), variantId, quantity) });
  },

  async removeItem(req: Request, res: Response) {
    const { variantId } = variantParamSchema.parse(req.params);
    res.json({ data: await cartService.removeItem(me(req), variantId) });
  },

  async clear(req: Request, res: Response) {
    res.json({ data: await cartService.clear(me(req)) });
  },

  async merge(req: Request, res: Response) {
    const { items } = mergeSchema.parse(req.body);
    res.json({ data: await cartService.merge(me(req), items) });
  },
};
