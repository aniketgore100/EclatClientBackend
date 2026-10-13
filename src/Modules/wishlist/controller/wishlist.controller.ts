import type { Request, Response } from "express";
import { wishlistService } from "../service/wishlist.service.js";
import { mergeWishlistSchema, slugParamSchema } from "../dto/wishlist.dto.js";

const me = (req: Request) => req.customerId!;

export const wishlistController = {
  async list(req: Request, res: Response) {
    res.json({ data: await wishlistService.list(me(req)) });
  },

  async add(req: Request, res: Response) {
    const { slug } = slugParamSchema.parse(req.params);
    res.json({ data: await wishlistService.add(me(req), slug) });
  },

  async remove(req: Request, res: Response) {
    const { slug } = slugParamSchema.parse(req.params);
    res.json({ data: await wishlistService.remove(me(req), slug) });
  },

  async merge(req: Request, res: Response) {
    const { slugs } = mergeWishlistSchema.parse(req.body);
    res.json({ data: await wishlistService.merge(me(req), slugs) });
  },
};
