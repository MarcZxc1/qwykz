import type { MiddlewareHandler } from "hono";
import { verifyToken } from "@clerk/backend";
import { HttpError } from "./error.middleware";

export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new HttpError(401, "Missing or malformed Authorization header");
  }

  const token = authHeader.slice(7);

  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    c.set("user", { id: payload.sub, role: payload.claims?.role as string | undefined });
    await next();
  } catch (error) {
    throw new HttpError(401, "Invalid or expired Clerk token");
  }
};

export const requireRole = (roles: string[]): MiddlewareHandler => async (c, next) => {
  const user = c.get("user");
  if (!user) {
    throw new HttpError(401, "Authentication required");
  }
  if (!user.role || !roles.includes(user.role)) {
    throw new HttpError(403, "Forbidden: Insufficient role permissions");
  }
  await next();
};
