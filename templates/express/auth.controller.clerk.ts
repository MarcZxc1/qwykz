import type { Request, Response } from "express";
import { clerkClient } from "@clerk/clerk-sdk-node";
import { HttpError } from "../middlewares/error.middleware";

export async function register(req: Request, res: Response) {
  const { email, password } = req.body;
  try {
    const user = await clerkClient.users.createUser({
      emailAddress: [email],
      password,
    });
    res.status(201).json({ user });
  } catch (error: any) {
    const detailedMessage = error.errors?.[0]?.longMessage || error.errors?.[0]?.message || error.message || "Registration failed";
    throw new HttpError(400, detailedMessage);
  }
}

export async function login(req: Request, res: Response) {
  res.status(400).json({ 
    error: "Clerk strictly enforces client-side sign-ins for MFA and security. Please use @clerk/clerk-react or the Clerk Frontend API to sign in." 
  });
}
