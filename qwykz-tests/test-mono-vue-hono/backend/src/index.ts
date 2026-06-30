import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";
import { prisma } from "./lib/prisma";
import { healthRouter } from "./routes/health.routes";
import { userRouter } from "./routes/user.routes";
import { authRouter } from "./routes/auth.routes";


const app = new Hono();
const port = Number(process.env.PORT ?? 3000);

app.use('*', cors({ origin: 'http://localhost:5173', credentials: true }));


app.route("/api/health", healthRouter);
app.route("/api/users", userRouter);
app.route("/api/auth", authRouter);


app.notFound(notFoundHandler);
app.onError(errorHandler);

async function startServer() {
  try {
    await prisma.$connect();

    serve({
      fetch: app.fetch,
      port
    }, (info) => {
      console.log(`Server listening on http://localhost:${info.port}`);
    });
  } catch (error) {
    console.error("Failed to start server. Check your database connection.");
    console.error(error);
    process.exit(1);
  }
}

await startServer();
