import { env } from "../../../config/env.js";
import { createFakeGateway } from "./fake.gateway.js";
import { createRazorpayGateway } from "./razorpay.gateway.js";
import type { PaymentGateway } from "./types.js";

let current: PaymentGateway | null = null;

export function getGateway(): PaymentGateway {
  current ??=
    env.PAYMENT_GATEWAY === "fake"
      ? createFakeGateway()
      : createRazorpayGateway(env.RAZORPAY_KEY_ID, env.RAZORPAY_KEY_SECRET, env.RAZORPAY_WEBHOOK_SECRET);
  return current;
}

// Tests swap in a scripted gateway to exercise provider-side behaviour (late payments, failed refunds…).
export function setGatewayForTests(gateway: PaymentGateway | null) {
  current = gateway;
}

export type { PaymentGateway } from "./types.js";
