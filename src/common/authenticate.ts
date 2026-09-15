import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "./jwt.js";
import { AppError } from "./errors.js";

declare global {
  namespace Express {
    interface Request {
      customerId?: string;
      customerPhone?: string;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw new AppError(401, "UNAUTHORIZED", "Missing or invalid Authorization header");
  }

  const token = header.slice("Bearer ".length).trim();
  try {
    const payload = verifyAccessToken(token);
    req.customerId = payload.sub;
    req.customerPhone = payload.phone;
    next();
  } catch {
    throw new AppError(401, "UNAUTHORIZED", "Invalid or expired access token");
  }
}
