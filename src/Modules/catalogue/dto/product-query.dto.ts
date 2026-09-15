import { z } from "zod";

export const productListQuerySchema = z.object({
  category: z.string().optional(),
  tag: z.string().optional(),
  grade: z.string().optional(),
  metal: z.string().optional(),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().nonnegative().optional(),
  inStock: z.coerce.boolean().optional(),
  isNew: z.coerce.boolean().optional(),
  sort: z.enum(["popular", "price_asc", "price_desc", "newest", "rating"]).default("popular"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(24),
});

export type ProductListQuery = z.infer<typeof productListQuerySchema>;
