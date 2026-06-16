import type { DbTarget, ExtraPackage } from "./types";

export function createEnvFile(dbTarget: DbTarget, projectName: string) {
  const shared = "NODE_ENV=development\nPORT=3000";

  if (dbTarget === "supabase") {
    return `${shared}
# DATABASE_URL: Transaction Pooler (port 6543) - Recommended for serverless/pooled connections
DATABASE_URL="postgres://postgres.[YOUR-PROJECT-ID]:[YOUR-PASSWORD]@[YOUR-HOST]:6543/postgres?pgbouncer=true"

# DIRECT_URL: Session Pooler (port 5432) or Direct Connection - Required for Prisma migrations (db push/pull)
DIRECT_URL="postgres://postgres.[YOUR-PROJECT-ID]:[YOUR-PASSWORD]@[YOUR-HOST]:5432/postgres"`;
  }

  if (dbTarget === "docker") {
    return `${shared}
DATABASE_URL="postgresql://postgres:secretpassword@localhost:5432/${projectName}?schema=public"`;
  }

  return `${shared}
DATABASE_URL="postgresql://postgres:password@localhost:5432/${projectName}?schema=public"`;
}

export function createDockerCompose(projectName: string) {
  return `services:
  qwykz-db:
    image: postgres:17-alpine
    container_name: ${projectName}-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: secretpassword
      POSTGRES_DB: ${projectName}
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d ${projectName}"]
      interval: 5s
      timeout: 5s
      retries: 12
      start_period: 5s
    volumes:
      - qwykz_data:/var/lib/postgresql/data

volumes:
  qwykz_data:
`;
}

export function createWaitForPostgresSource() {
  return `const childProcess = Bun.spawn({
  cmd: [
    "docker",
    "compose",
    "up",
    "-d",
    "--wait",
    "--wait-timeout",
    "60",
  ],
  stdout: "inherit",
  stderr: "inherit",
  stdin: "inherit",
});

const exitCode = await childProcess.exited;
if (exitCode !== 0) {
  throw new Error("Docker Compose did not report a healthy Postgres service.");
}
`;
}

export function createPrismaSchemaSource() {
  return `datasource db {
  provider = "postgresql"
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
`;
}

export function createPrismaConfigSource() {
  return `import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});
`;
}

export function createTsConfigSource() {
  return `{
  "compilerOptions": {
    "lib": ["ESNext"],
    "target": "ESNext",
    "module": "Preserve",
    "moduleDetection": "force",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "strict": true,
    "skipLibCheck": true,
    "types": ["bun", "node"]
  },
  "include": ["src", "prisma.config.ts"]
}
`;
}

export function createPrismaClientSource(dbTarget: DbTarget) {
  if (dbTarget === "supabase") {
    return `import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// 1. Get your Pooled URL from .env
const connectionString = process.env.DATABASE_URL;

// Add this check to debug
if (!connectionString) {
  console.error("❌ DATABASE_URL is not defined in your .env file!");
} else {
  console.log("DB URL DETECTED!");
}

// 2. Setup the Postgres Pool (the 'engine')
const pool = new pg.Pool({ connectionString });

// 3. Setup the Prisma Adapter (the 'bridge')
const adapter = new PrismaPg(pool);

// 4. Create the Client singleton
const globalPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: ["query", "info", "warn", "error"],
  });

if (process.env.NODE_ENV !== "production") globalPrisma.prisma = prisma;
`;
  }

  return `import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined in your .env file.");
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const globalPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "info", "warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalPrisma.prisma = prisma;
`;
}

export function createServerSource(extraPackages: ExtraPackage[]) {
  const hasCors = extraPackages.includes("cors");
  const hasHelmet = extraPackages.includes("helmet");

  return `import express from "express";
${hasCors ? 'import cors from "cors";\n' : ""}${hasHelmet ? 'import helmet from "helmet";\n' : ""}import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";
import { prisma } from "./lib/prisma";
import { healthRouter } from "./routes/health.routes";
import { userRouter } from "./routes/user.routes";

const app = express();
const port = Number(process.env.PORT ?? 3000);

${hasHelmet ? "app.use(helmet());\n" : ""}${hasCors ? "app.use(cors());\n" : ""}app.use(express.json());

app.use("/health", healthRouter);
app.use("/users", userRouter);

app.use(notFoundHandler);
app.use(errorHandler);

async function startServer() {
  try {
    await prisma.$connect();

    app.listen(port, () => {
      console.log(\`Server listening on http://localhost:\${port}\`);
    });
  } catch (error) {
    console.error("Failed to start server. Check your database connection.");
    console.error(error);
    process.exit(1);
  }
}

await startServer();
`;
}

export function createErrorMiddlewareSource() {
  return `import type { ErrorRequestHandler, RequestHandler } from "express";

export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new HttpError(404, \`Route \${req.method} \${req.originalUrl} not found\`));
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const statusCode = error instanceof HttpError ? error.statusCode : 500;
  const message = error instanceof Error ? error.message : "Unexpected server error";

  res.status(statusCode).json({
    error: {
      message,
      details: error instanceof HttpError ? error.details : undefined,
    },
  });
};
`;
}

export function createHealthRouteSource() {
  return `import { Router } from "express";
import { prisma } from "../lib/prisma";

export const healthRouter = Router();

healthRouter.get("/", async (_req, res) => {
  try {
    await prisma.$queryRaw\`SELECT 1\`;
    res.json({ status: "ok", database: "connected" });
  } catch {
    res.status(503).json({ status: "error", database: "disconnected" });
  }
});
`;
}

export function createUserRouteSource() {
  return `import { Router } from "express";
import { createUser, listUsers } from "../controllers/user.controller";

export const userRouter = Router();

userRouter.get("/", listUsers);
userRouter.post("/", createUser);
`;
}

export function createUserControllerSource(extraPackages: ExtraPackage[]) {
  const hasZod = extraPackages.includes("zod");

  if (hasZod) {
    return `import type { Request, Response } from "express";
import { z } from "zod";
import { HttpError } from "../middlewares/error.middleware";
import { userService } from "../services/user.service";

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().trim().min(1).optional(),
});

export async function listUsers(_req: Request, res: Response) {
  const users = await userService.list();
  res.json(users);
}

export async function createUser(req: Request, res: Response) {
  const parsed = createUserSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new HttpError(400, "Invalid request body", parsed.error.flatten());
  }

  const user = await userService.create(parsed.data);
  res.status(201).json(user);
}
`;
  }

  return `import type { Request, Response } from "express";
import { HttpError } from "../middlewares/error.middleware";
import { userService } from "../services/user.service";

export async function listUsers(_req: Request, res: Response) {
  const users = await userService.list();
  res.json(users);
}

export async function createUser(req: Request, res: Response) {
  const { email, name } = req.body as { email?: string; name?: string };

  if (!email) {
    throw new HttpError(400, "Email is required.");
  }

  const user = await userService.create({ email, name });
  res.status(201).json(user);
}
`;
}

export function createUserServiceSource() {
  return `import { prisma } from "../lib/prisma";

export const userService = {
  list() {
    return prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
  },
  create(data: { email: string; name?: string }) {
    return prisma.user.create({ data });
  },
};
`;
}
