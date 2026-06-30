import { Elysia } from "elysia";
import { createUser, listUsers } from "../controllers/user.controller";
import { requireRole } from "../middlewares/auth.middleware";

export const userRouter = new Elysia({ prefix: "/api/users" })
  .use(requireRole(["ADMIN"]))
  .get("/", listUsers)
  .post("/", createUser);
