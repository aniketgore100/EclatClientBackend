import type { PoolConfig } from "pg";
import { Signer } from "@aws-sdk/rds-signer";
import { env } from "./env.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

function resolveSslForPasswordMode() {
  const enabled = env.DATABASE_SSL === "require" || (env.DATABASE_SSL === "auto" && env.NODE_ENV === "production");
  if (!enabled) return undefined;

  return { rejectUnauthorized: true };
}

function buildPoolConfig(): PoolConfig {
  if (env.DATABASE_AUTH_MODE === "password") {
    return {
      connectionString: env.DATABASE_URL,
      ssl: resolveSslForPasswordMode(),
    };
  }


  const signer = new Signer({
    hostname: env.DATABASE_HOST!,
    port: env.DATABASE_PORT,
    username: env.DATABASE_USER!,
    region: env.AWS_REGION!,
  });

  return {
    host: env.DATABASE_HOST,
    port: env.DATABASE_PORT,
    database: env.DATABASE_NAME,
    user: env.DATABASE_USER,
    password: () => signer.getAuthToken(),
       ssl: { rejectUnauthorized: true },
  };
}

const adapter = new PrismaPg(buildPoolConfig());

export const prisma = new PrismaClient({
  adapter,
});
