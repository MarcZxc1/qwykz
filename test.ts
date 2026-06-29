import { Elysia } from "elysia";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";
import { prisma } from "./lib/prisma";
import { healthRouter } from "./routes/health.routes";
import { userRouter } from "./routes/user.routes";
import { authRouter } from "./routes/auth.routes";

const port = Number(process.env.PORT ?? 3000);

const app = new Elysia()
  
  .use(healthRouter)
  .use(userRouter)
  .use(authRouter)
  .onError(errorHandler);

app.all("*", notFoundHandler);
