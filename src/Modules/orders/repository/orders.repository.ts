import { prisma } from "../../../config/prisma.js";
import type { Prisma } from "../../../generated/prisma/client.js";

const orderInclude = {
  shipments: {
    where: { status: { not: "CANCELLED" as const } },
    orderBy: { createdAt: "desc" as const },
    take: 1,
    include: { events: { orderBy: { occurredAt: "desc" as const }, take: 20 } },
  },
  payments: { orderBy: { createdAt: "desc" as const }, take: 1 },
  items: {
    orderBy: { name: "asc" as const },
    include: { variant: { select: { product: { select: { category: { select: { slug: true } } } } } } },
  },
} as const;

export type OrderRow = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

export const ordersRepository = {
  orderInclude,

  transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) {
    return prisma.$transaction(fn, { timeout: 15_000 });
  },

  listForCustomer(customerId: string): Promise<OrderRow[]> {
    return prisma.order.findMany({ where: { customerId }, include: orderInclude, orderBy: { createdAt: "desc" }, take: 100 });
  },

  findByKey(customerId: string, idempotencyKey: string): Promise<OrderRow | null> {
    return prisma.order.findFirst({ where: { customerId, idempotencyKey }, include: orderInclude });
  },

  findForCustomer(customerId: string, number: string): Promise<OrderRow | null> {
    return prisma.order.findFirst({ where: { customerId, number }, include: orderInclude });
  },
};
