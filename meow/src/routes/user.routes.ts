import { Router } from "express";
import { createUser, listUsers } from "../controllers/user.controller";

export const userRouter = Router();

userRouter.get("/", listUsers);
userRouter.post("/", createUser);
