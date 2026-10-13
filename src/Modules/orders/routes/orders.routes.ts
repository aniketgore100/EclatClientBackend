import { Router } from "express";
import { ordersController } from "../controller/orders.controller.js";
import { requireAuth } from "../../../common/authenticate.js";
import { rateLimit } from "../../../common/rateLimit.js";
import { paymentsController } from "../../payments/controller/payments.controller.js";

export const ordersRoutes = Router();

const createLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  keyPrefix: "orders-create",
  message: "Too many order attempts. Try again in a few minutes.",
});

const paymentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 60,
  keyPrefix: "orders-payment",
  message: "Too many payment attempts. Try again in a few minutes.",
});

ordersRoutes.use(requireAuth);

// POST /v1/orders — place an order (re-priced and stock-checked server-side)
ordersRoutes.post("/", createLimiter, ordersController.create);
// GET /v1/orders — the signed-in customer's orders, newest first
ordersRoutes.get("/", ordersController.list);
// GET /v1/orders/:number
ordersRoutes.get("/:number", ordersController.get);
// POST /v1/orders/:number/payment — (re)open payment for a pending online order
ordersRoutes.post("/:number/payment", paymentLimiter, paymentsController.initiate);
// POST /v1/orders/:number/payment/verify { razorpay_order_id, razorpay_payment_id, razorpay_signature }
ordersRoutes.post("/:number/payment/verify", paymentLimiter, paymentsController.verify);
// POST /v1/orders/:number/cancel — back out of an unpaid order (stock is released at once)
ordersRoutes.post("/:number/cancel", paymentLimiter, paymentsController.cancel);
