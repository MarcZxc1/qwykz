import type { Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";
import { HttpError } from "../middlewares/error.middleware";

const supabase = createClient(process.env.SUPABASE_URL || "", process.env.SUPABASE_ANON_KEY || "");

export async function register(req: Request, res: Response) {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw new HttpError(400, error.message);
  res.status(201).json({ user: data.user, token: data.session?.access_token });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new HttpError(401, error.message);
  res.json({ user: data.user, token: data.session?.access_token });
}
