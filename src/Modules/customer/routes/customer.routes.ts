import { Router } from "express";
import { customerController } from "../controller/customer.controller.js";
import { requireAuth } from "../../../common/authenticate.js";
import { rateLimit } from "../../../common/rateLimit.js";

export const customerRoutes = Router();

const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  keyPrefix: "customer-write",
  message: "Too many changes. Slow down and try again shortly.",
});

customerRoutes.use(requireAuth);

// GET /v1/me · PATCH /v1/me { name?, email?, dob? }
customerRoutes.get("/", customerController.getProfile);
customerRoutes.patch("/", writeLimiter, customerController.updateProfile);

// /v1/me/addresses
customerRoutes.get("/addresses", customerController.listAddresses);
customerRoutes.post("/addresses", writeLimiter, customerController.createAddress);
customerRoutes.patch("/addresses/:id", writeLimiter, customerController.updateAddress);
customerRoutes.delete("/addresses/:id", writeLimiter, customerController.deleteAddress);
