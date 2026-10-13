import { customerRepository } from "../repository/customer.repository.js";
import { AppError, NotFoundError } from "../../../common/errors.js";
import type { UpdateProfileDto } from "../dto/profile.dto.js";
import type { CreateAddressDto, UpdateAddressDto } from "../dto/address.dto.js";
import { MAX_ADDRESSES } from "../dto/address.dto.js";
import type { Address, Customer } from "../../../generated/prisma/client.js";

// The storefront keeps a 10-digit Indian mobile; the DB stores E.164 (+91…).
const tenDigit = (phone: string) => phone.replace(/^\+91/, "");

export function toUser(c: Customer) {
  return {
    id: c.id,
    phone: tenDigit(c.phone),
    name: c.name ?? "",
    email: c.email ?? "",
    dob: c.dob ? c.dob.toISOString().slice(0, 10) : "",
    createdAt: c.createdAt.toISOString(),
  };
}

function toAddress(a: Address) {
  return {
    id: a.id,
    label: a.type,
    name: a.name,
    phone: a.phone,
    line1: a.line1,
    line2: a.line2 ?? "",
    city: a.city,
    state: a.state,
    pincode: a.pincode,
    country: "IN" as const,
    isDefault: a.isDefault,
  };
}

export const customerService = {
  async getProfile(customerId: string) {
    const customer = await customerRepository.findById(customerId);
    if (!customer) throw new AppError(401, "UNAUTHORIZED", "Account no longer exists. Please log in again.");
    return { user: toUser(customer) };
  },

  async updateProfile(customerId: string, data: UpdateProfileDto) {
    await this.getProfile(customerId);
    const customer = await customerRepository.update(customerId, data);
    return { user: toUser(customer) };
  },

  /* ------------------------------------------------------------- addresses */

  async listAddresses(customerId: string) {
    return { items: (await customerRepository.listAddresses(customerId)).map(toAddress) };
  },

  async createAddress(customerId: string, dto: CreateAddressDto) {
    const { label, isDefault, ...fields } = dto;
    const created = await customerRepository.transaction(async (tx) => {
      // Lock the customer row so concurrent creates can't both slip under the limit.
      await tx.$queryRaw`SELECT id FROM customers WHERE id = ${customerId} FOR UPDATE`;
      const count = await tx.address.count({ where: { customerId } });
      if (count >= MAX_ADDRESSES) {
        throw new AppError(409, "ADDRESS_LIMIT", `You can save up to ${MAX_ADDRESSES} addresses. Delete one to add another.`);
      }
      // The first address is always the default.
      const makeDefault = count === 0 || isDefault === true;
      if (makeDefault) await tx.address.updateMany({ where: { customerId, isDefault: true }, data: { isDefault: false } });
      return tx.address.create({ data: { ...fields, type: label, customerId, isDefault: makeDefault } });
    });
    return toAddress(created);
  },

  async updateAddress(customerId: string, id: string, dto: UpdateAddressDto) {
    const { label, isDefault, ...fields } = dto;
    const updated = await customerRepository.transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM customers WHERE id = ${customerId} FOR UPDATE`;
      const existing = await tx.address.findFirst({ where: { id, customerId } });
      if (!existing) throw NotFoundError("Address not found", "ADDRESS_NOT_FOUND");
      if (isDefault === true) await tx.address.updateMany({ where: { customerId, isDefault: true }, data: { isDefault: false } });
      // Un-defaulting the default directly would leave the customer with none; ignore it — the
      // default only moves when another address is made the default.
      return tx.address.update({
        where: { id },
        data: { ...fields, ...(label ? { type: label } : {}), ...(isDefault === true ? { isDefault: true } : {}) },
      });
    });
    return toAddress(updated);
  },

  async deleteAddress(customerId: string, id: string) {
    await customerRepository.transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM customers WHERE id = ${customerId} FOR UPDATE`;
      const existing = await tx.address.findFirst({ where: { id, customerId } });
      if (!existing) throw NotFoundError("Address not found", "ADDRESS_NOT_FOUND");
      await tx.address.delete({ where: { id } });
      if (existing.isDefault) {
        const next = await tx.address.findFirst({ where: { customerId }, orderBy: { id: "asc" } });
        if (next) await tx.address.update({ where: { id: next.id }, data: { isDefault: true } });
      }
    });
    return { ok: true };
  },
};
