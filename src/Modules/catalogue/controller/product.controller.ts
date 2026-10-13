import type { Request, Response } from "express";
import { productService } from "../service/product.service.js";
import { productListQuerySchema } from "../dto/product-query.dto.js";
import { requireParam } from "../../../common/params.js";

export const productController = {
  async list(req: Request, res: Response) {
    const filters = productListQuerySchema.parse(req.query);
    res.json({ data: await productService.list(filters) });
  },

  async getBySlug(req: Request, res: Response) {
    const slug = requireParam(req, "slug");
    res.json({ data: await productService.getBySlug(slug) });
  },

  async reviews(req: Request, res: Response) {
    const slug = requireParam(req, "slug");
    res.json({ data: await productService.reviews(slug) });
  },
};
