import type { Request, Response } from "express";
import { categoryService } from "../service/category.service.js";
import { requireParam } from "../../../common/params.js";

export const categoryController = {
 
  async list(_req: Request, res: Response) {
    const categories = await categoryService.list();
    console.log("categories :: ", categories);
    res.json({ data: categories });
  },

  async getBySlug(req: Request, res: Response) {
    const slug = requireParam(req, "slug");
    const category = await categoryService.getBySlug(slug);
    res.json({ data: category });
  },

  
};
