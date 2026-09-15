import type { Request } from "express";
import { AppError } from "./errors.js";
export function requireParam(req: Request, name: string): string {
  const value = req.params[name];
  if (typeof value !== "string" || value.length === 0) {
    throw new AppError(400, "INVALID_PARAM", `Missing or invalid path parameter: ${name}`);
  }
  return value;
}
