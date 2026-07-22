import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createPackageJson } from "../../package-json";
import { readTemplate } from "../../template-engine";
import type { ProjectOptions } from "../../types";
import {
  PROJECT_FOLDERS,
  generateDbPassword,
  generateJwtSecret,
  writeJson,
} from "../shared/files";
import {
  resolveDockerCompose,
  resolveEnvFile,
  resolvePrismaClient,
  resolveServerSource,
  resolveUserController,
  resolveUserService,
} from "../shared/runtime";

export async function generateExpressProject(options: ProjectOptions) {
  const targetDir = join(process.cwd(), options.projectName);

  // Generate cryptographically secure secrets once per scaffold run.
  // These are never printed to the terminal.
  const jwtSecret = generateJwtSecret();
  const dbPassword = generateDbPassword();

  // Create directory structure
  await Promise.all(
    PROJECT_FOLDERS.map((folder) =>
      mkdir(join(targetDir, folder), { recursive: true }),
    ),
  );

  // Resolve all template contents in parallel
  const [
    prismaSchema,
    prismaConfig,
    tsconfig,
    envFile,
    prismaClient,
    serverSource,
    errorMiddleware,
    healthRoutes,
    userRoutes,
    userController,
    userService,
    authController,
    authMiddleware,
    authRoutes,
    waitForPostgres,
    dockerCompose,
    exampleTest,
  ] = await Promise.all([
    readTemplate("express/schema.prisma"),
    readTemplate("express/prisma.config.ts"),
    readTemplate("express/tsconfig.json"),
    resolveEnvFile(
      options.dbTarget,
      options.projectName,
      jwtSecret,
      dbPassword,
      options.authTarget,
      options.cachingTarget,
      options.dbPort,
      options.redisPort
    ),
    resolvePrismaClient(options.dbTarget),
    resolveServerSource(options.extraPackages, "express", options.authTarget),
    readTemplate("express/error.middleware.ts"),
    readTemplate("express/health.routes.ts"),
    readTemplate("express/user.routes.ts"),
    resolveUserController(options.extraPackages),
    resolveUserService(options.cachingTarget),
    readTemplate(`express/auth.controller${options.authTarget === 'local' ? '' : '.' + options.authTarget}.ts`),
    readTemplate(`express/auth.middleware${options.authTarget === 'local' ? '' : '.' + options.authTarget}.ts`),
    readTemplate("express/auth.routes.ts"),
    options.dbTarget === "docker" ? readTemplate("express/wait-for-postgres.ts") : Promise.resolve(null),
    options.dbTarget === "docker" || options.cachingTarget === "docker"
      ? resolveDockerCompose(options.projectName, dbPassword, options.dbTarget, options.cachingTarget, options.dbPort, options.redisPort)
      : Promise.resolve(null),
    readTemplate("express/example.test.ts"),
  ]);

  // Assemble file list
  const files: Array<[string, string]> = [
    ["prisma/schema.prisma", prismaSchema],
    ["prisma.config.ts", prismaConfig],
    ["tsconfig.json", tsconfig],
    [".env", envFile],
    ["src/lib/prisma.ts", prismaClient],
    ["src/index.ts", serverSource],
    ["src/index.test.ts", exampleTest],
    ["src/middlewares/error.middleware.ts", errorMiddleware],
    ["src/middlewares/auth.middleware.ts", authMiddleware],
    ["src/routes/health.routes.ts", healthRoutes],
    ["src/routes/user.routes.ts", userRoutes],
    ["src/routes/auth.routes.ts", authRoutes!],
    ["src/controllers/user.controller.ts", userController!],
    ["src/controllers/auth.controller.ts", authController!],
    ["src/services/user.service.ts", userService!],
  ];

  if (options.dbTarget === "docker" && waitForPostgres) {
    files.splice(5, 0, ["src/lib/wait-for-postgres.ts", waitForPostgres!]);
  }

  if (options.dbTarget === "docker" || options.cachingTarget === "docker") {
    files.push(["docker-compose.yml", dockerCompose!]);
  }

  if (options.cachingTarget === "docker") {
    files.push(["src/lib/redis.ts", await readTemplate("express/redis.docker.ts")]);
  } else if (options.cachingTarget === "upstash") {
    files.push(["src/lib/redis.ts", await readTemplate("express/redis.upstash.ts")]);
  }

  // Write all files + package.json in parallel
  await Promise.all([
    ...files.map(([path, content]) =>
      writeFile(join(targetDir, path), content),
    ),
    createPackageJson(
      options.projectName,
      options.dbTarget,
      options.extraPackages,
      options.cachingTarget,
      options.authTarget,
    ).then((pkgJson) => writeJson(join(targetDir, "package.json"), pkgJson)),
  ]);
}


export async function generateHonoProject(options: ProjectOptions) {
  const targetDir = join(process.cwd(), options.projectName);
  const jwtSecret = generateJwtSecret();
  const dbPassword = generateDbPassword();

  await Promise.all(
    PROJECT_FOLDERS.map((folder) =>
      mkdir(join(targetDir, folder), { recursive: true }),
    ),
  );

  const [
    prismaSchema, prismaConfig, tsconfig, envFile, prismaClient, serverSource, errorMiddleware, healthRoutes, userRoutes, userController, userService, authController, authMiddleware, authRoutes, waitForPostgres, dockerCompose, exampleTest
  ] = await Promise.all([
    readTemplate("express/schema.prisma"),
    readTemplate("express/prisma.config.ts"),
    readTemplate("express/tsconfig.json"),
    resolveEnvFile(options.dbTarget, options.projectName, jwtSecret, dbPassword, options.authTarget, options.cachingTarget, options.dbPort, options.redisPort),
    resolvePrismaClient(options.dbTarget),
    resolveServerSource(options.extraPackages, "hono", options.authTarget),
    readTemplate("hono/error.middleware.ts"),
    readTemplate("hono/health.routes.ts"),
    readTemplate("hono/user.routes.ts"),
    options.extraPackages.includes("zod") ? readTemplate("hono/user.controller.zod.ts") : readTemplate("hono/user.controller.default.ts"),
    resolveUserService(options.cachingTarget),
    readTemplate(`hono/auth.controller${options.authTarget === 'local' ? '' : '.' + options.authTarget}.ts`),
    readTemplate(`hono/auth.middleware${options.authTarget === 'local' ? '' : '.' + options.authTarget}.ts`),
    readTemplate("hono/auth.routes.ts"),
    options.dbTarget === "docker" ? readTemplate("express/wait-for-postgres.ts") : Promise.resolve(null),
    options.dbTarget === "docker" || options.cachingTarget === "docker" ? resolveDockerCompose(options.projectName, dbPassword, options.dbTarget, options.cachingTarget, options.dbPort, options.redisPort) : Promise.resolve(null),
    readTemplate("express/example.test.ts"),
  ]);

  const files: Array<[string, string]> = [
    ["prisma/schema.prisma", prismaSchema],
    ["prisma.config.ts", prismaConfig],
    ["tsconfig.json", tsconfig],
    [".env", envFile],
    ["src/lib/prisma.ts", prismaClient],
    ["src/index.ts", serverSource],
    ["src/middlewares/error.middleware.ts", errorMiddleware],
    ["src/middlewares/auth.middleware.ts", authMiddleware],
    ["src/routes/health.routes.ts", healthRoutes],
    ["src/routes/user.routes.ts", userRoutes],
    ["src/routes/auth.routes.ts", authRoutes!],
    ["src/controllers/user.controller.ts", userController],
    ["src/controllers/auth.controller.ts", authController!],
    ["src/services/user.service.ts", userService],
    ["src/index.test.ts", exampleTest],
  ];

  if (options.dbTarget === "docker" && waitForPostgres) {
    files.splice(5, 0, ["src/lib/wait-for-postgres.ts", waitForPostgres!]);
  }

  if (options.dbTarget === "docker" || options.cachingTarget === "docker") {
    files.push(["docker-compose.yml", dockerCompose!]);
  }

  if (options.cachingTarget === "docker") {
    files.push(["src/lib/redis.ts", await readTemplate("express/redis.docker.ts")]);
  } else if (options.cachingTarget === "upstash") {
    files.push(["src/lib/redis.ts", await readTemplate("express/redis.upstash.ts")]);
  }

  await Promise.all([
    ...files.map(([path, content]) => writeFile(join(targetDir, path), content)),
    createPackageJson(options.projectName, options.dbTarget, options.extraPackages, options.cachingTarget, options.authTarget, "hono").then((pkg) => {
      // Override for Hono
      pkg.dependencies.hono = "^4.0.0";
      pkg.dependencies["@hono/node-server"] = "^1.11.0";
      delete pkg.dependencies.cors;
      delete pkg.dependencies.helmet;
      delete pkg.devDependencies["@types/cors"];
      delete pkg.dependencies.express;
      delete pkg.devDependencies["@types/express"];
      return writeJson(join(targetDir, "package.json"), pkg);
    }),
  ]);
}


export async function generateElysiaProject(options: ProjectOptions) {
  const targetDir = join(process.cwd(), options.projectName);
  const jwtSecret = generateJwtSecret();
  const dbPassword = generateDbPassword();

  await Promise.all(
    PROJECT_FOLDERS.map((folder) =>
      mkdir(join(targetDir, folder), { recursive: true }),
    ),
  );

  const [
    prismaSchema, prismaConfig, tsconfig, envFile, prismaClient, serverSource, errorMiddleware, healthRoutes, userRoutes, userController, userService, authController, authMiddleware, authRoutes, waitForPostgres, dockerCompose, exampleTest
  ] = await Promise.all([
    readTemplate("express/schema.prisma"),
    readTemplate("express/prisma.config.ts"),
    readTemplate("express/tsconfig.json"),
    resolveEnvFile(options.dbTarget, options.projectName, jwtSecret, dbPassword, options.authTarget, options.cachingTarget, options.dbPort, options.redisPort),
    resolvePrismaClient(options.dbTarget),
    resolveServerSource(options.extraPackages, "elysia", options.authTarget),
    readTemplate("elysia/error.middleware.ts"),
    readTemplate("elysia/health.routes.ts"),
    readTemplate("elysia/user.routes.ts"),
    options.extraPackages.includes("zod") ? readTemplate("elysia/user.controller.zod.ts") : readTemplate("elysia/user.controller.default.ts"),
    resolveUserService(options.cachingTarget),
    readTemplate(`elysia/auth.controller${options.authTarget === 'local' ? '' : '.' + options.authTarget}.ts`),
    readTemplate(`elysia/auth.middleware${options.authTarget === 'local' ? '' : '.' + options.authTarget}.ts`),
    readTemplate("elysia/auth.routes.ts"),
    options.dbTarget === "docker" ? readTemplate("express/wait-for-postgres.ts") : Promise.resolve(null),
    options.dbTarget === "docker" || options.cachingTarget === "docker" ? resolveDockerCompose(options.projectName, dbPassword, options.dbTarget, options.cachingTarget, options.dbPort, options.redisPort) : Promise.resolve(null),
    readTemplate("express/example.test.ts"),
  ]);

  const files: Array<[string, string]> = [
    ["prisma/schema.prisma", prismaSchema],
    ["prisma.config.ts", prismaConfig],
    ["tsconfig.json", tsconfig],
    [".env", envFile],
    ["src/lib/prisma.ts", prismaClient],
    ["src/index.ts", serverSource],
    ["src/middlewares/error.middleware.ts", errorMiddleware],
    ["src/middlewares/auth.middleware.ts", authMiddleware],
    ["src/routes/health.routes.ts", healthRoutes],
    ["src/routes/user.routes.ts", userRoutes],
    ["src/routes/auth.routes.ts", authRoutes!],
    ["src/controllers/user.controller.ts", userController],
    ["src/controllers/auth.controller.ts", authController!],
    ["src/services/user.service.ts", userService],
    ["src/index.test.ts", exampleTest],
  ];

  if (options.dbTarget === "docker" && waitForPostgres) {
    files.splice(5, 0, ["src/lib/wait-for-postgres.ts", waitForPostgres!]);
  }

  if (options.dbTarget === "docker" || options.cachingTarget === "docker") {
    files.push(["docker-compose.yml", dockerCompose!]);
  }

  if (options.cachingTarget === "docker") {
    files.push(["src/lib/redis.ts", await readTemplate("express/redis.docker.ts")]);
  } else if (options.cachingTarget === "upstash") {
    files.push(["src/lib/redis.ts", await readTemplate("express/redis.upstash.ts")]);
  }

  await Promise.all([
    ...files.map(([path, content]) => writeFile(join(targetDir, path), content)),
    createPackageJson(options.projectName, options.dbTarget, options.extraPackages, options.cachingTarget, options.authTarget, "elysia").then((pkg) => {
      // Override for Elysia
      pkg.dependencies.elysia = "^1.0.0";
      if (options.extraPackages.includes("cors")) pkg.dependencies["@elysiajs/cors"] = "^1.0.2";
      if (options.extraPackages.includes("helmet")) pkg.dependencies["elysia-helmet"] = "^3.1.0";
      delete pkg.dependencies.cors;
      delete pkg.dependencies.helmet;
      delete pkg.devDependencies["@types/cors"];
      delete pkg.dependencies.express;
      delete pkg.devDependencies["@types/express"];
      return writeJson(join(targetDir, "package.json"), pkg);
    }),
  ]);
}
