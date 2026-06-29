import type { Request, Response } from "express";
import { z } from "zod";
import { sign } from "jsonwebtoken";
import { hash, verify } from "argon2";
import { HttpError } from "../middlewares/error.middleware";
import { prisma } from "../lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set in environment variables. Server cannot start.");
}

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
}).strict();

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
}).strict();

export async function register(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new HttpError(400, "Validation failed", parsed.error.flatten());
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (existing) {
    throw new HttpError(409, "A user with this email already exists");
  }

  const hashedPassword = await hash(parsed.data.password);

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      password: hashedPassword,
    },
  });

  const token = sign({ sub: user.id, role: user.role }, JWT_SECRET!, { expiresIn: "15m" });

  res.status(201).json({
    user: { id: user.id, email: user.email, role: user.role },
    token,
  });
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new HttpError(400, "Validation failed", parsed.error.flatten());
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (!user) {
    throw new HttpError(401, "Invalid email or password");
  }

  const isValidPassword = await verify(user.password, parsed.data.password);

  if (!isValidPassword) {
    throw new HttpError(401, "Invalid email or password");
  }

  const token = sign({ sub: user.id, role: user.role }, JWT_SECRET!, { expiresIn: "15m" });

  res.json({
    user: { id: user.id, email: user.email, role: user.role },
    token,
  });
}
