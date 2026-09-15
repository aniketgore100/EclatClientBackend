import { prisma } from "../../../config/prisma.js";
import type { ContentGetPayload } from "../../../generated/prisma/models.js";

export const contentRepository = {
  findByKey(key: string): Promise<ContentGetPayload<object> | null> {
    return prisma.content.findUnique({ where: { key } });
  },

  findByKeys(keys: string[]): Promise<ContentGetPayload<object>[]> {
    return prisma.content.findMany({ where: { key: { in: keys } } });
  },
};
