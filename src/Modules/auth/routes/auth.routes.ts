import { Router } from "express";
import { authController } from "../controller/auth.controller.js";
import { requireAuth } from "../../../common/authenticate.js";
import { rateLimit } from "../../../common/rateLimit.js";

export const authRoutes = Router();

// IP-scoped guards in front of the phone-scoped limits already enforced in
// auth.service.ts (see PRD §11C: "OTP 5/10 min per phone"). This stops one IP
// from cycling through many phone numbers, which a per-phone limit alone
// can't prevent.
const otpSendLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  keyPrefix: "otp-send",
  message: "Too many OTP requests from this device. Try again later.",
});

const otpVerifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  keyPrefix: "otp-verify",
  message: "Too many verification attempts from this device. Try again later.",
});

const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  keyPrefix: "auth-general",
  message: "Too many requests. Try again later.",
});

// POST /v1/auth/otp/send { phone }
authRoutes.post("/otp/send", otpSendLimiter, authController.requestOtp);

// POST /v1/auth/otp/verify { phone, otp }
authRoutes.post("/otp/verify", otpVerifyLimiter, authController.verifyOtp);

// POST /v1/auth/refresh-token { refreshToken }
authRoutes.post("/refresh-token", authLimiter, authController.refresh);

// POST /v1/auth/logout { refreshToken }
authRoutes.post("/logout", authLimiter, authController.logout);

// GET /v1/auth/me  (Authorization: Bearer <accessToken>)
authRoutes.get("/me", requireAuth, authController.me);
