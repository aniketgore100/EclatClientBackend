import type { Request, Response } from "express";
import { siteService } from "../service/site.service.js";

const previewToken = (req: Request) => (typeof req.query.preview === "string" ? req.query.preview : undefined);

// Published content may be cached briefly; a preview must never be.
function cache(res: Response, preview: boolean) {
  res.setHeader("Cache-Control", preview ? "no-store" : "public, max-age=20");
}

export const siteController = {
  async home(req: Request, res: Response) {
    const { preview, page } = await siteService.home(previewToken(req));
    cache(res, preview);
    res.json({ data: page });
  },
  async chrome(req: Request, res: Response) {
    const { preview, chrome } = await siteService.chrome(previewToken(req));
    cache(res, preview);
    res.json({ data: chrome });
  },
};
