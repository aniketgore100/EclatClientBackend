import { Router } from "express";
import { SHIPPING } from "../../../config/shipping.js";
import { categoryController } from "../controller/category.controller.js";
import { siteController } from "../controller/site.controller.js";
import { productController } from "../controller/product.controller.js";

export const catalogueRoutes = Router();

// Categories
catalogueRoutes.get("/categories", categoryController.list);
catalogueRoutes.get("/categories/:slug", categoryController.getBySlug);

// Products
catalogueRoutes.get("/products", productController.list);
catalogueRoutes.get("/products/:slug", productController.getBySlug);
catalogueRoutes.get("/products/:slug/reviews", productController.reviews);

// Shipping + COD pricing the checkout shows (and the order API charges).
catalogueRoutes.get("/shipping", (_req, res) => {
  res.json({
    data: {
      freeAbove: SHIPPING.freeAbove,
      methods: Object.entries(SHIPPING.methods).map(([id, m]) => ({ id, label: m.label, eta: m.eta, fee: m.fee })),
      codFee: SHIPPING.codFee,
    },
  });
});

// Website content managed from the admin's builder: the homepage's sections, and the header/footer/etc.
// `?preview=<token>` (issued by the admin) serves the unpublished draft instead.
catalogueRoutes.get("/site/home", siteController.home);
catalogueRoutes.get("/site/chrome", siteController.chrome);
