import type { MiddlewareHandler } from "hono";
import { verify } from "jsonwebtoken";
import { HttpError } from "./error.middleware";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set in environment variables. Server cannot start.");
}

export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new HttpError(401, "Missing or malformed Authorization header");
  }

  const token = authHeader.slice(7);

  try {
    const payload = verify(token, JWT_SECRET!) as { sub: string };
    c.set("user", { id: payload.sub });
    await next();
  } catch {
    throw new HttpError(401, "Invalid or expired token");
  }
};
