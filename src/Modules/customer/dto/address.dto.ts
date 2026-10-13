import { z } from "zod";

export const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir",
  "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
] as const;

export const MAX_ADDRESSES = 10;

const base = z.object({
  label: z.enum(["Home", "Work", "Other"]),
  name: z.string().trim().min(1, "Name is required").max(80),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a 10-digit mobile number"),
  line1: z.string().trim().min(1, "House / street is required").max(120),
  line2: z.string().trim().max(120).optional().transform((v) => v || null),
  city: z.string().trim().min(1, "City is required").max(60),
  state: z.enum(INDIAN_STATES, { error: "Select a valid state" }),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a 6-digit PIN code"),
  isDefault: z.boolean().optional(),
});

export const createAddressSchema = base;
export const updateAddressSchema = base.partial().strict();

export type CreateAddressDto = z.infer<typeof createAddressSchema>;
export type UpdateAddressDto = z.infer<typeof updateAddressSchema>;
