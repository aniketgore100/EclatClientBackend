import { z } from "zod";

export const MAX_WISHLIST = 200;

const slug = z.string().trim().min(1).max(200);
export const slugParamSchema = z.object({ slug });
export const mergeWishlistSchema = z.object({ slugs: z.array(slug).max(500) });
