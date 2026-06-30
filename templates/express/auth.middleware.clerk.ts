import type { Request, Response, NextFunction } from "express";
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";
import { HttpError } from "./error.middleware";

export interface AuthRequest extends Request {
  auth?: { userId: string; sessionClaims?: { metadata?: { role?: string } } };
  user?: { id: string; role?: string };
}

// Clerk middleware automatically checks the token and injects req.auth
const clerkMiddleware = ClerkExpressRequireAuth({
  onError: (err: any, _req: Request, res: Response) => {
    res.status(401).json({ message: "Unauthenticated" });
  }
});

// Adapter to map Clerk's req.auth to req.user for consistency across the boilerplate
export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  clerkMiddleware(req, res, (err: any) => {
    if (err) return next(err);
    if (req.auth && req.auth.userId) {
      req.user = { 
        id: req.auth.userId, 
        role: req.auth.sessionClaims?.metadata?.role ?? "user" 
      };
    }
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
