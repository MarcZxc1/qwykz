import { Elysia } from "elysia";
{{EXTRA_IMPORTS}}import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";
import { prisma } from "./lib/prisma";
import { healthRouter } from "./routes/health.routes";
import { userRouter } from "./routes/user.routes";
{{AUTH_IMPORT}}

const port = Number(process.env.PORT ?? 3000);

const app = new Elysia(){{EXTRA_MIDDLEWARE}}
  .use(healthRouter)
  .use(userRouter)
{{AUTH_ROUTE}}
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
