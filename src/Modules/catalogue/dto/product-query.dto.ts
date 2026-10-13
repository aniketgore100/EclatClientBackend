import { z } from "zod";

// Arrays arrive comma-separated (?category=rings,earrings&metal=gold).
const csv = z
  .string()
  .optional()
  .transform((v) =>
    v
      ? v
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
  );

export const productListQuerySchema = z.object({
  category: csv,
  collection: csv,
  metal: csv,
  size: csv,
  slugs: csv,
  // Whole rupees, inclusive — compared against the product's lowest variant price.
  price_min: z.coerce.number().int().nonnegative().optional(),
  price_max: z.coerce.number().int().nonnegative().optional(),
  in_stock: z.enum(["true", "false"]).optional(),
  q: z.string().trim().optional(),
  sort: z.enum(["featured", "newest", "price_asc", "price_desc", "rating"]).default("featured"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(24),
});

export type ProductListQuery = z.infer<typeof productListQuerySchema>;
