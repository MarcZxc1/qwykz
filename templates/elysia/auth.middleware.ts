import { Elysia } from "elysia";
import { verify } from "jsonwebtoken";
import { HttpError } from "./error.middleware";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set in environment variables. Server cannot start.");
}

export const authMiddleware = new Elysia()
  .derive(({ request: { headers } }) => {
    const authHeader = headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new HttpError(401, "Missing or malformed Authorization header");
    }

    const token = authHeader.slice(7);

    try {
      const payload = verify(token, JWT_SECRET!) as { sub: string; role: string };
      return {
        user: { id: payload.sub, role: payload.role }
      };
    } catch {
      throw new HttpError(401, "Invalid or expired token");
    }
  });

export const requireRole = (roles: string[]) => new Elysia()
  .use(authMiddleware)
  .onBeforeHandle(({ user }) => {
    if (!roles.includes(user.role)) {
      throw new HttpError(403, "Forbidden: Insufficient role permissions");
    }
  });
