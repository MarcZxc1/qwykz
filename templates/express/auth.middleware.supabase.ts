import type { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";
import { HttpError } from "./error.middleware";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface AuthRequest extends Request {
  user?: { id: string; role?: string };
}

export async function authMiddleware(req: AuthRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new HttpError(401, "Missing or malformed Authorization header"));
  }

  const token = authHeader.slice(7);

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return next(new HttpError(401, "Invalid or expired Supabase token"));
    }
    req.user = { id: user.id, role: user.role };
    next();
  } catch (error) {
    next(new HttpError(401, "Invalid or expired token"));
  }
}

export function requireRole(roles: string[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new HttpError(401, "Authentication required"));
    }
    if (!req.user.role || !roles.includes(req.user.role)) {
      return next(new HttpError(403, "Forbidden: Insufficient role permissions"));
    }
    next();
  };
}
