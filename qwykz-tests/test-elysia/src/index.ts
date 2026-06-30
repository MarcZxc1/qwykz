import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { helmet } from "elysia-helmet";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";
import { prisma } from "./lib/prisma";
import { healthRouter } from "./routes/health.routes";
import { userRouter } from "./routes/user.routes";
import { authRouter } from "./routes/auth.routes";


const port = Number(process.env.PORT ?? 3000);

const app = new Elysia()
  .use(helmet())
  .use(cors({ origin: 'http://localhost:5173', credentials: true }))
  .use(healthRouter)
  .use(userRouter)
  .use(authRouter)

  .onError(errorHandler);

app.all("*", notFoundHandler);

async function startServer() {
  try {
    await prisma.$connect();

    app.listen(port, () => {
      console.log(`Server listening on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start server. Check your database connection.");
    console.error(error);
    process.exit(1);
  }
}

await startServer();
