import { prisma } from "../../../config/prisma.js";

export const wishlistRepository = {
  // Newest first; products that were later hidden or archived drop out of the list.
  async slugs(customerId: string): Promise<string[]> {
    const rows = await prisma.wishlistItem.findMany({
      where: { customerId, product: { status: "ACTIVE" } },
      orderBy: { createdAt: "desc" },
      select: { product: { select: { slug: true } } },
    });
    return rows.map((r) => r.product.slug);
  },

  count(customerId: string) {
    return prisma.wishlistItem.count({ where: { customerId } });
  },

  findActiveProducts(slugs: string[]) {
    return prisma.product.findMany({ where: { slug: { in: slugs }, status: "ACTIVE" }, select: { id: true, slug: true } });
  },

  async addMany(customerId: string, productIds: string[]) {
    await prisma.wishlistItem.createMany({
      data: productIds.map((productId) => ({ customerId, productId })),
      skipDuplicates: true,
    });
  },

  removeBySlug(customerId: string, slug: string) {
    return prisma.wishlistItem.deleteMany({ where: { customerId, product: { slug } } });
  },
};
