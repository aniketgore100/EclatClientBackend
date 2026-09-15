import { prisma } from "../../../config/prisma.js";
import type {
  CustomerGetPayload,
  OtpVerificationGetPayload,
  AuthSessionGetPayload,
} from "../../../generated/prisma/models.js";

export const authRepository = { 

  findCustomerByPhone(phone: string): Promise<CustomerGetPayload<object> | null> {
    return prisma.customer.findUnique({
      where: { phone },
    });
  },

  createCustomer(phone: string): Promise<CustomerGetPayload<object>> {
    return prisma.customer.create({
      data: { phone },
    });
  },

  createOtpVerification(data: {
    phone: string;
    purpose: "LOGIN" | "REGISTER" | "CHANGE_PHONE";
    codeHash: string;
    expiresAt: Date;
    maxAttempts?: number}): Promise<OtpVerificationGetPayload<object>> {
    return prisma.otpVerification.create({
      data: {
        phone: data.phone,
        purpose: data.purpose,
        codeHash: data.codeHash,
        expiresAt: data.expiresAt,
        maxAttempts: data.maxAttempts ?? 5,
      },
    });
  },

  findLatestOtp(
    phone: string,
    purpose: "LOGIN" | "REGISTER" | "CHANGE_PHONE",
  ): Promise<OtpVerificationGetPayload<object> | null> {
    return prisma.otpVerification.findFirst({
      where: {
        phone,
        purpose,
        verifiedAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  // DB-backed so the "N requests per window" rule holds across restarts and
  // multiple instances without needing Redis yet (see F-08/F-09 in the
  // backend plan — swap for a Redis counter there without touching callers).
  countOtpRequestsSince(
    phone: string,
    purpose: "LOGIN" | "REGISTER" | "CHANGE_PHONE",
    since: Date,
  ): Promise<number> {
    return prisma.otpVerification.count({
      where: { phone, purpose, createdAt: { gte: since } },
    });
  },

  incrementOtpAttempts(
    id: string,
  ): Promise<OtpVerificationGetPayload<object>> {
    return prisma.otpVerification.update({
      where: { id },
      data: {
        attempts: {
          increment: 1,
        },
      },
    });
  },

  markOtpVerified(
    id: string,
  ): Promise<OtpVerificationGetPayload<object>> {
    return prisma.otpVerification.update({
      where: { id },
      data: {
        verifiedAt: new Date(),
      },
    });
  },

  createSession(data: {
    customerId: string;
    refreshTokenHash: string;
    expiresAt: Date;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<AuthSessionGetPayload<object>> {
    return prisma.authSession.create({
      data: {
        customerId: data.customerId,
        refreshTokenHash: data.refreshTokenHash,
        expiresAt: data.expiresAt,
        userAgent: data.userAgent,
        ipAddress: data.ipAddress,
      },
    });
  },

  findSessionById(
    id: string,
  ): Promise<
    AuthSessionGetPayload<{
      include: {
        customer: true;
      };
    }> | null
  > {
    return prisma.authSession.findUnique({
      where: { id },
      include: {
        customer: true,
      },
    });
  },

  revokeSession(
    id: string,
  ): Promise<AuthSessionGetPayload<object>> {
    return prisma.authSession.update({
      where: { id },
      data: {
        revokedAt: new Date(),
      },
    });
  },

  updateSessionRefreshToken(
    id: string,
    refreshTokenHash: string,
    expiresAt: Date,
  ): Promise<AuthSessionGetPayload<object>> {
    return prisma.authSession.update({
      where: { id },
      data: {
        refreshTokenHash,
        expiresAt,
      },
    });
  },
};