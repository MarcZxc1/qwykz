import { Elysia } from "elysia";
import { createUser, listUsers } from "../controllers/user.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

export const userRouter = new Elysia({ prefix: "/api/users" })
  .use(authMiddleware)
  .get("/", listUsers)
  .post("/", createUser);
