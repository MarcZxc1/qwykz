import { Hono } from "hono";
import { createUser, listUsers } from "../controllers/user.controller";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware";

export const userRouter = new Hono<{ Variables: { user: { id: string; role: string } } }>();

userRouter.get("/", authMiddleware, requireRole(["ADMIN"]), listUsers);
userRouter.post("/", authMiddleware, requireRole(["ADMIN"]), createUser);
