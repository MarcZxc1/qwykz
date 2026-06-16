import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createPackageJson } from "./package-json";
import {
  createDockerCompose,
  createEnvFile,
  createErrorMiddlewareSource,
  createHealthRouteSource,
  createPrismaClientSource,
  createPrismaConfigSource,
  createPrismaSchemaSource,
  createServerSource,
  createTsConfigSource,
  createUserControllerSource,
  createUserRouteSource,
  createUserServiceSource,
  createWaitForPostgresSource,
} from "./project-templates";
import type { ProjectOptions } from "./types";

const projectFolders = [
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

export async function generateProject(options: ProjectOptions) {
  const targetDir = join(process.cwd(), options.projectName);

  await Promise.all(
    projectFolders.map((folder) =>
      mkdir(join(targetDir, folder), { recursive: true }),
    ),
  );

  const files: Array<[string, string]> = [
    ["prisma/schema.prisma", createPrismaSchemaSource()],
    ["prisma.config.ts", createPrismaConfigSource()],
    ["tsconfig.json", createTsConfigSource()],
    [".env", createEnvFile(options.dbTarget, options.projectName)],
    ["src/lib/prisma.ts", createPrismaClientSource(options.dbTarget)],
    ["src/index.ts", createServerSource(options.extraPackages)],
    ["src/middlewares/error.middleware.ts", createErrorMiddlewareSource()],
    ["src/routes/health.routes.ts", createHealthRouteSource()],
    ["src/routes/user.routes.ts", createUserRouteSource()],
    [
      "src/controllers/user.controller.ts",
      createUserControllerSource(options.extraPackages),
    ],
    ["src/services/user.service.ts", createUserServiceSource()],
  ];

  if (options.dbTarget === "docker") {
    files.splice(5, 0, [
      "src/lib/wait-for-postgres.ts",
      createWaitForPostgresSource(),
    ]);
    files.push([
      "docker-compose.yml",
      createDockerCompose(options.projectName),
    ]);
  }

  await Promise.all(
    files.map(([path, content]) => writeFile(join(targetDir, path), content)),
  );
  await writeJson(
    join(targetDir, "package.json"),
    createPackageJson(
      options.projectName,
      options.dbTarget,
      options.extraPackages,
    ),
  );
}
