import type { Request, Response } from "express";
import { HttpError } from "../middlewares/error.middleware";
import { userService } from "../services/user.service";

export async function listUsers(_req: Request, res: Response) {
  const users = await userService.list();
  res.json(users);
}

export async function createUser(req: Request, res: Response) {
  const { email, name } = req.body as { email?: string; name?: string };

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpError(400, "A valid email address is required.");
  }

  if (name !== undefined && (typeof name !== "string" || name.trim().length === 0 || name.length > 100)) {
    throw new HttpError(400, "Name must be a non-empty string of 100 characters or fewer.");
  }

  const user = await userService.create({ email: email.toLowerCase().trim(), name: name?.trim() });
  res.status(201).json(user);
}
