import { Elysia } from "elysia";
import { verifyToken } from "@clerk/backend";
import { HttpError } from "./error.middleware";

export const authMiddleware = new Elysia().derive(async ({ request }) => {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new HttpError(401, "Missing or malformed Authorization header");
  }

  const token = authHeader.slice(7);

  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    return {
      user: { id: payload.sub, role: payload.role as string | undefined }
    };
  } catch {
    throw new HttpError(401, "Invalid or expired Clerk token");
  }
});

export const requireRole = (roles: string[]) => new Elysia()
  .use(authMiddleware)
  .onBeforeHandle(({ user }) => {
    if (!user.role || !roles.includes(user.role)) {
      throw new HttpError(403, "Forbidden: Insufficient role permissions");
    }
  });
