import { z } from "zod";
import { INDIAN_STATES } from "../../customer/dto/address.dto.js";

export const MAX_QTY_PER_LINE = 10;

// The order is built from the customer's server-side bag, so no item list is accepted here.

// The storefront sends "+91XXXXXXXXXX"; accept with or without the prefix.
const phone = z
  .string()
  .trim()
  .regex(/^(\+91)?[6-9]\d{9}$/, "Enter a 10-digit mobile number")
  .transform((v) => v.replace(/^\+91/, ""));

export const createOrderSchema = z.object({
  customer: z.object({
    email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address")),
    phone,
    marketingOptIn: z.boolean().default(false),
  }),
  shippingAddress: z.object({
    name: z.string().trim().min(1, "Name is required").max(80),
    line1: z.string().trim().min(1, "House / street is required").max(120),
    line2: z.string().trim().max(120).optional().transform((v) => v || null),
    city: z.string().trim().min(1, "City is required").max(60),
    state: z.enum(INDIAN_STATES, { error: "Select a valid state" }),
    pincode: z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a 6-digit PIN code"),
    country: z.literal("IN").default("IN"),
  }),
  shippingMethod: z.enum(["standard", "express"]),
  paymentMethod: z.enum(["online", "cod"]),
  giftNote: z.string().trim().max(200).optional(),
  // What the customer saw as the total (whole rupees). If prices or fees moved since, the order is
  // refused with PRICE_CHANGED instead of silently charging something else.
  expectedTotal: z.number().int().nonnegative(),
});

export type CreateOrderDto = z.infer<typeof createOrderSchema>;

export const idempotencyKeySchema = z
  .string()
  .regex(/^[A-Za-z0-9_-]{8,64}$/, "Idempotency-Key must be 8–64 letters, digits, - or _");
