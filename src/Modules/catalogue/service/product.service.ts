import { productRepository, type ProductCard, type ProductDetail } from "../repository/product.repository.js";
import { NotFoundError } from "../../../common/errors.js";
import type { ProductListQuery } from "../dto/product-query.dto.js";

function toCard(product: ProductCard) {
  const prices = product.variants.map((v) => v.price);
  const mrps = product.variants.map((v) => v.mrp);
  const priceFrom = prices.length ? Math.min(...prices) : null;
  const mrpFrom = mrps.length ? Math.min(...mrps) : null;
  const inStock = product.variants.some(
    (v) => (v.inventory?.onHand ?? 0) - (v.inventory?.reserved ?? 0) > 0
  );

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    subtitle: product.subtitle,
    category: product.category,
    images: product.images.map((i) => ({ url: i.url, alt: i.alt })),
    badges: product.badges,
    tags: product.tags,
    isNew: product.isNew,
    grade: product.pearlGrade,
    priceFrom,
    mrpFrom,
    discountPct:
      priceFrom !== null && mrpFrom !== null && mrpFrom > priceFrom
        ? Math.round(((mrpFrom - priceFrom) / mrpFrom) * 100)
        : 0,
    // PRD §5.4: never show a "0.0" rating — hide until at least one approved review.
    rating: product.ratingCount > 0 ? { avg: product.ratingAvg, count: product.ratingCount } : null,
    inStock,
  };
}

function toDetail(product: ProductDetail, related: ProductCard[]) {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    subtitle: product.subtitle,
    description: product.description,
    category: product.category,
    images: product.images.map((i) => ({ url: i.url, alt: i.alt, position: i.position })),
    badges: product.badges,
    tags: product.tags,
    codAllowed: product.codAllowed,
    insured: product.insured,
    pearlPassport: {
      grade: product.pearlGrade,
      type: product.pearlType,
      sizeMm: product.pearlSizeMm,
      colour: product.pearlColour,
      lustre: product.pearlLustre,
      pond: product.pond,
      harvestBatch: product.harvestBatch,
      monthsInWater: product.monthsInWater,
      setting: product.setting,
      purity: product.purity,
    },
    optionTypes: product.optionTypes.map((o) => o.name),
    variants: product.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      options: v.options,
      price: v.price,
      mrp: v.mrp,
      status: v.status,
      inStock: (v.inventory?.onHand ?? 0) - (v.inventory?.reserved ?? 0) > 0,
      images: v.images.map((i) => i.url),
    })),
    rating: product.ratingCount > 0 ? { avg: product.ratingAvg, count: product.ratingCount } : null,
    reviews: product.reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      text: r.text,
      photos: r.photos,
      createdAt: r.createdAt,
      customerName: r.customer?.name ?? "Verified buyer",
    })),
    related: related.map(toCard),
  };
}

export const productService = {
  async list(filters: ProductListQuery) {
    const { data, total } = await productRepository.list(filters);
    return {
      data: data.map(toCard),
      page: filters.page,
      limit: filters.limit,
      total,
    };
  },

  async getBySlug(slug: string) {
    const product = await productRepository.findBySlug(slug);
    if (!product) throw NotFoundError("Product not found", "PRODUCT_NOT_FOUND");

    const related = await productRepository.findRelated(product.categoryId, product.id);
    return toDetail(product, related);
  },
};
