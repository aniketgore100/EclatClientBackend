import { z } from "zod";

export const MAX_QTY_PER_LINE = 10;
export const MAX_CART_LINES = 50;

const variantId = z.string().uuid("Invalid variant id");

export const addItemSchema = z.object({
  variantId,
  quantity: z.number().int().min(1).max(MAX_QTY_PER_LINE).default(1),
});

export const setQuantitySchema = z.object({
  // 0 removes the line.
  quantity: z.number().int().min(0).max(MAX_QTY_PER_LINE),
});

// Quantities from a long-lived guest cart can be anything; they're clamped server-side, so the
// schema only rejects the nonsensical.
export const mergeSchema = z.object({
  items: z
    .array(z.object({ variantId, quantity: z.number().int().min(1).max(999) }))
    .max(100),
});

export const variantParamSchema = z.object({ variantId });
