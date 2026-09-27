import { prisma } from "../../../config/prisma.js";
import type { HomepageSectionGetPayload, ContentGetPayload } from "../../../generated/prisma/models.js";

export type HomepageSectionRow = HomepageSectionGetPayload<object>;

const STATUS_KEY = "homepage.status";

export const homepageRepository = {
  findPublishedSections(): Promise<HomepageSectionRow[]> {
    return prisma.homepageSection.findMany({
      where: { publishedEnabled: true },
      orderBy: { publishedOrder: "asc" },
    });
  },

  findDraftSections(): Promise<HomepageSectionRow[]> {
    return prisma.homepageSection.findMany({
      where: { enabled: true },
      orderBy: { order: "asc" },
    });
  },

  getStatus(): Promise<ContentGetPayload<object> | null> {
    return prisma.content.findUnique({ where: { key: STATUS_KEY } });
  },

  findValidPreviewToken(token: string) {
    return prisma.homepagePreviewToken.findFirst({
      where: { token, expiresAt: { gt: new Date() } },
    });
  },
};
