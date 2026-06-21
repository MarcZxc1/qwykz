import { Router } from "express";
import { createUser, listUsers } from "../controllers/user.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

export const userRouter = Router();

userRouter.get("/", authMiddleware, listUsers);
userRouter.post("/", authMiddleware, createUser);
