import type { Request, Response } from "express";
import { homepageService } from "../service/homepage.service.js";

export const homepageController = {
  async get(req: Request, res: Response) {
    const preview = typeof req.query.preview === "string" ? req.query.preview : undefined;
    const data = preview ? await homepageService.getPreview(preview) : await homepageService.getPublished();
    res.json({ data });
  },
};
