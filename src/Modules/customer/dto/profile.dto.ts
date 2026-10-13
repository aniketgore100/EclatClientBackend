import { z } from "zod";

// Empty string clears an optional field.
const optionalEmail = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .pipe(z.union([z.literal(""), z.email("Enter a valid email address")]))
  .transform((v) => (v === "" ? null : v));

const dob = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be YYYY-MM-DD")
  .transform((v) => new Date(`${v}T00:00:00.000Z`))
  .refine((d) => !Number.isNaN(d.getTime()), "Invalid date of birth")
  .refine((d) => d.getTime() <= Date.now(), "Date of birth can't be in the future")
  .refine((d) => d.getUTCFullYear() >= 1900, "Invalid date of birth");

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(1, "Name can't be empty").max(80),
    email: optionalEmail,
    dob: z.union([dob, z.literal("").transform(() => null)]),
  })
  .partial()
  // The phone number is the login identity; it can't be changed here.
  .strict();

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
