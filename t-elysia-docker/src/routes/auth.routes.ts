import { Elysia } from "elysia";
import { register, login } from "../controllers/auth.controller";

export const authRouter = new Elysia({ prefix: "/api/auth" })
  .post("/register", register)
  .post("/login", login);
