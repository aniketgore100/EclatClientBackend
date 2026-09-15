import { prisma } from "../../../config/prisma.js";
import type { CategoryGetPayload } from "../../../generated/prisma/models.js";

export const categoryRepository = {
  findActive(): Promise<CategoryGetPayload<object>[]> {
    return prisma.category.findMany({
      where: { status: "ACTIVE" },
      orderBy: { position: "asc" },
    });
  },

  findBySlug(slug: string): Promise<CategoryGetPayload<object> | null> {
    return prisma.category.findFirst({
      where: { slug, status: "ACTIVE" },
    });
  },
};
