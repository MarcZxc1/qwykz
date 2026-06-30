import { Elysia } from "elysia";
import { createClient } from "@supabase/supabase-js";
import { HttpError } from "./error.middleware";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const authMiddleware = new Elysia().derive(async ({ request }) => {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new HttpError(401, "Missing or malformed Authorization header");
  }

  const token = authHeader.slice(7);

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      throw new HttpError(401, "Invalid or expired Supabase token");
    }
    return {
      user: { id: user.id, role: user.role },
    };
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(401, "Invalid or expired token");
  }
});

export const requireRole = (roles: string[]) => new Elysia()
  .use(authMiddleware)
  .onBeforeHandle(({ user }) => {
    if (!user.role || !roles.includes(user.role)) {
      throw new HttpError(403, "Forbidden: Insufficient role permissions");
    }
  });
