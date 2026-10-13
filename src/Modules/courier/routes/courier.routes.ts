import express, { Router } from "express";
import { courierController } from "../controller/courier.controller.js";

export const courierWebhookRoutes = Router();

// POST /v1/webhooks/courier — deliberately not named after the courier platform: Shiprocket refuses
// webhook URLs containing "shiprocket", "kartrocket", "sr" or "kr".
courierWebhookRoutes.post("/courier", express.json({ limit: "1mb" }), courierController.webhook);
