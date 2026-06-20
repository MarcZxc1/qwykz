import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createPackageJson } from "./package-json";
import { readTemplate, injectVariables } from "./template-engine";
import type { DbTarget, ExtraPackage, ProjectOptions } from "./types";

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

async function resolveEnvFile(dbTarget: DbTarget, projectName: string): Promise<string> {
  const variantMap: Record<DbTarget, string> = {
    supabase: "mvc/env.supabase.txt",
    docker: "mvc/env.docker.txt",
    local: "mvc/env.local.txt",
  };

  const raw = await readTemplate(variantMap[dbTarget]);

  // Supabase .env has no project-specific variables
  if (dbTarget === "supabase") return raw;

  return injectVariables(raw, { PROJECT_NAME: projectName });
}

async function resolveDockerCompose(projectName: string): Promise<string> {
  const raw = await readTemplate("mvc/docker-compose.yml");
  return injectVariables(raw, { PROJECT_NAME: projectName });
}

async function resolvePrismaClient(dbTarget: DbTarget): Promise<string> {
  const variant = dbTarget === "supabase"
    ? "mvc/prisma-client.supabase.ts"
    : "mvc/prisma-client.default.ts";
  return readTemplate(variant);
}

async function resolveServerSource(extraPackages: ExtraPackage[]): Promise<string> {
  const hasCors = extraPackages.includes("cors");
  const hasHelmet = extraPackages.includes("helmet");

  let extraImports = "";
  if (hasCors) extraImports += 'import cors from "cors";\n';
  if (hasHelmet) extraImports += 'import helmet from "helmet";\n';

  let extraMiddleware = "";
  if (hasHelmet) extraMiddleware += "app.use(helmet());\n";
  if (hasCors) extraMiddleware += "app.use(cors());\n";

  const raw = await readTemplate("mvc/server.ts");
  return injectVariables(raw, {
    EXTRA_IMPORTS: extraImports,
    EXTRA_MIDDLEWARE: extraMiddleware,
  });
}

async function resolveUserController(extraPackages: ExtraPackage[]): Promise<string> {
  const variant = extraPackages.includes("zod")
    ? "mvc/user.controller.zod.ts"
    : "mvc/user.controller.default.ts";
  return readTemplate(variant);
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------

export async function generateProject(options: ProjectOptions) {
  const targetDir = join(process.cwd(), options.projectName);

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
  ] = await Promise.all([
    readTemplate("mvc/schema.prisma"),
    readTemplate("mvc/prisma.config.ts"),
    readTemplate("mvc/tsconfig.json"),
    resolveEnvFile(options.dbTarget, options.projectName),
    resolvePrismaClient(options.dbTarget),
    resolveServerSource(options.extraPackages),
    readTemplate("mvc/error.middleware.ts"),
    readTemplate("mvc/health.routes.ts"),
    readTemplate("mvc/user.routes.ts"),
    resolveUserController(options.extraPackages),
    readTemplate("mvc/user.service.ts"),
    readTemplate("mvc/auth.controller.ts"),
    readTemplate("mvc/auth.middleware.ts"),
    readTemplate("mvc/auth.routes.ts"),
    options.dbTarget === "docker"
      ? readTemplate("mvc/wait-for-postgres.ts")
      : Promise.resolve(null),
    options.dbTarget === "docker"
      ? resolveDockerCompose(options.projectName)
      : Promise.resolve(null),
  ]);

  // Assemble file list
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
    ...files.map(([path, content]) => writeFile(join(targetDir, path), content)),
    createPackageJson(
      options.projectName,
      options.dbTarget,
      options.extraPackages,
    ).then((pkgJson) => writeJson(join(targetDir, "package.json"), pkgJson)),
  ]);
}
