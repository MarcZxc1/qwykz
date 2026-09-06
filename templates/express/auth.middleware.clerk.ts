import type { Request, Response, NextFunction } from "express";
import { requireAuth, getAuth } from "@clerk/express";
import { HttpError } from "./error.middleware";

export interface AuthRequest extends Request {
  auth?: any;
  user?: { id: string; role?: string };
}

const requireClerkAuth = requireAuth();

// Adapter to map Clerk's auth context to req.user for consistency across the boilerplate
export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  requireClerkAuth(req, res, (err: any) => {
    if (err) return next(err);
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      return next(new HttpError(401, "Unauthenticated"));
    }
    req.user = { 
      id: auth.userId, 
      role: (auth.sessionClaims?.metadata as any)?.role ?? "user" 
    };
    next();
  });
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
