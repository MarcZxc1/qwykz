import { Hono } from "hono";
import { createUser, listUsers } from "../controllers/user.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

export const userRouter = new Hono<{ Variables: { user: { id: string } } }>();

userRouter.get("/", authMiddleware, listUsers);
userRouter.post("/", authMiddleware, createUser);
