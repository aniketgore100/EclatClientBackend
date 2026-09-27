// Recursively collects every product id referenced anywhere in a section's
// content (any `productId` field, any `productIds` array) — same helper as
// Eclat-Admin's homepage/section-registry.ts. Used here to batch-resolve
// every homepage product reference to real product data in one query,
// instead of a per-field lookup.
export function extractProductIds(value: unknown, acc: Set<string> = new Set()): Set<string> {
  if (Array.isArray(value)) {
    for (const item of value) extractProductIds(item, acc);
  } else if (value && typeof value === "object") {
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (key === "productId" && typeof val === "string") acc.add(val);
      else if (key === "productIds" && Array.isArray(val)) {
        for (const id of val) if (typeof id === "string") acc.add(id);
      } else {
        extractProductIds(val, acc);
      }
    }
  }
  return acc;
}
