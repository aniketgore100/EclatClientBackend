import { Router } from "express";
import { cartController } from "../controller/cart.controller.js";
import { requireAuth } from "../../../common/authenticate.js";
import { rateLimit } from "../../../common/rateLimit.js";

export const cartRoutes = Router();

const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  keyPrefix: "cart-write",
  message: "Too many changes to your bag. Slow down and try again shortly.",
});

cartRoutes.use(requireAuth);

// GET /v1/cart → { lines, count, subtotal }
cartRoutes.get("/", cartController.get);
// DELETE /v1/cart — empty the bag
cartRoutes.delete("/", writeLimiter, cartController.clear);
// POST /v1/cart/items { variantId, quantity } — add on top of the current quantity
cartRoutes.post("/items", writeLimiter, cartController.addItem);
// PATCH /v1/cart/items/:variantId { quantity } — set an absolute quantity (0 removes)
cartRoutes.patch("/items/:variantId", writeLimiter, cartController.setQuantity);
// DELETE /v1/cart/items/:variantId
cartRoutes.delete("/items/:variantId", writeLimiter, cartController.removeItem);
// POST /v1/cart/merge { items: [{ variantId, quantity }] } — guest cart → account cart at login
cartRoutes.post("/merge", writeLimiter, cartController.merge);
