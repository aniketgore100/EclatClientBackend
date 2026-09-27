import type { Request, Response } from "express";
import { createFacetService } from "../service/facet.service.js";

export function createFacetController(service: ReturnType<typeof createFacetService>) {
  return {
    async list(_req: Request, res: Response) {
      const rows = await service.list();
      res.json({ data: rows });
    },
  };
}
