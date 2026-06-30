import { Router } from "express";
import { createUser, listUsers } from "../controllers/user.controller";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware";

export const userRouter = Router();

userRouter.get("/", authMiddleware, requireRole(["ADMIN"]), listUsers);
userRouter.post("/", authMiddleware, requireRole(["ADMIN"]), createUser);
