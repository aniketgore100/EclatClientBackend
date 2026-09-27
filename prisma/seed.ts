import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Placeholder image generator — swap for real S3/CloudFront URLs once the
// admin media pipeline (F-13) exists. Nothing downstream needs to change:
// storefront just reads Product/ProductImage.url from the DB either way.
const img = (label: string, bg = "F6F4EF", fg = "0F3D3E") =>
  `https://placehold.co/1200x1200/${bg}/${fg}?text=${encodeURIComponent(label)}`;

// Single entity for both product taxonomy (Product.categoryId, exactly one
// per product) and the storefront's curated home-page tiles — formerly a
// separate Collection model, merged into Category. Admin manages this one
// list; the storefront reads this same list everywhere.
const CATEGORIES = [
  {
    name: "Necklaces",
    slug: "necklaces",
    eyebrow: "Necklaces",
    title: "Strands worth returning to",
    text: "Single strands, layered pieces and pendants — graded by hand, finished to last.",
    caption: "The everyday strand",
    position: 1,
  },
  {
    name: "Earrings",
    slug: "earrings",
    eyebrow: "Earrings",
    title: "Studs, drops and jhumkas",
    text: "From minimal studs for daily wear to statement drops for the evening.",
    caption: "Light enough to forget",
    position: 2,
  },
  {
    name: "Rings",
    slug: "rings",
    eyebrow: "Rings",
    title: "A single pearl, set to last",
    text: "Adjustable bands and solitaire settings, sized to fit comfortably.",
    caption: "One size, well made",
    position: 3,
  },
  {
    name: "Bracelets",
    slug: "bracelets",
    eyebrow: "Bracelets",
    title: "Everyday pearls, worn loose",
    text: "Stretch cords and charm bracelets for effortless daily wear.",
    caption: "Worn every day",
    position: 4,
  },
] as const;

type SeedVariant = {
  label: string;
  price: number; // paise
  mrp: number; // paise
  stock: number;
};

// Storefront filter-drawer facets — admin-managed lookup rows (ProductType,
// Polish, Stone, PearlColour models), not fixed enums. This starter set is
// just seed data: admin can add/rename/retire any of these later without a
// migration.
const PRODUCT_TYPES = [
  { slug: "necklace", name: "Necklace", position: 1 },
  { slug: "pendant", name: "Pendant", position: 2 },
  { slug: "earrings", name: "Earrings", position: 3 },
  { slug: "bracelet", name: "Bracelet", position: 4 },
  { slug: "ring", name: "Ring", position: 5 },
] as const;

const POLISHES = [
  { slug: "gold", name: "Gold polish", position: 1 },
  { slug: "rose-gold", name: "Rose gold polish", position: 2 },
  { slug: "silver", name: "Silver polish", position: 3 },
  { slug: "rhodium", name: "Rhodium polish", position: 4 },
] as const;

const STONES = [
  { slug: "none", name: "No stone", position: 1 },
  { slug: "cz", name: "CZ", position: 2 },
  { slug: "ruby", name: "Ruby", position: 3 },
  { slug: "emerald", name: "Emerald", position: 4 },
  { slug: "sapphire", name: "Sapphire", position: 5 },
] as const;

const PEARL_COLOURS = [
  { slug: "white", name: "White", hex: "#F8F6F1", position: 1 },
  { slug: "cream", name: "Cream", hex: "#EFE0C4", position: 2 },
  { slug: "peach", name: "Peach", hex: "#EDB9A0", position: 3 },
  { slug: "lavender", name: "Lavender", hex: "#C9BFE3", position: 4 },
  { slug: "grey", name: "Grey", hex: "#A7A49E", position: 5 },
] as const;

type SeedProduct = {
  category: (typeof CATEGORIES)[number]["slug"];
  name: string;
  slug: string;
  subtitle: string;
  description: string;
  featured?: boolean;
  isNew?: boolean;
  tags: string[];
  badges: string[];
  type: (typeof PRODUCT_TYPES)[number]["slug"];
  polish?: (typeof POLISHES)[number]["slug"];
  stone?: (typeof STONES)[number]["slug"];
  occasions: string[];
  displaySoldCount: number;
  pearl: {
    pearlType: string;
    pearlGrade: string;
    pearlSizeMm: number;
    pearlColour: (typeof PEARL_COLOURS)[number]["slug"];
    pearlLustre: string;
    pond: string;
    harvestBatch: string;
    monthsInWater: number;
    setting: string;
    purity: string;
  };
  variants: SeedVariant[];
};

const PRODUCTS: SeedProduct[] = [
  {
    category: "necklaces",
    name: "Neer Freshwater Pearl Necklace",
    slug: "neer-freshwater-pearl-necklace",
    subtitle: "Single-strand, 925 silver clasp",
    description:
      "A single strand of AA-grade freshwater pearls grown on our own farm, finished with a hallmarked 925 silver clasp.",
    featured: true,
    isNew: true,
    tags: ["everyday", "wedding-guest", "gifting"],
    badges: ["Freshwater pearl", "925 silver", "Hypoallergenic", "Grown on our farm"],
    type: "necklace",
    polish: "silver",
    stone: "none",
    occasions: ["work", "wedding"],
    displaySoldCount: 1200,
    pearl: {
      pearlType: "Freshwater",
      pearlGrade: "AA",
      pearlSizeMm: 8,
      pearlColour: "white",
      pearlLustre: "High",
      pond: "Pond 3, Solapur",
      harvestBatch: "H2026-03",
      monthsInWater: 18,
      setting: "925 Silver",
      purity: "92.5%",
    },
    variants: [
      { label: '16"', price: 349900, mrp: 419900, stock: 12 },
      { label: '18"', price: 379900, mrp: 449900, stock: 9 },
    ],
  },
  {
    category: "necklaces",
    name: "Lotus Layered Pearl Necklace",
    slug: "lotus-layered-pearl-necklace",
    subtitle: "Double-strand statement piece",
    description:
      "Two layered strands of graduated AAA pearls for a fuller, statement look — perfect for festive occasions.",
    tags: ["festive", "party"],
    badges: ["Freshwater pearl", "925 silver", "Hypoallergenic"],
    type: "necklace",
    polish: "silver",
    stone: "none",
    occasions: ["festive", "cocktail"],
    displaySoldCount: 640,
    pearl: {
      pearlType: "Freshwater",
      pearlGrade: "AAA",
      pearlSizeMm: 9,
      pearlColour: "peach",
      pearlLustre: "Very High",
      pond: "Pond 1, Solapur",
      harvestBatch: "H2026-02",
      monthsInWater: 22,
      setting: "925 Silver",
      purity: "92.5%",
    },
    variants: [{ label: '18"', price: 589900, mrp: 699900, stock: 5 }],
  },
  {
    category: "earrings",
    name: "Dew Pearl Studs",
    slug: "dew-pearl-studs",
    subtitle: "Everyday single-pearl studs",
    description: "Minimal single-pearl studs in 925 silver, light enough for all-day wear.",
    featured: true,
    tags: ["everyday", "work"],
    badges: ["Freshwater pearl", "925 silver", "Hypoallergenic", "Grown on our farm"],
    type: "earrings",
    polish: "silver",
    stone: "none",
    occasions: ["work", "casual"],
    displaySoldCount: 3100,
    pearl: {
      pearlType: "Freshwater",
      pearlGrade: "A",
      pearlSizeMm: 6,
      pearlColour: "white",
      pearlLustre: "High",
      pond: "Pond 2, Solapur",
      harvestBatch: "H2026-03",
      monthsInWater: 14,
      setting: "925 Silver",
      purity: "92.5%",
    },
    variants: [{ label: "Standard", price: 149900, mrp: 179900, stock: 30 }],
  },
  {
    category: "earrings",
    name: "Tidal Pearl Drops",
    slug: "tidal-pearl-drops",
    subtitle: "Drop earrings, wedding guest ready",
    description: "Drop-style earrings pairing an AA pearl with a delicate silver chain.",
    isNew: true,
    tags: ["wedding-guest", "party"],
    badges: ["Freshwater pearl", "925 silver", "Hypoallergenic"],
    type: "earrings",
    polish: "silver",
    stone: "none",
    occasions: ["wedding", "cocktail"],
    displaySoldCount: 2600,
    pearl: {
      pearlType: "Freshwater",
      pearlGrade: "AA",
      pearlSizeMm: 7,
      pearlColour: "white",
      pearlLustre: "High",
      pond: "Pond 3, Solapur",
      harvestBatch: "H2026-01",
      monthsInWater: 16,
      setting: "925 Silver",
      purity: "92.5%",
    },
    variants: [{ label: "Standard", price: 219900, mrp: 259900, stock: 18 }],
  },
  {
    category: "rings",
    name: "Solitaire Pearl Ring",
    slug: "solitaire-pearl-ring",
    subtitle: "Single pearl, adjustable band",
    description: "A single AA-grade pearl set on an adjustable 925 silver band — one size fits most.",
    tags: ["everyday", "gifting"],
    badges: ["Freshwater pearl", "925 silver", "Hypoallergenic", "Grown on our farm"],
    type: "ring",
    polish: "silver",
    stone: "none",
    occasions: ["casual", "weekend"],
    displaySoldCount: 410,
    pearl: {
      pearlType: "Freshwater",
      pearlGrade: "AA",
      pearlSizeMm: 7,
      pearlColour: "white",
      pearlLustre: "High",
      pond: "Pond 1, Solapur",
      harvestBatch: "H2026-02",
      monthsInWater: 18,
      setting: "925 Silver",
      purity: "92.5%",
    },
    variants: [
      { label: "Size 6", price: 189900, mrp: 219900, stock: 10 },
      { label: "Size 7", price: 189900, mrp: 219900, stock: 14 },
      { label: "Size 8", price: 189900, mrp: 219900, stock: 8 },
    ],
  },
  {
    category: "rings",
    name: "Duet Pearl Ring",
    slug: "duet-pearl-ring",
    subtitle: "Two-pearl asymmetric design",
    description: "An asymmetric two-pearl design in high-polish 925 silver.",
    tags: ["work", "party"],
    badges: ["Freshwater pearl", "925 silver", "Hypoallergenic"],
    type: "ring",
    polish: "silver",
    stone: "none",
    occasions: ["work", "cocktail"],
    displaySoldCount: 260,
    pearl: {
      pearlType: "Freshwater",
      pearlGrade: "A",
      pearlSizeMm: 6,
      pearlColour: "white",
      pearlLustre: "High",
      pond: "Pond 2, Solapur",
      harvestBatch: "H2026-03",
      monthsInWater: 15,
      setting: "925 Silver",
      purity: "92.5%",
    },
    variants: [
      { label: "Size 6", price: 169900, mrp: 199900, stock: 11 },
      { label: "Size 7", price: 169900, mrp: 199900, stock: 13 },
    ],
  },
  {
    category: "bracelets",
    name: "Harvest Pearl Bracelet",
    slug: "harvest-pearl-bracelet",
    subtitle: "Single-row stretch bracelet",
    description: "A single row of uniform A-grade pearls on a comfortable stretch cord.",
    featured: true,
    tags: ["everyday", "gifting"],
    badges: ["Freshwater pearl", "Hypoallergenic", "Grown on our farm"],
    type: "bracelet",
    stone: "none",
    occasions: ["casual", "weekend"],
    displaySoldCount: 540,
    pearl: {
      pearlType: "Freshwater",
      pearlGrade: "A",
      pearlSizeMm: 7,
      pearlColour: "white",
      pearlLustre: "Medium",
      pond: "Pond 4, Solapur",
      harvestBatch: "H2026-01",
      monthsInWater: 12,
      setting: "Stretch cord",
      purity: "-",
    },
    variants: [{ label: "Standard", price: 99900, mrp: 129900, stock: 40 }],
  },
  {
    category: "bracelets",
    name: "Sea Charm Pearl Bracelet",
    slug: "sea-charm-pearl-bracelet",
    subtitle: "Pearl + silver charm bracelet",
    description: "Freshwater pearls alternating with 925 silver beads and a wave charm.",
    tags: ["gifting", "festive"],
    badges: ["Freshwater pearl", "925 silver", "Hypoallergenic"],
    type: "bracelet",
    polish: "silver",
    stone: "none",
    occasions: ["festive", "weekend"],
    displaySoldCount: 980,
    pearl: {
      pearlType: "Freshwater",
      pearlGrade: "A",
      pearlSizeMm: 6,
      pearlColour: "white",
      pearlLustre: "Medium",
      pond: "Pond 4, Solapur",
      harvestBatch: "H2026-02",
      monthsInWater: 13,
      setting: "925 Silver",
      purity: "92.5%",
    },
    variants: [{ label: "Standard", price: 139900, mrp: 169900, stock: 20 }],
  },
];

async function main() {
  console.log("Seeding categories...");
  const categoryBySlug = new Map<string, string>();
  for (const c of CATEGORIES) {
    const row = await prisma.category.upsert({
      where: { slug: c.slug },
      update: {
        name: c.name,
        eyebrow: c.eyebrow,
        title: c.title,
        text: c.text,
        caption: c.caption,
        position: c.position,
      },
      create: {
        name: c.name,
        slug: c.slug,
        eyebrow: c.eyebrow,
        title: c.title,
        text: c.text,
        caption: c.caption,
        position: c.position,
        image: img(c.name),
        description: `${c.name} — real, farm-grown freshwater pearls.`,
      },
    });
    categoryBySlug.set(c.slug, row.id);
  }

  console.log("Seeding product types, polishes, stones, pearl colours...");
  const typeBySlug = new Map<string, string>();
  for (const t of PRODUCT_TYPES) {
    const row = await prisma.productType.upsert({
      where: { slug: t.slug },
      update: { name: t.name, position: t.position },
      create: t,
    });
    typeBySlug.set(t.slug, row.id);
  }

  const polishBySlug = new Map<string, string>();
  for (const p of POLISHES) {
    const row = await prisma.polish.upsert({
      where: { slug: p.slug },
      update: { name: p.name, position: p.position },
      create: p,
    });
    polishBySlug.set(p.slug, row.id);
  }

  const stoneBySlug = new Map<string, string>();
  for (const s of STONES) {
    const row = await prisma.stone.upsert({
      where: { slug: s.slug },
      update: { name: s.name, position: s.position },
      create: s,
    });
    stoneBySlug.set(s.slug, row.id);
  }

  const pearlColourBySlug = new Map<string, string>();
  for (const c of PEARL_COLOURS) {
    const row = await prisma.pearlColour.upsert({
      where: { slug: c.slug },
      update: { name: c.name, hex: c.hex, position: c.position },
      create: c,
    });
    pearlColourBySlug.set(c.slug, row.id);
  }

  console.log("Seeding products...");
  for (const p of PRODUCTS) {
    const categoryId = categoryBySlug.get(p.category)!;
    const { pearl, ...rest } = p;
    const { pearlColour, ...pearlRest } = pearl;
    const productData = {
      categoryId,
      name: rest.name,
      subtitle: rest.subtitle,
      description: rest.description,
      status: "ACTIVE" as const,
      featured: rest.featured ?? false,
      isNew: rest.isNew ?? false,
      tags: rest.tags,
      badges: rest.badges,
      typeId: typeBySlug.get(rest.type)!,
      polishId: rest.polish ? polishBySlug.get(rest.polish) : undefined,
      stoneId: stoneBySlug.get(rest.stone ?? "none")!,
      occasions: rest.occasions,
      displaySoldCount: rest.displaySoldCount,
      ...pearlRest,
      pearlColourId: pearlColourBySlug.get(pearlColour)!,
      seoTitle: rest.name,
      seoOgImage: img(rest.name),
    };

    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: productData,
      create: {
        ...productData,
        slug: p.slug,
        images: {
          create: [
            { url: img(p.name), alt: p.name, position: 0 },
            { url: img(`${p.name} detail`), alt: `${p.name} detail`, position: 1 },
          ],
        },
      },
    });

    for (const v of p.variants) {
      const sku = `${p.slug.toUpperCase().replace(/-/g, "_")}-${v.label
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "")}`;
      const variant = await prisma.variant.upsert({
        where: { sku },
        update: {},
        create: {
          productId: product.id,
          sku,
          options: { Size: v.label },
          price: v.price,
          mrp: v.mrp,
          status: "ACTIVE",
        },
      });
      await prisma.inventory.upsert({
        where: { variantId: variant.id },
        update: {},
        create: { variantId: variant.id, onHand: v.stock, reserved: 0, lowStockThreshold: 5 },
      });
    }
  }

  console.log("Seeding home content...");
  await prisma.content.upsert({
    where: { key: "home.hero" },
    update: {},
    create: {
      key: "home.hero",
      json: {
        slides: [
          {
            image: img("Real pearls, grown on our farm", "0F3D3E", "FFFFFF"),
            kicker: "New harvest",
            headline: "Real pearls. Grown on our farm.",
            sub: "Freshwater pearl jewellery, direct from pond to you.",
            ctas: [{ label: "Shop the harvest", href: "/shop" }],
          },
        ],
      },
    },
  });
  await prisma.content.upsert({
    where: { key: "home.trust_row" },
    update: {},
    create: {
      key: "home.trust_row",
      json: {
        items: [
          "Certified real pearl",
          "15-day returns",
          "Free insured shipping",
          "Lifetime restringing",
        ],
      },
    },
  });
  await prisma.content.upsert({
    where: { key: "home.comparison_table" },
    update: {},
    create: {
      key: "home.comparison_table",
      json: {
        rows: [
          { feature: "Source", real: "Grown on our farm", plated: "Mass-manufactured" },
          { feature: "Core", real: "Solid nacre", plated: "Glass or shell bead" },
          { feature: "Surface", real: "Natural imperfections", plated: "Perfectly uniform" },
          { feature: "Feel", real: "Cool, slightly gritty", plated: "Smooth, light" },
          { feature: "Lifespan", real: "Lifetime, with care", plated: "Fades within months" },
        ],
      },
    },
  });

  console.log("Seeding homepage sections...");
  await seedHomepageSections();

  console.log("Seed complete.");
}

// Default homepage content — transcribed verbatim from the storefront's
// original hardcoded sections (see jewelry-design-sage-ehite2/src/components/
// home-*.tsx) so publishing this seed produces the exact same page. Product
// references point at the real products seeded above (the old mock catalogue
// they used to reference doesn't exist in this database). Marketing images
// that were only ever bundled frontend assets are served from the
// storefront's own `public/homepage-defaults/` (copied verbatim from
// `src/assets/`) rather than re-uploaded to S3 — same bytes, stable URL.
const IMG = (name: string) => `/homepage-defaults/${name}`;

async function seedHomepageSections() {
  const bySlug = new Map<string, string>();
  for (const p of PRODUCTS) {
    const row = await prisma.product.findUniqueOrThrow({ where: { slug: p.slug }, select: { id: true } });
    bySlug.set(p.slug, row.id);
  }
  const pid = (slug: string) => bySlug.get(slug)!;

  const necklace1 = pid("neer-freshwater-pearl-necklace");
  const necklace2 = pid("lotus-layered-pearl-necklace");
  const studs = pid("dew-pearl-studs");
  const drops = pid("tidal-pearl-drops");
  const ring1 = pid("solitaire-pearl-ring");
  const ring2 = pid("duet-pearl-ring");
  const bracelet1 = pid("harvest-pearl-bracelet");
  const bracelet2 = pid("sea-charm-pearl-bracelet");
  const allProducts = [necklace1, necklace2, studs, drops, ring1, ring2, bracelet1, bracelet2];

  type SeedSection = {
    type:
      | "ANNOUNCEMENT_BAR"
      | "HEADER"
      | "HERO"
      | "TRUST_STRIP"
      | "CATEGORY_NAV"
      | "HIGHLIGHTS"
      | "ECLAT_EDIT"
      | "BANNER"
      | "OCCASIONS"
      | "FEATURED_COLLECTION"
      | "CURATED_EDITS"
      | "PEARL_MOOD"
      | "SHOP_THE_LOOK"
      | "TESTIMONIALS"
      | "JOURNAL"
      | "PEARL_GUIDE"
      | "MOST_SEARCHED"
      | "NEWSLETTER"
      | "FOOTER";
    key: string;
    name: string;
    order: number;
    content: object;
    settings?: object;
  };

  const sections: SeedSection[] = [
    {
      type: "ANNOUNCEMENT_BAR",
      key: "announcement-bar",
      name: "Announcement bar",
      order: -2,
      content: {
        messages: [
          "Complimentary insured shipping above ₹2,999",
          "15-day easy returns",
          "Certified real freshwater pearls",
          "Cash on delivery available",
        ],
      },
    },
    {
      type: "HEADER",
      key: "header",
      name: "Header navigation",
      order: -1,
      content: {
        navLinks: [
          { label: "Shop all", to: "/shop" },
          { label: "Office & Daily", to: "/collections/office-daily" },
          { label: "Gifting", to: "/collections/gifting" },
          { label: "Gem & Stones", to: "/collections/gem-stones" },
          { label: "New harvest", to: "/collections/new-harvest" },
        ],
        whatsappNumber: "919999999999",
      },
    },
    {
      type: "HERO",
      key: "hero-new-harvest",
      name: "Hero — New Harvest",
      order: 0,
      content: {
        slides: [
          {
            image: IMG("eclat-hero.jpg"),
            alt: "Moonlit — the new harvest",
            collection: "Moonlit",
            kicker: "The new harvest",
            line: "Luminous freshwater pearls, grown with patience and finished by hand.",
            slug: "moonlit",
          },
          {
            image: IMG("eclat-hero-model-2.jpg"),
            alt: "Morning Dew — layers of light",
            collection: "Morning Dew",
            kicker: "Layers of light",
            line: "Delicate strands made to layer, and just as beautiful worn alone.",
            slug: "morning-dew",
          },
          {
            image: IMG("eclat-hero-model-3.jpg"),
            alt: "Tide — quietly luminous",
            collection: "Tide",
            kicker: "Quietly luminous",
            line: "Sculptural drops with an organic, hand-finished glow.",
            slug: "tide",
          },
        ],
        promises: [
          "Certified real pearls",
          "Hand-picked freshwater pearls",
          "Hand-finished in India",
          "Free insured shipping above ₹2,999",
          "15-day easy returns",
          "Lifetime restringing",
        ],
      },
      settings: { slideDurationMs: 7000 },
    },
    {
      type: "TRUST_STRIP",
      key: "trust-strip",
      name: "Trust strip",
      order: 1,
      content: {
        items: [
          { icon: "ShieldCheck", label: "Certified real pearls" },
          { icon: "RotateCcw", label: "15-day returns" },
          { icon: "Truck", label: "Free insured shipping" },
          { icon: "Sparkles", label: "Lifetime restringing" },
        ],
      },
    },
    {
      type: "CATEGORY_NAV",
      key: "category-nav",
      name: "Category navigation",
      order: 2,
      content: {
        items: [
          { name: "Office & daily", slug: "office-daily", image: IMG("office-daily.jpg"), position: "50% 50%" },
          { name: "Gifting", slug: "gifting", image: IMG("gifting.jpg"), position: "50% 50%" },
          { name: "Gem & stones", slug: "gem-stones", image: IMG("gems-stone.jpg"), position: "50% 50%" },
          { name: "Festive", slug: "festive", image: IMG("festive.jpg"), position: "50% 50%" },
          { name: "Premium", slug: "premium", image: IMG("premium.jpg"), position: "50% 50%" },
        ],
      },
    },
    {
      type: "HIGHLIGHTS",
      key: "highlights",
      name: "Weekly highlights",
      order: 3,
      content: {
        eyebrow: "Curated this week",
        title: "This week's *highlights*",
        sub: "Fresh from the harvest, the pieces everyone is reaching for, and what's catching eyes right now.",
        tabs: [
          {
            id: "new",
            label: "New arrivals",
            icon: "Sparkles",
            slug: "new-harvest",
            cta: "View new arrivals",
            productIds: [necklace1, drops],
          },
          {
            id: "best",
            label: "Best sellers",
            icon: "TrendingUp",
            slug: "best-sellers",
            cta: "View best sellers",
            productIds: [studs, necklace1, drops, bracelet2],
          },
          {
            id: "trending",
            label: "Trending",
            icon: "Flame",
            slug: "trending",
            cta: "View trending pieces",
            productIds: allProducts,
          },
        ],
      },
    },
    {
      type: "ECLAT_EDIT",
      key: "eclat-edit",
      name: "The Éclat Edit",
      order: 4,
      content: {
        eyebrow: "The Éclat edit",
        title: "**Wear.** *Love.* **Shop.**",
        sub: "See how our pearls catch real light, then make any look yours in a tap.",
        tiles: [
          { image: IMG("eclat-hero.jpg"), alt: "Everyday luminous", caption: "Everyday luminous", linkType: "product", productId: necklace1 },
          { image: IMG("eclat-hero-model-3.jpg"), alt: "Drops that move", caption: "Drops that move", linkType: "product", productId: drops },
          { image: IMG("pearl-necklace-detail.jpg"), alt: "The finishing touch", caption: "The finishing touch", linkType: "product", productId: bracelet1 },
          { image: IMG("eclat-hero-model-2.jpg"), alt: "The layering edit", caption: "The layering edit", linkType: "custom", to: "/shop", label: "Shop all pearls" },
          { image: IMG("pearl-earrings-detail.jpg"), alt: "Lustre, up close", caption: "Lustre, up close", linkType: "product", productId: drops },
        ],
      },
    },
    {
      type: "BANNER",
      key: "banner-after-edit",
      name: "Banner — after The Éclat Edit",
      order: 5,
      content: { image: IMG("eclat-banner.png"), alt: "Éclat — Jewelry for every story" },
    },
    {
      type: "OCCASIONS",
      key: "occasions",
      name: "Shop by occasion",
      order: 6,
      content: {
        eyebrow: "Choose by occasion",
        title: "Styled for every *moment*",
        sub: "From slow brunches to wedding receptions, discover pearls picked for the way your day actually unfolds.",
        items: [
          { slug: "casual", label: "Casual", image: IMG("pearl-earrings.jpg"), note: "Light, easy pieces for everyday wear.", productIds: [studs, ring1] },
          { slug: "weekend", label: "Weekend", image: IMG("pearl-necklace.jpg"), note: "Relaxed pieces for slow mornings.", productIds: [ring1, bracelet1, bracelet2] },
          { slug: "work", label: "Work", image: IMG("eclat-hero.jpg"), note: "Polished, minimal pieces for the office.", productIds: [necklace1, studs, ring2] },
          { slug: "date-night", label: "Date night", image: IMG("eclat-hero-model-2.jpg"), note: "A little more shine for the evening.", productIds: [drops] },
          { slug: "cocktail", label: "Cocktail", image: IMG("eclat-hero-model-3.jpg"), note: "Statement pieces that hold their own.", productIds: [necklace2, drops, ring2] },
          { slug: "wedding-guest", label: "Wedding guest", image: IMG("pearl-necklace-detail.jpg"), note: "Grace for the big day.", productIds: [necklace1, drops] },
          { slug: "festive", label: "Festive", image: IMG("pearl-earrings-detail.jpg"), note: "Lamps, lights and lustre.", productIds: [necklace2, bracelet2] },
        ],
      },
    },
    {
      type: "BANNER",
      key: "banner-after-occasions",
      name: "Banner — after Shop by Occasion",
      order: 7,
      content: { image: IMG("eclat-banner-2.png"), alt: "Éclat — A reflection of you" },
    },
    {
      type: "FEATURED_COLLECTION",
      key: "featured-collection-moonlit",
      name: "Featured collection — Moonlit",
      order: 8,
      content: {
        eyebrow: "Featured collection",
        title: "The *Moonlit* collection",
        sub: "Soft, silvery lustre inspired by quiet evenings. Every pearl is hand-selected and finished by hand.",
        heroImage: IMG("eclat-hero.jpg"),
        heroAlt: "The Moonlit collection",
        collectionSlug: "moonlit",
        ctaLabel: "Shop the collection",
        productIds: allProducts,
      },
      settings: { layout: "grid" },
    },
    {
      type: "FEATURED_COLLECTION",
      key: "featured-collection-morning-dew",
      name: "Featured collection — Morning Dew",
      order: 9,
      content: {
        eyebrow: "The Morning Dew collection",
        title: "Light, caught at *dawn*",
        sub: "Delicate strands and softly glowing studs, made for slow mornings and every hour after.",
        heroImage: IMG("eclat-hero-model-2.jpg"),
        heroAlt: "The Morning Dew collection",
        collectionSlug: "morning-dew",
        ctaLabel: "Explore the collection",
        ringText: "MORNING DEW · LIGHT CAUGHT AT DAWN ·",
        productIds: [necklace1, bracelet1, studs, necklace2, ring1],
      },
      settings: { layout: "orbit" },
    },
    {
      type: "FEATURED_COLLECTION",
      key: "featured-collection-tide",
      name: "Featured collection — Tide",
      order: 10,
      content: {
        eyebrow: "The Tide collection",
        title: "Shaped by *water*",
        sub: "Baroque pearls kept in their natural, sculptural forms and set in warm, fluid metal.",
        heroImage: IMG("eclat-hero-model-3.jpg"),
        heroAlt: "The Tide collection",
        collectionSlug: "tide",
        ctaLabel: "View the full Tide collection",
        coverTitle: "Shaped by *water*",
        coverBody: "Baroque pearls kept in their natural, sculptural forms and set in warm, fluid metal.",
        productIds: [drops, ring1, necklace2],
      },
      settings: { layout: "wave" },
    },
    {
      type: "CURATED_EDITS",
      key: "curated-edits",
      name: "Curated gift edits",
      order: 11,
      content: {
        eyebrow: "Curated edits",
        title: "Timeless pearls, *thoughtful* gifts",
        sub: "Hand-picked edits for the moments worth marking, from a first gift to a festive evening.",
        tiles: [
          { slug: "wedding-guest", kicker: "Grace for the big day", title: "The wedding guest edit", image: IMG("eclat-hero.jpg"), alt: "The wedding guest edit", productIds: [necklace1, drops] },
          { slug: "under-3999", kicker: "Thoughtful gifting", title: "Gifts under ₹3,999", image: IMG("pearl-earrings.jpg"), alt: "Gifts under ₹3,999", productIds: [studs, bracelet1, bracelet2, ring2] },
          { slug: "festive", kicker: "Lamps, lights and lustre", title: "The festive edit", image: IMG("pearl-necklace-detail.jpg"), alt: "The festive edit", productIds: [necklace2, bracelet2] },
        ],
      },
    },
    {
      type: "PEARL_MOOD",
      key: "pearl-mood",
      name: "Find your pearl mood",
      order: 12,
      content: {
        eyebrow: "Style it your way",
        title: "Find your *pearl* mood",
        sub: "From soft daytime layers to sculptural evening drops, see how the same quiet lustre changes with the moment. Drag the pearl to compare.",
        left: { label: "Everyday ease", image: IMG("eclat-hero-model-2.jpg"), alt: "Everyday ease", productId: necklace1 },
        right: { label: "Evening glow", image: IMG("eclat-hero-model-3.jpg"), alt: "Evening glow", productId: drops },
      },
    },
    {
      type: "SHOP_THE_LOOK",
      key: "shop-the-look",
      name: "Shop the look",
      order: 13,
      content: {
        eyebrow: "Shop the look",
        title: "Quietly *luminous.*",
        lede: "Neer Freshwater Pearl Necklace with Tidal Pearl Drops — made to layer, beautiful alone.",
        image: IMG("eclat-hero.jpg"),
        alt: "Shop the look",
        hotspots: [
          { productId: necklace1, label: "Neer Freshwater Pearl Necklace", x: 81, y: 60 },
          { productId: drops, label: "Tidal Pearl Drops", x: 91, y: 37 },
        ],
      },
    },
    {
      type: "TESTIMONIALS",
      key: "testimonials",
      name: "Testimonials",
      order: 14,
      content: {
        label: "Testimonial",
        title: "More than jewellery, it's a feeling.",
        sub: "Real stories from people who made pearls a part of their most cherished moments.",
        ctaLabel: "Read more stories",
        entries: [
          { name: "Aditi Sharma", city: "Mumbai", quote: "The quality is unlike anything I've bought before — you can feel these are real pearls.", rating: 5, image: IMG("pearl-necklace-detail.jpg") },
          { name: "Rohan Mehta", city: "Bengaluru", quote: "Bought this as a gift for my mother, she hasn't taken it off since.", rating: 5, image: IMG("pearl-earrings-detail.jpg") },
          { name: "Priya Nair", city: "Chennai", quote: "Beautifully packaged, and the pearls have a lustre that photos don't do justice.", rating: 5, image: IMG("eclat-hero-model-2.jpg") },
        ],
        showTrustBar: true,
        trustStats: [
          { value: "10K+", label: "Happy Customers" },
          { value: "25+", label: "Countries" },
          { value: "4.9/5", label: "Average Rating" },
          { value: "98%", label: "Would Recommend" },
        ],
        pullQuote: "Pearls are a part of life's most beautiful stories.",
        pullQuoteAttribution: "— Team Éclat",
      },
    },
    {
      type: "JOURNAL",
      key: "journal",
      name: "Pearl journal",
      order: 15,
      content: {
        eyebrow: "The pearl journal",
        title: "Stories from the water",
        ctaLabel: "Read the journal",
        posts: [
          { image: IMG("pearl-farm.jpg"), title: "How a freshwater pearl grows", readTime: "6 min read", slug: "how-a-pearl-grows" },
          { image: IMG("pearl-necklace.jpg"), title: "Real pearls vs plated pearls", readTime: "4 min read", slug: "real-vs-plated" },
          { image: IMG("pearl-earrings.jpg"), title: "A simple guide to pearl care", readTime: "5 min read", slug: "pearl-care-guide" },
        ],
      },
    },
    {
      type: "PEARL_GUIDE",
      key: "pearl-guide",
      name: "Pearl & jewellery guide",
      order: 16,
      content: {
        eyebrow: "Pearl & Jewellery Guide",
        title: "Know your pearl, *choose your design*",
        designs: [
          { productId: necklace1, label: "Necklace", colour: "White", lede: "A single strand that goes anywhere, from the office to an evening out." },
          { productId: drops, label: "Drop earrings", colour: "White", lede: "Movement and light with every turn of the head." },
          { productId: studs, label: "Studs", colour: "White", lede: "Minimal, everyday pearls you'll forget you're wearing." },
          { productId: bracelet1, label: "Bracelet", colour: "White", lede: "An easy stretch fit for daily layering." },
        ],
      },
    },
    {
      type: "MOST_SEARCHED",
      key: "most-searched",
      name: "Most searched",
      order: 17,
      content: {
        eyebrow: "Quick discovery",
        title: "Most *searched*",
        sub: "Jump straight to the pieces other pearl lovers look for most.",
        popularChips: ["Pearl studs", "Pearl necklace", "Baroque drops", "Pearl ring"],
        groups: [
          { title: "Necklaces & pendants", chips: [{ label: "All necklaces", type: "category", value: "necklaces" }], productIds: [necklace1, necklace2] },
          { title: "Earrings", chips: [{ label: "All earrings", type: "category", value: "earrings" }], productIds: [studs, drops] },
          { title: "Bracelets & rings", chips: [{ label: "All bracelets", type: "category", value: "bracelets" }, { label: "All rings", type: "category", value: "rings" }], productIds: [bracelet1, ring1] },
          { title: "Gifts", chips: [{ label: "Gifts under ₹3,999", type: "collection", value: "under-3999" }], productIds: [studs, bracelet1] },
          { title: "By occasion", chips: [{ label: "Wedding guest", type: "collection", value: "wedding-guest" }], productIds: [necklace1, drops] },
        ],
      },
    },
    {
      type: "NEWSLETTER",
      key: "newsletter",
      name: "Newsletter",
      order: 18,
      content: {
        eyebrow: "The Éclat letter",
        title: "Letters on pearls, care and *new harvests*",
        sub: "Occasional notes on pearl care, styling ideas and first look at new pieces.",
      },
    },
    {
      type: "FOOTER",
      key: "footer",
      name: "Footer",
      order: 999999,
      content: {
        tagline: "Real freshwater pearls, thoughtfully made in India.",
        whatsappNumber: "919999999999",
        columns: [
          {
            title: "Shop",
            links: [
              { label: "All jewellery", to: "/shop" },
              { label: "Necklaces", to: "/shop/necklaces" },
              { label: "Earrings", to: "/shop/earrings" },
              { label: "New harvest", to: "/collections/new-harvest" },
              { label: "Gifts", to: "/collections/gifting" },
            ],
          },
          {
            title: "Help",
            links: [
              { label: "Shipping", to: "/pages/shipping" },
              { label: "Returns", to: "/pages/returns" },
              { label: "Track order", to: "/track" },
              { label: "My account", to: "/account" },
            ],
          },
          {
            title: "Éclat",
            links: [
              { label: "About us", to: "/about" },
              { label: "Journal", to: "/blog" },
              { label: "Reviews", to: "/reviews" },
            ],
          },
        ],
        paymentMethodsText: "UPI · Visa · Mastercard · RuPay · COD",
        copyrightText: "© 2026 Éclat",
      },
    },
  ];

  for (const s of sections) {
    await prisma.homepageSection.upsert({
      where: { key: s.key },
      update: {},
      create: {
        type: s.type,
        key: s.key,
        name: s.name,
        order: s.order,
        enabled: true,
        content: s.content,
        settings: s.settings,
        publishedOrder: s.order,
        publishedEnabled: true,
        publishedContent: s.content,
        publishedSettings: s.settings,
        publishedAt: new Date(),
      },
    });
  }

  await prisma.content.upsert({
    where: { key: "homepage.status" },
    update: { json: { isLive: true, publishedAt: new Date().toISOString() } },
    create: { key: "homepage.status", json: { isLive: true, publishedAt: new Date().toISOString() } },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
