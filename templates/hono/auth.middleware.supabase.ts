import type { MiddlewareHandler } from "hono";
import { createClient } from "@supabase/supabase-js";
import { HttpError } from "./error.middleware";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new HttpError(401, "Missing or malformed Authorization header");
  }

  const token = authHeader.slice(7);

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      throw new HttpError(401, "Invalid or expired Supabase token");
    }
    c.set("user", { id: user.id, role: user.role });
    await next();
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(401, "Invalid or expired token");
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
