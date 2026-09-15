import type { Request, Response } from "express";
import { productService } from "../service/product.service.js";
import { productListQuerySchema } from "../dto/product-query.dto.js";
import { requireParam } from "../../../common/params.js";

export const productController = {
  async list(req: Request, res: Response) {
    const filters = productListQuerySchema.parse(req.query);
    const result = await productService.list(filters);
    res.json(result);
  },

  async getBySlug(req: Request, res: Response) {
    const slug = requireParam(req, "slug");
    const product = await productService.getBySlug(slug);
    res.json({ data: product });
  },
};
