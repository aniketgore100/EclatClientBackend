import type { Request, Response } from "express";
import { authService } from "../service/auth.service.js";
import { requestOtpSchema } from "../dto/request-otp.dto.js";
import { verifyOtpSchema } from "../dto/verify-otp.dto.js";
import { refreshTokenSchema } from "../dto/refresh-token.dto.js";
import { logoutSchema } from "../dto/logout.dto.js";

function requestMeta(req: Request) {
  return { userAgent: req.headers["user-agent"], ipAddress: req.ip };
}

export const authController = {
  async requestOtp(req: Request, res: Response) {
    const { phone } = requestOtpSchema.parse(req.body);
    const result = await authService.requestOtp(phone);
    res.status(202).json({ data: result });
  },

  async verifyOtp(req: Request, res: Response) {
    const { phone, otp } = verifyOtpSchema.parse(req.body);
    const result = await authService.verifyOtp(phone, otp, requestMeta(req));
    res.status(200).json({ data: result });
  },

  async refresh(req: Request, res: Response) {
    const { refreshToken } = refreshTokenSchema.parse(req.body);
    const result = await authService.refresh(refreshToken, requestMeta(req));
    res.status(200).json({ data: result });
  },

  async logout(req: Request, res: Response) {
    const { refreshToken } = logoutSchema.parse(req.body);
    await authService.logout(refreshToken);
    res.status(204).send();
  },

  async me(req: Request, res: Response) {
    res.status(200).json({ data: { customerId: req.customerId, phone: req.customerPhone } });
  },
};
