import type { Request, Response } from "express";
import { categoryService } from "../service/category.service.js";
import { requireParam } from "../../../common/params.js";

export const categoryController = {
  async list(_req: Request, res: Response) {
    res.json({ data: await categoryService.list() });
  },

  async getBySlug(req: Request, res: Response) {
    const slug = requireParam(req, "slug");
    res.json({ data: await categoryService.getBySlug(slug) });
  },
};
