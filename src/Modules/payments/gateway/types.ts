// What the rest of the app needs from a payment provider. Amounts are always paise.
export interface GatewayOrder {
  id: string;
  amount: number;
  currency: string;
}

export interface GatewayPayment {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: "created" | "authorized" | "captured" | "refunded" | "failed";
  method?: string;
  errorCode?: string | null;
  errorDescription?: string | null;
}

export interface GatewayRefund {
  id: string;
  paymentId: string;
  amount: number;
  // Razorpay: "pending" | "processed" | "failed"
  status: string;
}

export interface PaymentGateway {
  readonly name: "razorpay" | "fake";
  // Public key id handed to the browser's checkout. The secret never leaves the server.
  readonly keyId: string;
  // False when credentials are missing — online orders are refused instead of failing half-way.
  readonly configured: boolean;
  // Whether we can ask the provider about a payment (the fake gateway can't).
  readonly canQueryPayments: boolean;

  createOrder(input: { amount: number; currency: string; receipt: string; notes: Record<string, string> }): Promise<GatewayOrder>;
  fetchPayment(paymentId: string): Promise<GatewayPayment>;
  fetchOrderPayments(orderId: string): Promise<GatewayPayment[]>;
  capturePayment(paymentId: string, amount: number, currency: string): Promise<GatewayPayment>;
  refund(paymentId: string, amount: number, notes: Record<string, string>): Promise<GatewayRefund>;

  // Both compare in constant time.
  verifyCheckoutSignature(orderId: string, paymentId: string, signature: string): boolean;
  verifyWebhookSignature(rawBody: Buffer, signature: string): boolean;
}
