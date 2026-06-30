import { createClient } from "@supabase/supabase-js";
import { HttpError } from "../middlewares/error.middleware";

const supabase = createClient(process.env.SUPABASE_URL || "", process.env.SUPABASE_ANON_KEY || "");

export const authController = {
  async register(body: any) {
    const { data, error } = await supabase.auth.signUp({ email: body.email, password: body.password });
    if (error) throw new HttpError(400, error.message);
    return { user: data.user, token: data.session?.access_token };
  },
  async login(body: any) {
    const { data, error } = await supabase.auth.signInWithPassword({ email: body.email, password: body.password });
    if (error) throw new HttpError(401, error.message);
    return { user: data.user, token: data.session?.access_token };
  }
};
