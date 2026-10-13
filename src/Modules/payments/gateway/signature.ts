import crypto from "node:crypto";

export function hmacHex(secret: string, payload: string | Buffer): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

// Constant-time comparison; false (never throws) for a wrong length or non-hex input.
export function safeEqualHex(expected: string, actual: string): boolean {
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(actual ?? "", "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
