import { clerkClient } from "@clerk/backend";
import { HttpError } from "../middlewares/error.middleware";

export const authController = {
  async register(body: any) {
    try {
      const user = await clerkClient.users.createUser({
        emailAddress: [body.email],
        password: body.password,
      });
      return { user };
    } catch (error: any) {
      const detailedMessage = error.errors?.[0]?.longMessage || error.errors?.[0]?.message || error.message || "Registration failed";
      throw new HttpError(400, detailedMessage);
    }
  },
  async login() {
    throw new HttpError(400, "Clerk strictly enforces client-side sign-ins for MFA and security. Please use @clerk/clerk-react or the Clerk Frontend API to sign in.");
  }
};
