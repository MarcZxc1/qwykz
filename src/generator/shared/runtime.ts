import { injectVariables, readTemplate } from "../../template-engine";
import type { AuthTarget, CachingTarget, DbTarget, ExtraPackage } from "../../types";

export async function resolveEnvFile(
  dbTarget: DbTarget,
  projectName: string,
  jwtSecret: string,
  dbPassword: string,
  authTarget: AuthTarget = "local",
  cachingTarget: CachingTarget = "none",
  dbPort: number = 54320,
  redisPort: number = 63790
): Promise<string> {
  const variantMap: Record<string, string> = {
    supabase: "express/env.supabase.txt",
    docker: "express/env.docker.txt",
    local: "express/env.local.txt",
    neon: "express/env.neon.txt",
  };

  const raw = await readTemplate(variantMap[dbTarget] || "express/env.local.txt");

  let authVars = "";
  if (authTarget === "clerk") {
    authVars = `\n# Clerk Auth\nCLERK_PUBLISHABLE_KEY="YOUR_CLERK_PUBLISHABLE_KEY"\nCLERK_SECRET_KEY="YOUR_CLERK_SECRET_KEY"\n`;
  } else if (authTarget === "supabase") {
    authVars = `\n# Supabase Auth\nSUPABASE_URL="https://your-project.supabase.co"\nSUPABASE_ANON_KEY="your-anon-key"\n`;
  }

  let cachingVars = "";
  if (cachingTarget === "docker") {
    cachingVars = `\n# Redis Caching (Docker)\nREDIS_URL="redis://127.0.0.1:${redisPort}"\n`;
  } else if (cachingTarget === "upstash") {
    cachingVars = `\n# Upstash Redis\nUPSTASH_REDIS_REST_URL="https://your-endpoint.upstash.io"\nUPSTASH_REDIS_REST_TOKEN="your-token"\n`;
  }

  if (dbTarget === "supabase" || dbTarget === "neon") {
    return injectVariables(raw, { JWT_SECRET: jwtSecret }) + authVars + cachingVars;
  }

  const dbName = projectName.replace(/[\\/]/g, "-");

  if (dbTarget === "docker") {
    return injectVariables(raw, {
      PROJECT_NAME: dbName,
      JWT_SECRET: jwtSecret,
      DB_PASSWORD: dbPassword,
      DB_PORT: dbPort.toString()
    }) + authVars + cachingVars;
  }

  // local
  return injectVariables(raw, {
    PROJECT_NAME: dbName,
    JWT_SECRET: jwtSecret,
  }) + authVars + cachingVars;
}

export async function resolveDockerCompose(
  projectName: string,
  dbPassword: string,
  dbTarget: string,
  cachingTarget: string,
  dbPort: number = 54320,
  redisPort: number = 63790
): Promise<string> {
  let compose = `services:\n`;
  let volumes = "";
  const containerPrefix = projectName.replace(/[\\/]/g, "-");

  if (dbTarget === "docker") {
    compose += `  qwykz-db:
    image: postgres:17-alpine
    container_name: ${containerPrefix}-postgres
    command: postgres -c synchronous_commit=off -c max_connections=50
    mem_limit: 512m
    mem_reservation: 128m
    cpus: 1.0
    pids_limit: 200
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${dbPassword}
      POSTGRES_DB: ${containerPrefix}
    ports:
      - "127.0.0.1:${dbPort}:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d ${containerPrefix}"]
      interval: 5s
      timeout: 5s
      retries: 12
      start_period: 5s
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
    volumes:
      - ${containerPrefix}_data:/var/lib/postgresql/data\n\n`;
    volumes += `  ${containerPrefix}_data:
    labels:
      io.qwykz.managed: "true"
      io.qwykz.kind: "postgres"\n`;
  }

  if (cachingTarget === "docker") {
    compose += `  qwykz-redis:
    image: redis:7-alpine
    container_name: ${containerPrefix}-redis
    command:
      - redis-server
      - --save
      - ""
      - --appendonly
      - "no"
      - --maxmemory
      - 96mb
      - --maxmemory-policy
      - allkeys-lru
    mem_limit: 128m
    mem_reservation: 32m
    cpus: 0.5
    pids_limit: 100
    ports:
      - "127.0.0.1:${redisPort}:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 10
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"\n\n`;
  }

  return volumes ? `${compose}volumes:\n${volumes}` : compose;
}

export async function resolvePrismaClient(dbTarget: DbTarget): Promise<string> {
  const variant =
    dbTarget === "supabase" || dbTarget === "neon"
      ? "express/prisma-client.supabase.ts"
      : "express/prisma-client.default.ts";
  return readTemplate(variant);
}

export async function resolveServerSource(
  extraPackages: ExtraPackage[],
  framework: "express" | "hono" | "elysia" = "express",
  authTarget: AuthTarget = "local"
): Promise<string> {
  const hasCors = extraPackages.includes("cors");
  const hasHelmet = extraPackages.includes("helmet");

  let extraImports = "";
  let extraMiddleware = "";

  if (framework === "express") {
    if (hasCors) extraImports += 'import cors from "cors";\n';
    if (hasHelmet) extraImports += 'import helmet from "helmet";\n';
    if (hasHelmet) extraMiddleware += "app.use(helmet());\n";
    if (hasCors) extraMiddleware += "app.use(cors({ origin: 'http://localhost:5173', credentials: true }));\n";
  } else if (framework === "hono") {
    if (hasCors) extraImports += 'import { cors } from "hono/cors";\n';
    if (hasHelmet) extraImports += 'import { secureHeaders } from "hono/secure-headers";\n';
    if (hasHelmet) extraMiddleware += "app.use('*', secureHeaders());\n";
    if (hasCors) extraMiddleware += "app.use('*', cors({ origin: 'http://localhost:5173', credentials: true }));\n";
  } else if (framework === "elysia") {
    if (hasCors) extraImports += 'import { cors } from "@elysiajs/cors";\n';
    if (hasHelmet) extraImports += 'import { helmet } from "elysia-helmet";\n';
    if (hasHelmet) extraMiddleware += "\n  .use(helmet())";
    if (hasCors) extraMiddleware += "\n  .use(cors({ origin: 'http://localhost:5173', credentials: true }))";
  }

  let authImport = 'import { authRouter } from "./routes/auth.routes";\n';
  let authRoute = "";
  if (framework === "express") authRoute = 'app.use("/api/auth", authRouter);\n';
  else if (framework === "hono") authRoute = 'app.route("/api/auth", authRouter);\n';
  else if (framework === "elysia") authRoute = '  .use(authRouter)\n';

  const raw = await readTemplate(`${framework}/server.ts`);
  return injectVariables(raw, {
    EXTRA_IMPORTS: extraImports,
    EXTRA_MIDDLEWARE: extraMiddleware,
    AUTH_IMPORT: authImport,
    AUTH_ROUTE: authRoute,
  });
}

export async function resolveUserController(
  extraPackages: ExtraPackage[],
): Promise<string> {
  const variant = extraPackages.includes("zod")
    ? "express/user.controller.zod.ts"
    : "express/user.controller.default.ts";
  return readTemplate(variant);
}

export async function resolveUserService(cachingTarget: CachingTarget): Promise<string> {
  let redisImport = "";
  let redisCacheCheck = "";
  let redisCacheSet = "";
  let redisCacheInvalidate = "";

  if (cachingTarget !== "none") {
    redisImport = 'import { redis } from "../lib/redis";\n';
    redisCacheCheck = `    const cached = await redis.get("users:list");\n    if (cached) return typeof cached === "string" ? JSON.parse(cached) : cached;\n`;

    if (cachingTarget === "upstash") {
      redisCacheSet = `    await redis.set("users:list", JSON.stringify(users), { ex: 60 });\n`;
    } else {
      redisCacheSet = `    await redis.set("users:list", JSON.stringify(users), "EX", 60);\n`;
    }

    redisCacheInvalidate = `    await redis.del("users:list");\n`;
  }

  const raw = await readTemplate("express/user.service.ts");
  return injectVariables(raw, {
    REDIS_IMPORT: redisImport,
    REDIS_CACHE_CHECK: redisCacheCheck,
    REDIS_CACHE_SET: redisCacheSet,
    REDIS_CACHE_INVALIDATE: redisCacheInvalidate,
  });
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------
