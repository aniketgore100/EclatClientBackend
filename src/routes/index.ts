import { Router } from "express";
import { catalogueRoutes } from "../Modules/catalogue/index.js";
import { authRoutes } from "../Modules/auth/index.js";

export const rootRouter = Router();

rootRouter.use("/v1/catalogue", catalogueRoutes);
rootRouter.use("/v1/auth", authRoutes);
