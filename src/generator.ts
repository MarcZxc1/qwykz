import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { createPackageJson } from "./package-json";
import { readTemplate, injectVariables } from "./template-engine";
import type { DbTarget, ExtraPackage, ProjectOptions } from "./types";

// ---------------------------------------------------------------------------
// Cryptographic secret helpers
// ---------------------------------------------------------------------------

/** Generate a 48-byte (96-char hex) secret suitable for JWT_SECRET. */
function generateJwtSecret(): string {
  return randomBytes(48).toString("hex");
}

/** Generate a 16-byte (32-char hex) password for the Docker PostgreSQL user. */
function generateDbPassword(): string {
  return randomBytes(16).toString("hex");
}

const PROJECT_FOLDERS = [
  "src/controllers",
  "src/services",
  "src/middlewares",
  "src/lib",
  "src/routes",
  "prisma",
];

async function writeJson(path: string, value: unknown) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

// ---------------------------------------------------------------------------
// Template resolvers — pick the right variant and inject variables
// ---------------------------------------------------------------------------

async function resolveEnvFile(
  dbTarget: DbTarget,
  projectName: string,
  jwtSecret: string,
  dbPassword: string,
): Promise<string> {
  const variantMap: Record<DbTarget, string> = {
    supabase: "express/env.supabase.txt",
    docker: "express/env.docker.txt",
    local: "express/env.local.txt",
  };

  const raw = await readTemplate(variantMap[dbTarget]);

  if (dbTarget === "supabase") {
    return injectVariables(raw, { JWT_SECRET: jwtSecret });
  }

  if (dbTarget === "docker") {
    return injectVariables(raw, {
      PROJECT_NAME: projectName,
      JWT_SECRET: jwtSecret,
      DB_PASSWORD: dbPassword,
    });
  }

  // local
  return injectVariables(raw, {
    PROJECT_NAME: projectName,
    JWT_SECRET: jwtSecret,
  });
}

async function resolveDockerCompose(
  projectName: string,
  dbPassword: string,
): Promise<string> {
  const raw = await readTemplate("express/docker-compose.yml");
  return injectVariables(raw, {
    PROJECT_NAME: projectName,
    DB_PASSWORD: dbPassword,
  });
}

async function resolvePrismaClient(dbTarget: DbTarget): Promise<string> {
  const variant =
    dbTarget === "supabase"
      ? "express/prisma-client.supabase.ts"
      : "express/prisma-client.default.ts";
  return readTemplate(variant);
}

async function resolveServerSource(
  extraPackages: ExtraPackage[],
): Promise<string> {
  const hasCors = extraPackages.includes("cors");
  const hasHelmet = extraPackages.includes("helmet");

  let extraImports = "";
  if (hasCors) extraImports += 'import cors from "cors";\n';
  if (hasHelmet) extraImports += 'import helmet from "helmet";\n';

  let extraMiddleware = "";
  if (hasHelmet) extraMiddleware += "app.use(helmet());\n";
  if (hasCors) extraMiddleware += "app.use(cors());\n";

  const raw = await readTemplate("express/server.ts");
  return injectVariables(raw, {
    EXTRA_IMPORTS: extraImports,
    EXTRA_MIDDLEWARE: extraMiddleware,
  });
}

async function resolveUserController(
  extraPackages: ExtraPackage[],
): Promise<string> {
  const variant = extraPackages.includes("zod")
    ? "express/user.controller.zod.ts"
    : "express/user.controller.default.ts";
  return readTemplate(variant);
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------

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
    ),
    resolvePrismaClient(options.dbTarget),
    resolveServerSource(options.extraPackages),
    readTemplate("express/error.middleware.ts"),
    readTemplate("express/health.routes.ts"),
    readTemplate("express/user.routes.ts"),
    resolveUserController(options.extraPackages),
    readTemplate("express/user.service.ts"),
    readTemplate("express/auth.controller.ts"),
    readTemplate("express/auth.middleware.ts"),
    readTemplate("express/auth.routes.ts"),
    options.dbTarget === "docker"
      ? readTemplate("express/wait-for-postgres.ts")
      : Promise.resolve(null),
    options.dbTarget === "docker"
      ? resolveDockerCompose(options.projectName, dbPassword)
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
    ["src/routes/auth.routes.ts", authRoutes],
    ["src/controllers/user.controller.ts", userController],
    ["src/controllers/auth.controller.ts", authController],
    ["src/services/user.service.ts", userService],
  ];

  if (options.dbTarget === "docker") {
    files.splice(5, 0, ["src/lib/wait-for-postgres.ts", waitForPostgres!]);
    files.push(["docker-compose.yml", dockerCompose!]);
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
    ).then((pkgJson) => writeJson(join(targetDir, "package.json"), pkgJson)),
  ]);
}

async function generateLaravelProject(options: ProjectOptions) {
  const targetDir = join(process.cwd(), options.projectName);

  console.log(`\n🚀Fetching the latest Laravel framework via Composer`);

  const proc = Bun.spawn({
    cmd: ["composer", "create-project", "laravel/laravel", options.projectName],
    cwd: process.cwd(),
    stdout: "inherit",
    stderr: "inherit",
  });

  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    throw new Error(
      "Composer failed to install Laravel. Do you have PHP/Composer installed?",
    );
  }

  console.log(`✅ Laravel installation complete!`);
}

export async function generateProject(options: ProjectOptions) {
  if (options.framework === "express") {
    await generateExpressProject(options);
  } else if (options.framework === "laravel") {
    await generateLaravelProject(options);
  }
}
