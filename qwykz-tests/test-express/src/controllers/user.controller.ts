import type { Request, Response } from "express";
import { z } from "zod";
import { HttpError } from "../middlewares/error.middleware";
import { userService } from "../services/user.service";

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().trim().min(1).optional(),
});

export async function listUsers(_req: Request, res: Response) {
  const users = await userService.list();
  res.json(users);
}

export async function createUser(req: Request, res: Response) {
  const parsed = createUserSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new HttpError(400, "Invalid request body", parsed.error.flatten());
  }

  const user = await userService.create(parsed.data);
  res.status(201).json(user);
}
