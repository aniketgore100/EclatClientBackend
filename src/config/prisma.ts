import type { PoolConfig } from "pg";
import { Signer } from "@aws-sdk/rds-signer";
import { env } from "./env.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

function resolveSslForPasswordMode() {
  const enabled = env.DATABASE_SSL === "require" || (env.DATABASE_SSL === "auto" && env.NODE_ENV === "production");
  if (!enabled) return undefined;

  // Verify against Node's own default trusted root store, not a pinned RDS
  // CA bundle — modern RDS/Aurora certs are commonly issued by Amazon Trust
  // Services (the same public CA AWS uses for ACM), whose roots are already
  // in Node's default trust store but NOT in AWS's RDS-specific bundle.
  // Confirmed directly against this project's cluster via openssl/psql.
  return { rejectUnauthorized: true };
}

function buildPoolConfig(): PoolConfig {
  if (env.DATABASE_AUTH_MODE === "password") {
    return {
      connectionString: env.DATABASE_URL,
      ssl: resolveSslForPasswordMode(),
    };
  }

  // IAM auth: no stored password. A signed token is generated fresh for
  // every new physical connection the pool opens (tokens expire after 15
  // min, so caching one on a long-lived Pool config would eventually break —
  // pg calls `password` as a function precisely to avoid that). Credentials
  // to sign with come from the AWS SDK's default provider chain, not from
  // anything configured here.
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
    // AWS requires SSL for IAM database auth — not governed by DATABASE_SSL.
    // Same default-trust-store reasoning as password mode above.
    ssl: { rejectUnauthorized: true },
  };
}

const adapter = new PrismaPg(buildPoolConfig());

export const prisma = new PrismaClient({
  adapter,
});
