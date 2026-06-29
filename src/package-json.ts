import { packageVersions } from "./package-versions";
import { resolveLatestVersions } from "./npm-registry";
import type {
  DbTarget,
  CachingTarget,
  ExtraPackage,
  PackageMap,
  ProjectPackageJson,
} from "./types";

// ---------------------------------------------------------------------------
// All packages the generated project might need (names only)
// ---------------------------------------------------------------------------

const CORE_DEPS = [
  "@prisma/adapter-pg",
  "@prisma/client",
  "argon2",
  "dotenv",
  "express",
  "jsonwebtoken",
  "pg",
  "zod",  // always required — auth.controller.ts imports zod unconditionally
] as const;

const CORE_DEV_DEPS = [
  "@types/bun",
  "@types/express",
  "@types/jsonwebtoken",
  "@types/node",
  "@types/pg",
  "effect",
  "prisma",
  "typescript",
] as const;

const OPTIONAL_PACKAGES: Record<
  ExtraPackage,
  { dependencies?: string[]; devDependencies?: string[] }
> = {
  cors: { dependencies: ["cors"], devDependencies: ["@types/cors"] },
  helmet: { dependencies: ["helmet"] },
  zod: {},  // zod is in CORE_DEPS; this flag only controls the user controller variant
};

// ---------------------------------------------------------------------------
// Version resolution
// ---------------------------------------------------------------------------

/**
 * Collect all package names that need version resolution based on the
 * user's selected options.
 */
function collectAllPackageNames(extraPackages: ExtraPackage[]): string[] {
  const names = new Set<string>([...CORE_DEPS, ...CORE_DEV_DEPS]);

  for (const pkg of extraPackages) {
    for (const dep of OPTIONAL_PACKAGES[pkg].dependencies ?? []) names.add(dep);
    for (const dep of OPTIONAL_PACKAGES[pkg].devDependencies ?? []) names.add(dep);
  }

  return [...names];
}

/**
 * Build a version map by resolving latest versions dynamically.
 * Falls back to hardcoded versions if the network/cache fails.
 */
async function resolveVersionMap(
  extraPackages: ExtraPackage[],
): Promise<Record<string, string>> {
  const allNames = collectAllPackageNames(extraPackages);
  const resolved = await resolveLatestVersions(allNames);

  // Ensure we have a version for every package (fill gaps with hardcoded)
  const hardcoded: Record<string, string> = {
    ...packageVersions.dependencies,
    ...packageVersions.devDependencies,
  };

  for (const name of allNames) {
    if (!resolved[name]) {
      resolved[name] = hardcoded[name] ?? "latest";
    }
  }

  return resolved;
}

// ---------------------------------------------------------------------------
// Package.json builder
// ---------------------------------------------------------------------------

export async function createPackageJson(
  projectName: string,
  dbTarget: DbTarget,
  extraPackages: ExtraPackage[],
  cachingTarget: CachingTarget = "none",
): Promise<ProjectPackageJson> {
  const versions = await resolveVersionMap(extraPackages);

  const dependencies: PackageMap = {};
  for (const dep of CORE_DEPS) {
    dependencies[dep] = versions[dep]!;
  }

  const devDependencies: PackageMap = {};
  for (const dep of CORE_DEV_DEPS) {
    devDependencies[dep] = versions[dep]!;
  }

  for (const pkg of extraPackages) {
    for (const dep of OPTIONAL_PACKAGES[pkg].dependencies ?? []) {
      dependencies[dep] = versions[dep]!;
    }
    for (const dep of OPTIONAL_PACKAGES[pkg].devDependencies ?? []) {
      devDependencies[dep] = versions[dep]!;
    }
  }

  if (cachingTarget === "docker") {
    dependencies["ioredis"] = "^5.4.1";
  } else if (cachingTarget === "upstash") {
    dependencies["@upstash/redis"] = "^1.31.5";
  }

  return {
    name: projectName,
    version: "1.0.0",
    type: "module",
    scripts: {
      dev: "bun --watch src/index.ts",
      build: "bun build ./src/index.ts --outdir ./dist --target bun",
      start: "bun dist/index.js",
      test: "bun test",
      typecheck: "tsc --noEmit",
      postinstall: "prisma generate",
      "db:generate": "bunx --bun prisma generate",
      "db:push":
        dbTarget === "docker"
          ? "bun run db:wait && bunx --bun prisma db push"
          : "bunx --bun prisma db push",
      "db:studio": "bunx --bun prisma studio",
      ...(dbTarget === "docker"
        ? { "db:wait": "bun src/lib/wait-for-postgres.ts" }
        : {}),
    },
    dependencies,
    devDependencies,
  };
}
