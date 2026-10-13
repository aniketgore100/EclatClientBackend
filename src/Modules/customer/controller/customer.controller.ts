import type { Request, Response } from "express";
import { customerService } from "../service/customer.service.js";
import { updateProfileSchema } from "../dto/profile.dto.js";
import { createAddressSchema, updateAddressSchema } from "../dto/address.dto.js";
import { requireParam } from "../../../common/params.js";

// requireAuth guarantees customerId on every route in this module.
const me = (req: Request) => req.customerId!;

export const customerController = {
  async getProfile(req: Request, res: Response) {
    res.json({ data: await customerService.getProfile(me(req)) });
  },

  async updateProfile(req: Request, res: Response) {
    const dto = updateProfileSchema.parse(req.body);
    res.json({ data: await customerService.updateProfile(me(req), dto) });
  },

  async listAddresses(req: Request, res: Response) {
    res.json({ data: await customerService.listAddresses(me(req)) });
  },

  async createAddress(req: Request, res: Response) {
    const dto = createAddressSchema.parse(req.body);
    res.status(201).json({ data: await customerService.createAddress(me(req), dto) });
  },

  async updateAddress(req: Request, res: Response) {
    const dto = updateAddressSchema.parse(req.body);
    res.json({ data: await customerService.updateAddress(me(req), requireParam(req, "id"), dto) });
  },

  async deleteAddress(req: Request, res: Response) {
    res.json({ data: await customerService.deleteAddress(me(req), requireParam(req, "id")) });
  },
};
