import { prisma } from "../../../config/prisma.js";
import type { ProductGetPayload } from "../../../generated/prisma/models.js";
import type { Prisma } from "../../../generated/prisma/client.js";
import type { ProductListQuery } from "../dto/product-query.dto.js";

// Only variants that can actually be sold reach the storefront.
const include = {
  category: { select: { slug: true, name: true } },
  images: { orderBy: { position: "asc" as const } },
  variants: { where: { status: "ACTIVE" as const }, include: { inventory: true }, orderBy: { sku: "asc" as const } },
  attributes: { orderBy: { position: "asc" as const } },
} as const;

export type StorefrontProduct = ProductGetPayload<{ include: typeof include }>;

function buildWhere(filters: ProductListQuery): Prisma.ProductWhereInput {
  const and: Prisma.ProductWhereInput[] = [{ status: "ACTIVE", category: { status: "ACTIVE" } }];
  if (filters.category.length) and.push({ category: { slug: { in: filters.category } } });
  if (filters.collection.length) and.push({ tags: { hasSome: filters.collection } });
  if (filters.slugs.length) and.push({ slug: { in: filters.slugs } });
  if (filters.q) {
    and.push({
      OR: [
        { name: { contains: filters.q, mode: "insensitive" } },
        { subtitle: { contains: filters.q, mode: "insensitive" } },
        { category: { slug: { contains: filters.q, mode: "insensitive" } } },
        { tags: { has: filters.q.toLowerCase() } },
      ],
    });
  }
  return { AND: and };
}

export const productRepository = {
  // Variant-derived filters (metal, size, price, stock) and sorting happen in the service on the
  // whole matching set — a jewellery catalogue is hundreds of rows at most, so this stays cheap
  // and keeps price/stock semantics in one place.
  findMatching(filters: ProductListQuery): Promise<StorefrontProduct[]> {
    return prisma.product.findMany({ where: buildWhere(filters), include });
  },

  findBySlug(slug: string): Promise<StorefrontProduct | null> {
    return prisma.product.findFirst({ where: { slug, status: "ACTIVE", category: { status: "ACTIVE" } }, include });
  },

  findApprovedReviews(productId: string) {
    return prisma.review.findMany({
      where: { productId, status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        rating: true,
        title: true,
        text: true,
        orderId: true,
        createdAt: true,
        customer: { select: { name: true } },
      },
    });
  },

  findIdBySlug(slug: string) {
    return prisma.product.findFirst({ where: { slug, status: "ACTIVE" }, select: { id: true, ratingAvg: true, ratingCount: true } });
  },
};
