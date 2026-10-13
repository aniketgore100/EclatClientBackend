import { Router } from "express";
import { catalogueRoutes } from "../Modules/catalogue/index.js";
import { authRoutes } from "../Modules/auth/index.js";
import { customerRoutes } from "../Modules/customer/index.js";
import { cartRoutes } from "../Modules/cart/index.js";
import { wishlistRoutes } from "../Modules/wishlist/index.js";
import { ordersRoutes } from "../Modules/orders/index.js";

export const rootRouter = Router();

rootRouter.use("/v1/catalogue", catalogueRoutes);
rootRouter.use("/v1/auth", authRoutes);
rootRouter.use("/v1/me", customerRoutes);
rootRouter.use("/v1/cart", cartRoutes);
rootRouter.use("/v1/wishlist", wishlistRoutes);
rootRouter.use("/v1/orders", ordersRoutes);
