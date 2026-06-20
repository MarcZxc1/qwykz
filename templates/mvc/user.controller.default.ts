import type { Request, Response } from "express";
import { HttpError } from "../middlewares/error.middleware";
import { userService } from "../services/user.service";

export async function listUsers(_req: Request, res: Response) {
  const users = await userService.list();
  res.json(users);
}

export async function createUser(req: Request, res: Response) {
  const { email, name } = req.body as { email?: string; name?: string };

  if (!email) {
    throw new HttpError(400, "Email is required.");
  }

  const user = await userService.create({ email, name });
  res.status(201).json(user);
}
