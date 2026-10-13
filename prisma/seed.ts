import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// One category is live end to end for now: Bracelets. Sample products mirror the storefront's
// design mocks; images are the storefront's own /products/... assets (served by the storefront
// dev server) — real uploads from the admin go to S3 and replace them.
const CATEGORY = {
  name: "Bracelets",
  slug: "bracelets",
  description: "Pearl lines, coils and everyday chains.",
  image: "/products/product-1/elegant-pearl-bracelet-portrait-2.webp",
  position: 1,
};

type Img = [file: string, kind: "model" | "packshot", alt: string];
type Bracelet = {
  slug: string;
  name: string;
  subtitle: string;
  rupees: number;
  mrpRupees?: number;
  tags: string[];
  badges: string[];
  metal: "silver" | "gold";
  dir: string;
  images: Img[];
};

const BRACELETS: Bracelet[] = [
  {
    slug: "lune-pearl-bracelet", name: "Lune Pearl Bracelet", subtitle: "Pavé bolo bracelet with a mother-of-pearl halo",
    rupees: 2499, mrpRupees: 2999, tags: ["new-drops", "stack-season", "promise"], badges: ["new"], metal: "silver", dir: "product-1",
    images: [
      ["elegant-pearl-bracelet-portrait-1", "model", "Model resting her chin on her hand, wearing the pavé pearl halo bracelet"],
      ["elegant-pearl-pave-silver-bracelet", "packshot", "Pavé silver bolo bracelet with a pearl halo centre and extender chain"],
      ["elegant-pearl-bracelet-portrait", "model", "Model in a black dress wearing the pearl halo bracelet"],
      ["elegant-pearl-bracelet-portrait-2", "model", "Close crop of the pearl halo bracelet on a wrist"],
      ["pearl-halo-jewellery-on-slate", "packshot", "Macro of the pearl halo centre on dark slate"],
      ["elegant-pearl-halo-bracelet", "packshot", "The bracelet laid open, showing the clasp and extender chain"],
    ],
  },
  {
    slug: "margot-pearl-bracelet", name: "Margot Pearl Bracelet", subtitle: "Rice pearls and gold beads with a heart charm",
    rupees: 1599, tags: ["bestsellers", "everyday-minimal", "stack-season"], badges: ["bestseller"], metal: "gold", dir: "product-4",
    images: [
      ["sunlit-pearl-bracelet-fashion-portrait", "model", "Model in sunlight wearing the rice pearl bracelet"],
      ["delicate-gold-and-pearl-bracelet", "packshot", "Rice pearls alternating with gold beads, finished with a heart charm"],
      ["high-angle-street-style-selfie", "model", "High-angle street style shot with the bracelet"],
      ["elegant-pearl-and-gold-bracelet", "packshot", "The bracelet curved, showing the clasp"],
    ],
  },
  {
    slug: "juliette-pearl-bracelet", name: "Juliette Pearl Bracelet", subtitle: "Paired pearls strung on fine gold wire",
    rupees: 1799, tags: ["new-drops", "everyday-minimal", "stack-season"], badges: ["new"], metal: "gold", dir: "product-6",
    images: [
      ["editorial-pearl-bracelet-portrait", "model", "Model sitting on steps wearing the gold pearl bracelet"],
      ["elegant-pearl-and-gold-bracelet", "packshot", "Paired pearls strung on fine gold wire with a heart charm"],
      ["casual-street-style-with-pearl-bracelet", "model", "Casual street styling with the bracelet"],
      ["delicate-gold-and-pearl-chain", "packshot", "The bracelet laid straight, showing the clasp"],
    ],
  },
  {
    slug: "seraphine-bracelet", name: "Seraphine Bracelet", subtitle: "Five peach pearls in pavé-set silver scrolls",
    rupees: 2699, tags: ["night-out", "stack-season"], badges: [], metal: "silver", dir: "product-8",
    images: [
      ["pearl-bracelet-editorial-portrait", "model", "Editorial portrait wearing the silver and pearl bracelet"],
      ["elegant-pearl-and-silver-s-curve-bracelet", "packshot", "Five peach pearls held in pavé-set silver scrolls"],
      ["pearl-and-silver-bracelet-on-pale-surface", "packshot", "The bracelet curved on a pale surface"],
      ["lustrous-pearl-chain-on-textured-stone", "packshot", "Macro of the pearls on textured stone"],
    ],
  },
  {
    slug: "spirale-pearl-cuff", name: "Spirale Pearl Cuff", subtitle: "Memory-wire coil strung with peacock pearls",
    rupees: 1899, tags: ["new-drops", "night-out", "stack-season"], badges: ["new"], metal: "silver", dir: "product-12",
    images: [
      ["peacock-pearl-coil-bracelet", "packshot", "Three-row silver memory-wire coil set with peacock pearls"],
      ["dark-pearl-coiled-silver-bracelet", "packshot", "The coil cuff seen from above"],
      ["iridescent-pearls-on-silver-coils", "packshot", "Macro of the iridescent pearls on the silver coils"],
    ],
  },
];

const METAL_MATERIAL = {
  silver: "925 sterling silver, rhodium plated. Freshwater cultured pearls and AAA cubic zirconia. Nickel-free and hypoallergenic.",
  gold: "925 sterling silver, 18k gold plated. Freshwater cultured pearls and AAA cubic zirconia. Nickel-free and hypoallergenic.",
};
const CARE =
  "Pearls are soft and porous, so put the piece on last — after perfume, lotion and hairspray — and keep it out of chlorine and the shower. Wipe with the cloth provided and store it flat in its pouch.";

async function main() {
  const category = await prisma.category.upsert({
    where: { slug: CATEGORY.slug },
    update: CATEGORY,
    create: CATEGORY,
  });

  for (const [i, b] of BRACELETS.entries()) {
    const existing = await prisma.product.findUnique({ where: { slug: b.slug } });
    if (existing) continue; // never overwrite what the admin has since edited

    await prisma.product.create({
      data: {
        categoryId: category.id,
        name: b.name,
        slug: b.slug,
        subtitle: b.subtitle,
        description: `${b.subtitle}. Freshwater cultured pearls hand-set on a ${b.metal === "gold" ? "18k gold-plated" : "rhodium-plated"} 925 sterling silver base, finished with an anti-tarnish coating. Every pearl is grown, not made, so expect small differences in shape, colour and lustre from piece to piece.`,
        status: "ACTIVE",
        tags: b.tags,
        badges: b.badges,
        sortOrder: i,
        material: METAL_MATERIAL[b.metal],
        care: CARE,
        seoTitle: `${b.name} — Eclat Empire`,
        seoMeta: b.subtitle,
        optionTypes: { create: [{ name: "metal" }] },
        images: {
          create: b.images.map(([file, kind, alt], position) => ({
            url: `/products/${b.dir}/${file}.webp`,
            kind,
            alt,
            position,
          })),
        },
        variants: {
          create: [
            {
              sku: `EE-${b.slug.slice(0, 6)}-${b.metal.slice(0, 2)}`.toUpperCase(),
              options: { metal: b.metal },
              price: b.rupees * 100, // paise
              mrp: (b.mrpRupees ?? b.rupees) * 100,
              inventory: { create: { onHand: 12 } },
            },
          ],
        },
      },
    });
  }

  console.log(`Seeded category "${category.name}" with ${BRACELETS.length} bracelets`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
