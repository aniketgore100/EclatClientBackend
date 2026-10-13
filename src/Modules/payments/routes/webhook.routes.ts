import express, { Router } from "express";
import { paymentsController } from "../controller/payments.controller.js";

export const webhookRoutes = Router();

// Must be mounted BEFORE the global JSON parser: the signature is computed over the raw bytes.
// POST /v1/webhooks/razorpay
webhookRoutes.post("/razorpay", express.raw({ type: "*/*", limit: "1mb" }), paymentsController.webhook);
