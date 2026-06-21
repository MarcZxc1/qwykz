import type { Request, Response, NextFunction } from "express";
import { verify } from "jsonwebtoken";
import { HttpError } from "./error.middleware";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set in environment variables. Server cannot start.");
}

export interface AuthRequest extends Request {
  user?: { id: string };
}

export function authMiddleware(req: AuthRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new HttpError(401, "Missing or malformed Authorization header"));
  }

  const token = authHeader.slice(7);

  try {
    const payload = verify(token, JWT_SECRET!) as { sub: string };
    req.user = { id: payload.sub };
    next();
  } catch {
    next(new HttpError(401, "Invalid or expired token"));
  }
}
