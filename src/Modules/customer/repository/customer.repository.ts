import { prisma } from "../../../config/prisma.js";
import type { Prisma } from "../../../generated/prisma/client.js";

export const customerRepository = {
  findById(id: string) {
    return prisma.customer.findUnique({ where: { id } });
  },

  update(id: string, data: Prisma.CustomerUpdateInput) {
    return prisma.customer.update({ where: { id }, data });
  },

  /* ------------------------------------------------------------- addresses */

  listAddresses(customerId: string) {
    return prisma.address.findMany({
      where: { customerId },
      orderBy: [{ isDefault: "desc" }, { id: "asc" }],
    });
  },

  findAddress(customerId: string, id: string) {
    return prisma.address.findFirst({ where: { id, customerId } });
  },

  // Everything that has to stay consistent (limit, single default, promotion on delete) runs in a
  // serializable-enough transaction on the customer's row so two tabs can't race it.
  transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) {
    return prisma.$transaction(fn);
  },
};
