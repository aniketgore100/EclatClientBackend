// Shipping and COD pricing, in whole rupees. Mirrors the storefront's settings.shipping until the
// storefront reads these from the backend — change both together.
export const SHIPPING = {
  freeAbove: 999,
  methods: {
    standard: { label: "Standard", eta: "4–6 business days", fee: 79 },
    express: { label: "Express", eta: "1–3 business days", fee: 149 },
  },
  codFee: 49,
} as const;

export type ShippingMethodId = keyof typeof SHIPPING.methods;

// Online orders keep their stock reserved this long while the customer pays.
export const PAYMENT_HOLD_MINUTES = 30;
