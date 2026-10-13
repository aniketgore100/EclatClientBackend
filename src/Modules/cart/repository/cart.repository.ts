import { prisma } from "../../../config/prisma.js";
import type { Prisma } from "../../../generated/prisma/client.js";
import type { CartGetPayload } from "../../../generated/prisma/models.js";

export const variantInclude = {
  inventory: true,
  product: {
    select: {
      slug: true,
      name: true,
      status: true,
      category: { select: { slug: true, status: true } },
      images: { orderBy: { position: "asc" as const }, take: 1 },
    },
  },
} as const;

const cartInclude = {
  items: { orderBy: { createdAt: "asc" as const }, include: { variant: { include: variantInclude } } },
} as const;

export type CartRow = CartGetPayload<{ include: typeof cartInclude }>;
export type VariantRow = Prisma.VariantGetPayload<{ include: typeof variantInclude }>;

export const cartRepository = {
  find(customerId: string): Promise<CartRow | null> {
    return prisma.cart.findUnique({ where: { customerId }, include: cartInclude });
  },

  findInTx(tx: Prisma.TransactionClient, customerId: string): Promise<CartRow | null> {
    return tx.cart.findUnique({ where: { customerId }, include: cartInclude });
  },

  transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) {
    return prisma.$transaction(fn);
  },

  // Cart is created lazily on first write.
  ensure(tx: Prisma.TransactionClient, customerId: string) {
    return tx.cart.upsert({ where: { customerId }, create: { customerId }, update: {} });
  },

  findVariants(tx: Prisma.TransactionClient, ids: string[]): Promise<VariantRow[]> {
    return tx.variant.findMany({ where: { id: { in: ids } }, include: variantInclude });
  },
};
