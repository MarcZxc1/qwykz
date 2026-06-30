import type { Context } from "hono";
import { clerkClient } from "@clerk/backend";
import { HttpError } from "../middlewares/error.middleware";

export async function register(c: Context) {
  const body = await c.req.json();
  try {
    const user = await clerkClient.users.createUser({
      emailAddress: [body.email],
      password: body.password,
    });
    return c.json({ user }, 201);
  } catch (error: any) {
    const detailedMessage = error.errors?.[0]?.longMessage || error.errors?.[0]?.message || error.message || "Registration failed";
    throw new HttpError(400, detailedMessage);
  }
}

export async function login(c: Context) {
  return c.json({ 
    error: "Clerk strictly enforces client-side sign-ins for MFA and security. Please use @clerk/clerk-react or the Clerk Frontend API to sign in." 
  }, 400);
}
