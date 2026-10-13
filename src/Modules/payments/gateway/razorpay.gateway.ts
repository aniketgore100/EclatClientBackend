import { AppError } from "../../../common/errors.js";
import { hmacHex, safeEqualHex } from "./signature.js";
import type { GatewayOrder, GatewayPayment, GatewayRefund, PaymentGateway } from "./types.js";

const BASE_URL = "https://api.razorpay.com/v1";
const TIMEOUT_MS = 10_000;

interface RazorpayPaymentEntity {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: GatewayPayment["status"];
  method?: string;
  error_code?: string | null;
  error_description?: string | null;
}

const toPayment = (p: RazorpayPaymentEntity): GatewayPayment => ({
  id: p.id,
  orderId: p.order_id,
  amount: p.amount,
  currency: p.currency,
  status: p.status,
  method: p.method,
  errorCode: p.error_code ?? null,
  errorDescription: p.error_description ?? null,
});

export function createRazorpayGateway(keyId: string | undefined, keySecret: string | undefined, webhookSecret: string | undefined): PaymentGateway {
  const auth = keyId && keySecret ? `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}` : "";

  // One place that talks to Razorpay: timeout, JSON, and every failure surfaced as a clean 502 (the
  // provider's own message is logged, not leaked to the customer).
  async function call<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
    if (!auth) throw new AppError(503, "PAYMENT_NOT_CONFIGURED", "Online payment isn't available right now");
    let res: Response;
    try {
      res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers: { Authorization: auth, "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (err) {
      console.error(`Razorpay ${method} ${path} failed to respond:`, err);
      throw new AppError(502, "PAYMENT_PROVIDER_ERROR", "The payment provider didn't respond. Please try again.");
    }
    const json = (await res.json().catch(() => null)) as { error?: { code?: string; description?: string } } | null;
    if (!res.ok) {
      console.error(`Razorpay ${method} ${path} -> ${res.status}`, json?.error);
      throw new AppError(502, "PAYMENT_PROVIDER_ERROR", "The payment provider couldn't complete that. Please try again.", {
        providerStatus: res.status,
        providerCode: json?.error?.code,
      });
    }
    return json as T;
  }

  return {
    name: "razorpay",
    keyId: keyId ?? "",
    configured: Boolean(keyId && keySecret),
    canQueryPayments: true,

    async createOrder({ amount, currency, receipt, notes }): Promise<GatewayOrder> {
      const o = await call<{ id: string; amount: number; currency: string }>("POST", "/orders", {
        amount,
        currency,
        receipt,
        notes,
      });
      return { id: o.id, amount: o.amount, currency: o.currency };
    },

    async fetchPayment(paymentId) {
      return toPayment(await call<RazorpayPaymentEntity>("GET", `/payments/${encodeURIComponent(paymentId)}`));
    },

    async fetchOrderPayments(orderId) {
      const r = await call<{ items: RazorpayPaymentEntity[] }>("GET", `/orders/${encodeURIComponent(orderId)}/payments`);
      return r.items.map(toPayment);
    },

    async capturePayment(paymentId, amount, currency) {
      return toPayment(await call<RazorpayPaymentEntity>("POST", `/payments/${encodeURIComponent(paymentId)}/capture`, { amount, currency }));
    },

    async refund(paymentId, amount, notes) {
      const r = await call<{ id: string; payment_id: string; amount: number; status: string }>(
        "POST",
        `/payments/${encodeURIComponent(paymentId)}/refund`,
        { amount, speed: "normal", notes },
      );
      return { id: r.id, paymentId: r.payment_id, amount: r.amount, status: r.status };
    },

    // Checkout success callback: HMAC_SHA256(order_id|payment_id, key_secret).
    verifyCheckoutSignature(orderId, paymentId, signature) {
      if (!keySecret) return false;
      return safeEqualHex(hmacHex(keySecret, `${orderId}|${paymentId}`), signature);
    },

    // Webhook: HMAC_SHA256(raw request body, webhook secret) in X-Razorpay-Signature.
    verifyWebhookSignature(rawBody, signature) {
      if (!webhookSecret) return false;
      return safeEqualHex(hmacHex(webhookSecret, rawBody), signature);
    },
  };
}
