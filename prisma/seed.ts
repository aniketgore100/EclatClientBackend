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

const CATEGORIES = [
  { name: "Necklaces", slug: "necklaces", position: 1 },
  { name: "Earrings", slug: "earrings", position: 2 },
  { name: "Rings", slug: "rings", position: 3 },
  { name: "Bracelets", slug: "bracelets", position: 4 },
] as const;

type SeedVariant = {
  label: string;
  price: number; // paise
  mrp: number; // paise
  stock: number;
};

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
  pearl: {
    pearlType: string;
    pearlGrade: string;
    pearlSizeMm: number;
    pearlColour: string;
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
    pearl: {
      pearlType: "Freshwater",
      pearlGrade: "AA",
      pearlSizeMm: 8,
      pearlColour: "White",
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
    pearl: {
      pearlType: "Freshwater",
      pearlGrade: "AAA",
      pearlSizeMm: 9,
      pearlColour: "White Rose",
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
    pearl: {
      pearlType: "Freshwater",
      pearlGrade: "A",
      pearlSizeMm: 6,
      pearlColour: "White",
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
    pearl: {
      pearlType: "Freshwater",
      pearlGrade: "AA",
      pearlSizeMm: 7,
      pearlColour: "White",
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
    pearl: {
      pearlType: "Freshwater",
      pearlGrade: "AA",
      pearlSizeMm: 7,
      pearlColour: "White",
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
    pearl: {
      pearlType: "Freshwater",
      pearlGrade: "A",
      pearlSizeMm: 6,
      pearlColour: "White",
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
    pearl: {
      pearlType: "Freshwater",
      pearlGrade: "A",
      pearlSizeMm: 7,
      pearlColour: "White",
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
    pearl: {
      pearlType: "Freshwater",
      pearlGrade: "A",
      pearlSizeMm: 6,
      pearlColour: "White",
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
      update: { name: c.name, position: c.position },
      create: {
        name: c.name,
        slug: c.slug,
        position: c.position,
        image: img(c.name),
        banner: img(`${c.name} banner`, "0F3D3E", "FFFFFF"),
        description: `${c.name} — real, farm-grown freshwater pearls.`,
      },
    });
    categoryBySlug.set(c.slug, row.id);
  }

  console.log("Seeding products...");
  for (const p of PRODUCTS) {
    const categoryId = categoryBySlug.get(p.category)!;
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        categoryId,
        name: p.name,
        slug: p.slug,
        subtitle: p.subtitle,
        description: p.description,
        status: "ACTIVE",
        featured: p.featured ?? false,
        isNew: p.isNew ?? false,
        tags: p.tags,
        badges: p.badges,
        ...p.pearl,
        seoTitle: p.name,
        seoOgImage: img(p.name),
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

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
