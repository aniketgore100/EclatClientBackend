import { env } from "../config/env.js";
import { AppError } from "./errors.js";

export interface OtpSender {
  send(phone: string, code: string): Promise<void>;
}

const consoleOtpSender: OtpSender = {
  async send(phone, code) {
    if (env.NODE_ENV === "production") {
      throw new AppError(
        503,
        "OTP_PROVIDER_NOT_CONFIGURED",
        "SMS/WhatsApp OTP delivery is not configured for this environment"
      );
    }
    console.log(`[dev-only] OTP for ${phone}: ${code} (expires in ${env.OTP_TTL_MINUTES}m)`);
  },
};

export const otpSender: OtpSender = consoleOtpSender;
