import type { Context } from "hono";
import { z } from "zod";
import { HttpError } from "../middlewares/error.middleware";
import { userService } from "../services/user.service";

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().trim().min(1).optional(),
});

export async function listUsers(c: Context) {
  const users = await userService.list();
  return c.json(users);
}

export async function createUser(c: Context) {
  const body = await c.req.json().catch(() => ({}));
  const parsed = createUserSchema.safeParse(body);

  if (!parsed.success) {
    throw new HttpError(400, "Invalid request body", parsed.error.flatten());
  }

  const user = await userService.create(parsed.data);
  c.status(201);
  return c.json(user);
}
