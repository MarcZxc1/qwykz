import { z } from "zod";
import { HttpError } from "../middlewares/error.middleware";
import { userService } from "../services/user.service";

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().trim().min(1).optional(),
});

export async function listUsers() {
  const users = await userService.list();
  return users;
}

export async function createUser({ body, set }: any) {
  const parsed = createUserSchema.safeParse(body);

  if (!parsed.success) {
    throw new HttpError(400, "Invalid request body", parsed.error.flatten());
  }

  const user = await userService.create(parsed.data);
  set.status = 201;
  return user;
}
