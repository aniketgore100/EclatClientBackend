import { prisma } from "../../../config/prisma.js";
import type { ProductGetPayload } from "../../../generated/prisma/models.js";
import type { ProductListQuery } from "../dto/product-query.dto.js";

const cardInclude = {
  category: { select: { slug: true, name: true } },
  images: { orderBy: { position: "asc" as const }, take: 2 },
  variants: { include: { inventory: true } },
} as const;

const detailInclude = {
  category: { select: { slug: true, name: true } },
  images: { orderBy: { position: "asc" as const } },
  optionTypes: true,
  variants: { include: { inventory: true, images: true } },
  reviews: {
    where: { status: "APPROVED" as const },
    orderBy: { createdAt: "desc" as const },
    take: 10,
    select: {
      id: true,
      rating: true,
      title: true,
      text: true,
      photos: true,
      createdAt: true,
      customer: { select: { name: true } },
    },
  },
} as const;

export type ProductCard = ProductGetPayload<{ include: typeof cardInclude }>;
export type ProductDetail = ProductGetPayload<{ include: typeof detailInclude }>;

function buildWhere(filters: ProductListQuery) {
  // Each condition below filters on a *different* variant, so they must be
  // combined inside one `variants.some.AND`, not as separate `variants` keys
  // (which would silently clobber each other via object spread).
  const variantConditions: Record<string, unknown>[] = [];
  if (filters.inStock) {
    variantConditions.push({ inventory: { onHand: { gt: 0 } } });
  }
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    variantConditions.push({
      price: {
        ...(filters.minPrice !== undefined ? { gte: filters.minPrice } : {}),
        ...(filters.maxPrice !== undefined ? { lte: filters.maxPrice } : {}),
      },
    });
  }

  return {
    status: "ACTIVE" as const,
    ...(filters.category ? { category: { slug: filters.category } } : {}),
    ...(filters.grade ? { pearlGrade: filters.grade } : {}),
    ...(filters.metal ? { setting: filters.metal } : {}),
    ...(filters.tag ? { tags: { has: filters.tag } } : {}),
    ...(filters.isNew ? { isNew: true } : {}),
    ...(variantConditions.length ? { variants: { some: { AND: variantConditions } } } : {}),
  };
}

export const productRepository = {
  // Price-based sort is done in-memory below the DB layer since price lives on
  // Variant, not Product — fine at ~40 SKUs; revisit with a denormalized
  // `priceFrom` column if the catalogue grows into the hundreds.
  async list(filters: ProductListQuery): Promise<{ data: ProductCard[]; total: number }> {
    const where = buildWhere(filters);

    if (filters.sort === "price_asc" || filters.sort === "price_desc") {
      const all = await prisma.product.findMany({ where, include: cardInclude });
      const withPrice: { product: ProductCard; priceFrom: number }[] = all.map((p: ProductCard) => ({
        product: p,
        priceFrom: Math.min(...p.variants.map((v) => v.price), Infinity),
      }));
      withPrice.sort((a, b) =>
        filters.sort === "price_asc" ? a.priceFrom - b.priceFrom : b.priceFrom - a.priceFrom
      );
      const total = withPrice.length;
      const start = (filters.page - 1) * filters.limit;
      const data = withPrice.slice(start, start + filters.limit).map((x) => x.product);
      return { data, total };
    }

    const orderBy =
      filters.sort === "newest"
        ? { createdAt: "desc" as const }
        : filters.sort === "rating"
          ? { ratingAvg: "desc" as const }
          : [{ featured: "desc" as const }, { ratingCount: "desc" as const }];

    const [data, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: cardInclude,
        orderBy,
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      prisma.product.count({ where }),
    ]);

    return { data, total };
  },

  findBySlug(slug: string): Promise<ProductDetail | null> {
    return prisma.product.findFirst({
      where: { slug, status: "ACTIVE" },
      include: detailInclude,
    });
  },

  findRelated(categoryId: string, excludeId: string, take = 6): Promise<ProductCard[]> {
    return prisma.product.findMany({
      where: { categoryId, status: "ACTIVE", id: { not: excludeId } },
      include: cardInclude,
      take,
    });
  },
};
