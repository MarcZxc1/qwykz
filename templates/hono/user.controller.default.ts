import type { Context } from "hono";
import { HttpError } from "../middlewares/error.middleware";
import { userService } from "../services/user.service";

export async function listUsers(c: Context) {
  const users = await userService.list();
  return c.json(users);
}

export async function createUser(c: Context) {
  const body = await c.req.json().catch(() => ({}));
  const { email, name } = body as { email?: string; name?: string };

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpError(400, "A valid email address is required.");
  }

  if (name !== undefined && (typeof name !== "string" || name.trim().length === 0 || name.length > 100)) {
    throw new HttpError(400, "Name must be a non-empty string of 100 characters or fewer.");
  }

  const user = await userService.create({ email: email.toLowerCase().trim(), name: name?.trim() });
  c.status(201);
  return c.json(user);
}
