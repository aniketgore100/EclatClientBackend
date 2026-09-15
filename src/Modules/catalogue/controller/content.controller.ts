import type { Request, Response } from "express";
import { contentService } from "../service/content.service.js";
import { requireParam } from "../../../common/params.js";

export const contentController = {
  async getHome(_req: Request, res: Response) {
    const data = await contentService.getHome();
    res.json({ data });
  },

  async getByKey(req: Request, res: Response) {
    const key = requireParam(req, "key");
    const data = await contentService.getByKey(key);
    res.json({ data });
  },
};
