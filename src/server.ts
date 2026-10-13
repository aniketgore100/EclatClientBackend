import { env } from "./config/env.js";
import express from "express";
import cors from "cors";
import { getGateway } from "./Modules/payments/gateway/index.js";
import { courierWebhookRoutes } from "./Modules/courier/index.js";
import { webhookRoutes } from "./Modules/payments/index.js";
import { startHoldSweeper } from "./Modules/orders/service/hold-sweeper.js";
import { prisma } from "./config/prisma.js";
import morgan from "morgan";
import { rootRouter } from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./common/errorHandler.js";

const app = express();
app.disable("x-powered-by");

if (env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// Deployed storefront origins are always allowed; CORS_ORIGINS can add more.
const DEPLOYED_ORIGINS = ["https://eclat-client-frontend.vercel.app"];
const corsOrigins = [...DEPLOYED_ORIGINS, ...env.CORS_ORIGINS.split(",").map((origin) => origin.trim())];
// In development Vite moves to the next free port when one is taken, so any localhost origin is accepted.
// In production only CORS_ORIGINS are.
const isLocalDev = (origin: string) => env.NODE_ENV !== "production" && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
app.use(cors({ origin: (origin, callback) => callback(null, !origin || corsOrigins.includes(origin) || isLocalDev(origin)) }));
// Webhooks need the raw body for signature checks, so they go in before the JSON parser.
app.use("/v1/webhooks", webhookRoutes);
app.use("/v1/webhooks", courierWebhookRoutes);

app.use(express.json());
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

app.get("/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(rootRouter);

app.use(notFoundHandler);
app.use(errorHandler);


process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  process.exit(1);
});

async function startServer() {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    console.log("Database connected successfully");

    const server = app.listen(env.PORT, () => {
      console.log(`Server running on http://localhost:${env.PORT}`);
    });
    startHoldSweeper();

    // One line that says whether online payments are usable, so a missing key is obvious at boot
    // instead of at the first checkout. Prints only presence and test/live mode — never a secret.
    const gateway = getGateway();
    const mode = env.RAZORPAY_KEY_ID?.startsWith("rzp_live_") ? "LIVE" : env.RAZORPAY_KEY_ID?.startsWith("rzp_test_") ? "test" : "unknown-mode";
    if (gateway.configured) {
      console.log(`Payments: ${gateway.name} ready (${gateway.name === "fake" ? "stand-in" : mode} keys); webhook secret ${env.RAZORPAY_WEBHOOK_SECRET || gateway.name === "fake" ? "set" : "MISSING — webhooks will be rejected"}`);
    } else {
      console.warn("Payments: NOT configured — RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not loaded; online orders will be refused (503). Check Eclat/.env is saved and restart.");
    }

    const shutdown = async (signal: string) => {
      console.log(`${signal} received, shutting down gracefully`);
      server.close(async () => {
        await prisma.$disconnect();
        process.exit(0);
      });
      setTimeout(() => process.exit(1), 10_000).unref();
    };

    process.on("SIGTERM", () => void shutdown("SIGTERM"));
    process.on("SIGINT", () => void shutdown("SIGINT"));
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
}

startServer();
