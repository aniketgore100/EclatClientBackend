import { Router } from "express";
import { categoryController } from "../controller/category.controller.js";
import { productController } from "../controller/product.controller.js";
import { contentController } from "../controller/content.controller.js";

export const catalogueRoutes = Router();

// Categories
catalogueRoutes.get("/categories", categoryController.list);
catalogueRoutes.get("/categories/:slug", categoryController.getBySlug);

// Products
catalogueRoutes.get("/products", productController.list);
catalogueRoutes.get("/products/:slug", productController.getBySlug);

// Content
catalogueRoutes.get("/content/home", contentController.getHome);
catalogueRoutes.get("/content/:key", contentController.getByKey);
