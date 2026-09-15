import { z } from "zod";

export const requestOtpSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^\+?[1-9]\d{9,14}$/, "Invalid phone number"),
});

export type RequestOtpDto = z.infer<typeof requestOtpSchema>;