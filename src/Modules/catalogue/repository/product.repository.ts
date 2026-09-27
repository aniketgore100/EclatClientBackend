import { prisma } from "../../../config/prisma.js";
import type { ProductGetPayload } from "../../../generated/prisma/models.js";
import type { ProductListQuery } from "../dto/product-query.dto.js";

const facetSelects = {
  type: { select: { slug: true, name: true } },
  polish: { select: { slug: true, name: true } },
  stone: { select: { slug: true, name: true } },
  pearlColour: { select: { slug: true, name: true, hex: true } },
} as const;

const cardInclude = {
  category: { select: { slug: true, name: true } },
  images: { orderBy: { position: "asc" as const }, take: 2 },
  variants: { include: { inventory: true } },
  ...facetSelects,
} as const;

const detailInclude = {
  category: { select: { slug: true, name: true } },
  images: { orderBy: { position: "asc" as const } },
  optionTypes: true,
  variants: { include: { inventory: true, images: true } },
  attributes: { orderBy: { position: "asc" as const } },
  ...facetSelects,
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
    ...(filters.type ? { type: { slug: filters.type } } : {}),
    ...(filters.polish ? { polish: { slug: filters.polish } } : {}),
    ...(filters.colour ? { pearlColour: { slug: filters.colour } } : {}),
    ...(filters.stone ? { stone: { slug: filters.stone } } : {}),
    ...(filters.occasion ? { occasions: { has: filters.occasion } } : {}),
    ...(filters.grade ? { pearlGrade: filters.grade } : {}),
    // `setting` doubles as the metal/material facet (e.g. "925 Silver") —
    // there is no separate metal column, see product.repository seed data.
    ...(filters.metal ? { setting: filters.metal } : {}),
    ...(filters.tag ? { tags: { has: filters.tag } } : {}),
    ...(filters.isNew ? { isNew: true } : {}),
    ...(variantConditions.length ? { variants: { some: { AND: variantConditions } } } : {}),
  };
}

export const productRepository = {

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

  // For homepage sections that reference specific products by id (chosen in
  // the admin) — order isn't preserved by `id: { in }`, callers re-sort to
  // match the admin's chosen order.
  findByIds(ids: string[]): Promise<ProductCard[]> {
    if (!ids.length) return Promise.resolve([]);
    return prisma.product.findMany({ where: { id: { in: ids }, status: "ACTIVE" }, include: cardInclude });
  },
};
