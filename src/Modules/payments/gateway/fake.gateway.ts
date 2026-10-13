import crypto from "node:crypto";
import { hmacHex, safeEqualHex } from "./signature.js";
import type { PaymentGateway } from "./types.js";

// Local stand-in for Razorpay for automated tests (PAYMENT_GATEWAY=fake; refused in production by
// the env schema). Signatures use the same HMAC scheme with fixed secrets, so the real
// verification and webhook code paths run unchanged — only the network calls are faked.
export const FAKE_KEY_ID = "rzp_test_fake";
export const FAKE_KEY_SECRET = "fake_key_secret";
export const FAKE_WEBHOOK_SECRET = "fake_webhook_secret";

export function createFakeGateway(): PaymentGateway {
  return {
    name: "fake",
    keyId: FAKE_KEY_ID,
    configured: true,
    canQueryPayments: false,

    async createOrder({ amount, currency }) {
      return { id: `order_fake_${crypto.randomBytes(8).toString("hex")}`, amount, currency };
    },
    async fetchPayment(paymentId) {
      throw new Error(`fake gateway cannot query payment ${paymentId}`);
    },
    async fetchOrderPayments() {
      return [];
    },
    async capturePayment(paymentId, amount, currency) {
      return { id: paymentId, orderId: "", amount, currency, status: "captured" };
    },
    async refund(paymentId, amount) {
      return { id: `rfnd_fake_${crypto.randomBytes(6).toString("hex")}`, paymentId, amount, status: "processed" };
    },
    verifyCheckoutSignature(orderId, paymentId, signature) {
      return safeEqualHex(hmacHex(FAKE_KEY_SECRET, `${orderId}|${paymentId}`), signature);
    },
    verifyWebhookSignature(rawBody, signature) {
      return safeEqualHex(hmacHex(FAKE_WEBHOOK_SECRET, rawBody), signature);
    },
  };
}
