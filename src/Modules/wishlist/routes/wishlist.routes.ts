import { Router } from "express";
import { wishlistController } from "../controller/wishlist.controller.js";
import { requireAuth } from "../../../common/authenticate.js";
import { rateLimit } from "../../../common/rateLimit.js";

export const wishlistRoutes = Router();

const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  keyPrefix: "wishlist-write",
  message: "Too many changes. Slow down and try again shortly.",
});

wishlistRoutes.use(requireAuth);

// GET /v1/wishlist → { slugs } (newest first)
wishlistRoutes.get("/", wishlistController.list);
// POST /v1/wishlist/merge { slugs } — guest wishlist → account at login
wishlistRoutes.post("/merge", writeLimiter, wishlistController.merge);
// PUT /v1/wishlist/:slug — save (idempotent)
wishlistRoutes.put("/:slug", writeLimiter, wishlistController.add);
// DELETE /v1/wishlist/:slug — unsave (idempotent)
wishlistRoutes.delete("/:slug", writeLimiter, wishlistController.remove);
