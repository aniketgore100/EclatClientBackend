import { Router } from "express";
import { categoryController } from "../controller/category.controller.js";
import {
  pearlColourController,
  polishController,
  productTypeController,
  stoneController,
} from "../controller/product-facets.controller.js";
import { productController } from "../controller/product.controller.js";
import { contentController } from "../controller/content.controller.js";
import { homepageController } from "../controller/homepage.controller.js";

export const catalogueRoutes = Router();

// Categories — single entity for both product taxonomy and the storefront's
// curated home-page tiles (formerly a separate Collection model, merged in).
catalogueRoutes.get("/categories", categoryController.list);
catalogueRoutes.get("/categories/:slug", categoryController.getBySlug);

// Product facets — the filter drawer's option lists (type/polish/stone/pearl
// colour), admin-managed rather than hardcoded in the frontend.
catalogueRoutes.get("/product-types", productTypeController.list);
catalogueRoutes.get("/polishes", polishController.list);
catalogueRoutes.get("/stones", stoneController.list);
catalogueRoutes.get("/pearl-colours", pearlColourController.list);

// Products
catalogueRoutes.get("/products", productController.list);
catalogueRoutes.get("/products/:slug", productController.getBySlug);

// Content
catalogueRoutes.get("/content/home", contentController.getHome);
catalogueRoutes.get("/content/:key", contentController.getByKey);

// Homepage CMS — every section on the homepage, admin-editable. `?preview=`
// (a short-lived admin-issued token) shows the in-progress draft instead of
// the published/live version.
catalogueRoutes.get("/homepage", homepageController.get);
