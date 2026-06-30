import { HttpError } from "../middlewares/error.middleware";
import { userService } from "../services/user.service";

export async function listUsers() {
  const users = await userService.list();
  return users;
}

export async function createUser({ body, set }: any) {
  const { email, name } = body as { email?: string; name?: string };

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpError(400, "A valid email address is required.");
  }

  if (name !== undefined && (typeof name !== "string" || name.trim().length === 0 || name.length > 100)) {
    throw new HttpError(400, "Name must be a non-empty string of 100 characters or fewer.");
  }

  const user = await userService.create({ email: email.toLowerCase().trim(), name: name?.trim() });
  set.status = 201;
  return user;
}
