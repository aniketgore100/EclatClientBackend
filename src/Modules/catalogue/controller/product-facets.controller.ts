import { prisma } from "../../../config/prisma.js";
import { createFacetRepository } from "../repository/facet.repository.js";
import { createFacetService } from "../service/facet.service.js";
import { createFacetController } from "./facet.controller.js";

export const productTypeController = createFacetController(
  createFacetService(createFacetRepository(prisma.productType))
);

export const polishController = createFacetController(
  createFacetService(createFacetRepository(prisma.polish))
);

export const stoneController = createFacetController(
  createFacetService(createFacetRepository(prisma.stone))
);

export const pearlColourController = createFacetController(
  createFacetService(createFacetRepository(prisma.pearlColour))
);
