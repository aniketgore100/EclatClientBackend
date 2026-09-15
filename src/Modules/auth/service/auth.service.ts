import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { authRepository } from "../repository/auth.repository.js";
import { AppError } from "../../../common/errors.js";
import { otpSender } from "../../../common/otpSender.js";
import { signAccessToken } from "../../../common/jwt.js";
import { env } from "../../../config/env.js";

const OTP_PURPOSE = "LOGIN" as const;
const BCRYPT_ROUNDS = 10;

export interface RequestMeta {
  userAgent?: string;
  ipAddress?: string;
}

function generateOtpCode(): string {
  // Static code outside production so Postman/manual testing doesn't need
  // server console access. Never applies in production (see otpSender.ts,
  // which also refuses to run without a real provider there) — this must
  // never be reachable once a real SMS/WhatsApp provider is wired up.
  if (env.NODE_ENV !== "production") {
    return "000000";
  }
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}



function generateSessionSecret(): string {
  return crypto.randomBytes(32).toString("hex");
}



function encodeRefreshToken(sessionId: string, secret: string): string {
  return `${sessionId}.${secret}`;
}



function decodeRefreshToken(token: string): { sessionId: string; secret: string } {
  const dot = token.indexOf(".");
  if (dot <= 0 || dot === token.length - 1) {
    throw new AppError(401, "INVALID_REFRESH_TOKEN", "Malformed refresh token");
  }
  return { sessionId: token.slice(0, dot), secret: token.slice(dot + 1) };
}




async function issueSession(customerId: string, phone: string, meta: RequestMeta) {
  const secret = generateSessionSecret();
  const refreshTokenHash = await bcrypt.hash(secret, BCRYPT_ROUNDS);
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  const session = await authRepository.createSession({
    customerId,
    refreshTokenHash,
    expiresAt,
    userAgent: meta.userAgent,
    ipAddress: meta.ipAddress,
  });

  return {
    accessToken: signAccessToken({ sub: customerId, phone }),
    refreshToken: encodeRefreshToken(session.id, secret),
  };
}




export const authService = {
 
 
  async requestOtp(phone: string) {
    const windowStart = new Date(Date.now() - env.OTP_WINDOW_MINUTES * 60 * 1000);
    const recentCount = await authRepository.countOtpRequestsSince(phone, OTP_PURPOSE, windowStart);
    if (recentCount >= env.OTP_MAX_PER_WINDOW) {
      throw new AppError(
        429,
        "OTP_RATE_LIMITED",
        `Too many OTP requests. Try again in ${env.OTP_WINDOW_MINUTES} minutes.`
      );
    }

    const latest = await authRepository.findLatestOtp(phone, OTP_PURPOSE);
    if (latest) {
      const elapsedMs = Date.now() - latest.createdAt.getTime();
      const cooldownMs = env.OTP_RESEND_COOLDOWN_SECONDS * 1000;
      if (elapsedMs < cooldownMs) {
        const waitSeconds = Math.ceil((cooldownMs - elapsedMs) / 1000);
        throw new AppError(429, "OTP_COOLDOWN", `Please wait ${waitSeconds}s before requesting another OTP`);
      }
    }

    const code = generateOtpCode();
    const codeHash = await bcrypt.hash(code, BCRYPT_ROUNDS);
    const expiresAt = new Date(Date.now() + env.OTP_TTL_MINUTES * 60 * 1000);

    await authRepository.createOtpVerification({
      phone,
      purpose: OTP_PURPOSE,
      codeHash,
      expiresAt,
      maxAttempts: env.OTP_MAX_ATTEMPTS,
    });


    await otpSender.send(phone, code);

    return { expiresInSeconds: env.OTP_TTL_MINUTES * 60 };
  },

  async verifyOtp(phone: string, code: string, meta: RequestMeta) {
    const record = await authRepository.findLatestOtp(phone, OTP_PURPOSE);
    if (!record) {
      throw new AppError(400, "OTP_NOT_FOUND", "No pending OTP for this phone. Request a new one.");
    }
    if (record.expiresAt.getTime() < Date.now()) {
      throw new AppError(400, "OTP_EXPIRED", "OTP has expired. Request a new one.");
    }
    if (record.attempts >= record.maxAttempts) {
      throw new AppError(429, "OTP_MAX_ATTEMPTS", "Too many incorrect attempts. Request a new OTP.");
    }

    const isValid = await bcrypt.compare(code, record.codeHash);
    if (!isValid) {
      await authRepository.incrementOtpAttempts(record.id);
      throw new AppError(400, "OTP_INVALID", "Incorrect OTP.");
    }

    await authRepository.markOtpVerified(record.id);

    let customer = await authRepository.findCustomerByPhone(phone);
    if (!customer) {
      customer = await authRepository.createCustomer(phone);
    }

    const tokens = await issueSession(customer.id, phone, meta);
    return {
      ...tokens,
      customer: { id: customer.id, phone: customer.phone, name: customer.name, email: customer.email },
    };
  },

  async refresh(refreshToken: string, meta: RequestMeta) {
    const { sessionId, secret } = decodeRefreshToken(refreshToken);
    const session = await authRepository.findSessionById(sessionId);

    if (!session || session.revokedAt || session.expiresAt.getTime() < Date.now()) {
      throw new AppError(401, "INVALID_REFRESH_TOKEN", "Session is invalid or expired. Please log in again.");
    }

    const isValid = await bcrypt.compare(secret, session.refreshTokenHash);
    if (!isValid) {
   
      await authRepository.revokeSession(session.id);
      throw new AppError(401, "INVALID_REFRESH_TOKEN", "Session is invalid or expired. Please log in again.");
    }

    
    const newSecret = generateSessionSecret();
    const newHash = await bcrypt.hash(newSecret, BCRYPT_ROUNDS);
    const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
    await authRepository.updateSessionRefreshToken(session.id, newHash, expiresAt);

    void meta; 

    return {
      accessToken: signAccessToken({ sub: session.customerId, phone: session.customer.phone }),
      refreshToken: encodeRefreshToken(session.id, newSecret),
    };
  },

  async logout(refreshToken: string) {
    const { sessionId, secret } = decodeRefreshToken(refreshToken);
    const session = await authRepository.findSessionById(sessionId);
    if (!session || session.revokedAt) {
      return;
    }

    const isValid = await bcrypt.compare(secret, session.refreshTokenHash);
    if (!isValid) {
      throw new AppError(401, "INVALID_REFRESH_TOKEN", "Invalid refresh token");
    }

    await authRepository.revokeSession(session.id);
  },

  
};
