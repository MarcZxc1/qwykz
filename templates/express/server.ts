import express from "express";
{{EXTRA_IMPORTS}}import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";
import { prisma } from "./lib/prisma";
import { healthRouter } from "./routes/health.routes";
import { userRouter } from "./routes/user.routes";
import { authRouter } from "./routes/auth.routes";

const app = express();
const port = Number(process.env.PORT ?? 3000);

{{EXTRA_MIDDLEWARE}}app.use(express.json());

app.use("/health", healthRouter);
app.use("/users", userRouter);
app.use("/auth", authRouter);

app.use(notFoundHandler);
app.use(errorHandler);

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
