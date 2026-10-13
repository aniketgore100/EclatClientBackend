import { productRepository, type StorefrontProduct } from "../repository/product.repository.js";
import { NotFoundError } from "../../../common/errors.js";
import type { ProductListQuery } from "../dto/product-query.dto.js";

// Shape of the storefront's data contract (see the storefront's src/api/types.js).
// Prices are stored in paise; the storefront deals in whole rupees.
const rupees = (paise: number) => Math.round(paise / 100);
const LOW_STOCK_AT = 5;
const SHIPPING_COPY = "Free shipping above ₹999. Ships in 24 hours. COD available. 7-day returns on unworn pieces.";

const stockOf = (v: StorefrontProduct["variants"][number]) => Math.max(0, (v.inventory?.onHand ?? 0) - (v.inventory?.reserved ?? 0));
const optionsOf = (v: StorefrontProduct["variants"][number]) => (v.options ?? {}) as Record<string, string>;

function lowestVariant(p: StorefrontProduct) {
  return p.variants.reduce((low, v) => (v.price < low.price ? v : low), p.variants[0]!);
}

function toImages(p: StorefrontProduct) {
  return p.images.map((i) => ({ url: i.url, alt: i.alt ?? p.name, kind: i.kind, position: i.position }));
}

function toSummary(p: StorefrontProduct) {
  const low = lowestVariant(p);
  const stock = p.variants.reduce((n, v) => n + stockOf(v), 0);
  const metals = [...new Set(p.variants.map((v) => optionsOf(v).metal).filter(Boolean))];
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: p.category.slug,
    collections: p.tags,
    badges: p.badges,
    price: rupees(low.price),
    compareAtPrice: low.mrp > low.price ? rupees(low.mrp) : null,
    metals,
    hasSizes: p.variants.some((v) => optionsOf(v).size !== undefined),
    defaultVariantId: (p.variants.find((v) => stockOf(v) > 0) ?? p.variants[0]!).id,
    images: toImages(p).slice(0, 2),
    inStock: stock > 0,
    lowStock: stock > 0 && stock <= LOW_STOCK_AT,
    rating: p.ratingCount > 0 ? Math.round(p.ratingAvg * 10) / 10 : null,
    reviewCount: p.ratingCount,
  };
}

// One option per key found on the variants ("metal", "size"), values in first-seen order.
function toOptions(p: StorefrontProduct) {
  const byName = new Map<string, string[]>();
  for (const v of p.variants) {
    for (const [name, value] of Object.entries(optionsOf(v))) {
      const values = byName.get(name) ?? [];
      if (!values.includes(value)) values.push(value);
      byName.set(name, values);
    }
  }
  return [...byName].map(([name, values]) => ({ name, label: name.charAt(0).toUpperCase() + name.slice(1), values }));
}

function toDetail(p: StorefrontProduct) {
  return {
    ...toSummary(p),
    subtitle: p.subtitle ?? "",
    options: toOptions(p),
    variants: p.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      options: optionsOf(v),
      price: rupees(v.price),
      stock: stockOf(v),
    })),
    images: toImages(p),
    description: p.description ?? "",
    details: { material: p.material ?? "", care: p.care ?? "", shipping: SHIPPING_COPY },
    attributes: p.attributes.map((a) => ({ label: a.label, value: a.value })),
    codAllowed: p.codAllowed,
    pairsWith: [] as string[],
    sortOrder: p.sortOrder,
    isActive: true,
    seo: { title: p.seoTitle ?? `${p.name} — Eclat Empire`, description: p.seoMeta ?? p.subtitle ?? "" },
    createdAt: p.createdAt.toISOString(),
  };
}

export const productService = {
  async list(f: ProductListQuery) {
    const lower = (a: string[]) => a.map((s) => s.toLowerCase());
    const metals = lower(f.metal);
    const sizes = lower(f.size);

    // A product with no sellable variant has no price to show, so it stays off the storefront.
    let items = (await productRepository.findMatching(f)).filter((p) => p.variants.length > 0);

    items = items.filter((p) => {
      const price = rupees(lowestVariant(p).price);
      return (
        (!metals.length || p.variants.some((v) => metals.includes((optionsOf(v).metal ?? "").toLowerCase()))) &&
        (!sizes.length || p.variants.some((v) => sizes.includes((optionsOf(v).size ?? "").toLowerCase()))) &&
        (f.price_min === undefined || price >= f.price_min) &&
        (f.price_max === undefined || price <= f.price_max) &&
        (f.in_stock !== "true" || p.variants.some((v) => stockOf(v) > 0))
      );
    });

    const price = (p: StorefrontProduct) => lowestVariant(p).price;
    const sorters: Record<ProductListQuery["sort"], (a: StorefrontProduct, b: StorefrontProduct) => number> = {
      featured: (a, b) => a.sortOrder - b.sortOrder || b.createdAt.getTime() - a.createdAt.getTime(),
      newest: (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      price_asc: (a, b) => price(a) - price(b),
      price_desc: (a, b) => price(b) - price(a),
      rating: (a, b) => b.ratingAvg - a.ratingAvg,
    };
    items.sort(sorters[f.sort]);
    if (f.slugs.length) items.sort((a, b) => f.slugs.indexOf(a.slug) - f.slugs.indexOf(b.slug));

    const total = items.length;
    return {
      items: items.slice((f.page - 1) * f.limit, f.page * f.limit).map(toSummary),
      total,
      page: f.page,
      limit: f.limit,
      pages: Math.max(1, Math.ceil(total / f.limit)),
    };
  },

  async getBySlug(slug: string) {
    const product = await productRepository.findBySlug(slug);
    if (!product || product.variants.length === 0) throw NotFoundError("Product not found", "PRODUCT_NOT_FOUND");
    return toDetail(product);
  },

  async reviews(slug: string) {
    const product = await productRepository.findIdBySlug(slug);
    if (!product) throw NotFoundError("Product not found", "PRODUCT_NOT_FOUND");
    const rows = await productRepository.findApprovedReviews(product.id);
    return {
      average: product.ratingCount > 0 ? Math.round(product.ratingAvg * 10) / 10 : null,
      count: product.ratingCount,
      items: rows.map((r) => ({
        id: r.id,
        author: r.customer.name ?? "Verified buyer",
        rating: r.rating,
        body: r.text ?? r.title ?? "",
        verified: r.orderId !== null,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  },
};
