import type { Context } from "hono";
import { createClient } from "@supabase/supabase-js";
import { HttpError } from "../middlewares/error.middleware";

const supabase = createClient(process.env.SUPABASE_URL || "", process.env.SUPABASE_ANON_KEY || "");

export async function register(c: Context) {
  const body = await c.req.json();
  const { data, error } = await supabase.auth.signUp({ email: body.email, password: body.password });
  if (error) throw new HttpError(400, error.message);
  return c.json({ user: data.user, token: data.session?.access_token }, 201);
}

export async function login(c: Context) {
  const body = await c.req.json();
  const { data, error } = await supabase.auth.signInWithPassword({ email: body.email, password: body.password });
  if (error) throw new HttpError(401, error.message);
  return c.json({ user: data.user, token: data.session?.access_token });
}
