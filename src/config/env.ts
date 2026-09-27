import "dotenv/config";
import { z } from "zod";

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(3000),
    // Comma-separated storefront origins allowed to call this API from a browser.
    CORS_ORIGINS: z.string().default("http://localhost:8080,http://localhost:8081"),

    DATABASE_AUTH_MODE: z.enum(["password", "iam"]).default("password"),
    DATABASE_URL: z.string().min(1).optional(),

    DATABASE_SSL: z.enum(["auto", "require", "disable"]).default("auto"),

    // Only used when DATABASE_AUTH_MODE=iam
    DATABASE_HOST: z.string().optional(),
    DATABASE_PORT: z.coerce.number().int().positive().default(5432),
    DATABASE_NAME: z.string().optional(),
    DATABASE_USER: z.string().optional(),
  
    AWS_REGION: z.string().optional(),

    JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
    JWT_ACCESS_TTL: z.string().default("15m"),
    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),

    OTP_TTL_MINUTES: z.coerce.number().int().positive().default(5),
    OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
    OTP_RESEND_COOLDOWN_SECONDS: z.coerce.number().int().positive().default(60),
    OTP_MAX_PER_WINDOW: z.coerce.number().int().positive().default(5),
    OTP_WINDOW_MINUTES: z.coerce.number().int().positive().default(10),
  })
  .superRefine((data, ctx) => {
    if (data.DATABASE_AUTH_MODE === "password" && !data.DATABASE_URL) {
      ctx.addIssue({
        code: "custom",
        path: ["DATABASE_URL"],
        message: "DATABASE_URL is required when DATABASE_AUTH_MODE=password",
      });
    }
    if (data.DATABASE_AUTH_MODE === "iam") {
      for (const field of ["DATABASE_HOST", "DATABASE_NAME", "DATABASE_USER", "AWS_REGION"] as const) {
        if (!data[field]) {
          ctx.addIssue({
            code: "custom",
            path: [field],
            message: `${field} is required when DATABASE_AUTH_MODE=iam`,
          });
        }
      }
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:");
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;
