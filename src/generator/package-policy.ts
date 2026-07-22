import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import type {
  ExtraPackage,
  PackageAudit,
  ProjectOptions,
  ScaffoldFile,
} from "../types";

const AUTH_PACKAGES = new Set([
  "argon2",
  "jsonwebtoken",
  "@types/jsonwebtoken",
  "@clerk/backend",
  "@clerk/clerk-sdk-node",
  "@clerk/nextjs",
  "@clerk/react",
  "@clerk/vue",
  "@supabase/ssr",
  "@supabase/supabase-js",
  "bcryptjs",
]);

const CACHE_PACKAGES = new Set(["ioredis", "@upstash/redis"]);
const EXTRA_PACKAGES = new Map<string, ExtraPackage>([
  ["cors", "cors"],
  ["@types/cors", "cors"],
  ["helmet", "helmet"],
  ["@elysiajs/cors", "cors"],
  ["elysia-helmet", "helmet"],
  ["zod", "zod"],
]);

function classifyPackage(
  name: string,
  version: string,
  isDev: boolean,
  options: ProjectOptions,
): PackageAudit {
  if (AUTH_PACKAGES.has(name) || (name === "zod" && options.authTarget !== "clerk")) {
    return {
      name,
      version,
      category: "auth",
      reason: `Required by the selected ${options.authTarget} authentication flow`,
      isDev,
    };
  }

  if (CACHE_PACKAGES.has(name)) {
    return {
      name,
      version,
      category: "cache",
      reason: `Required by the selected ${options.cachingTarget} cache target`,
      isDev,
    };
  }

  const selectedExtra = EXTRA_PACKAGES.get(name);
  if (selectedExtra) {
    if (!options.extraPackages.includes(selectedExtra)) {
      throw new Error(
        `Package policy rejected "${name}": the ${selectedExtra} extra was not selected`,
      );
    }
    return {
      name,
      version,
      category: "extra",
      reason: `Explicitly selected through --${selectedExtra}`,
      isDev,
    };
  }

  return {
    name,
    version,
    category: isDev ? "dev" : "framework",
    reason: isDev
      ? `Development tooling required by the generated ${options.framework} scaffold`
      : `Runtime dependency required by the generated ${options.framework} scaffold`,
    isDev,
  };
}

export async function collectScaffoldFiles(rootDir: string): Promise<ScaffoldFile[]> {
  const files: ScaffoldFile[] = [];
  const ignoredDirectories = new Set([".git", "node_modules", "vendor"]);

  async function walk(directory: string): Promise<void> {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
      const absolutePath = join(directory, entry.name);
      if (entry.isDirectory()) {
        await walk(absolutePath);
      } else if (entry.isFile()) {
        files.push({
          path: relative(rootDir, absolutePath).replace(/\\/g, "/"),
          content: await Bun.file(absolutePath).text(),
        });
      }
    }
  }

  await walk(rootDir);
  return files.sort((a, b) => a.path.localeCompare(b.path));
}

export function buildPackageAudit(files: ScaffoldFile[], options: ProjectOptions): PackageAudit[] {
  const audit = new Map<string, PackageAudit>();

  for (const file of files.filter((candidate) => candidate.path.endsWith("package.json"))) {
    let packageJson: {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    try {
      packageJson = JSON.parse(file.content);
    } catch {
      throw new Error(`Generated ${file.path} is not valid JSON`);
    }

    for (const [name, version] of Object.entries(packageJson.dependencies ?? {})) {
      const entry = classifyPackage(name, version, false, options);
      audit.set(`${name}:runtime`, entry);
    }
    for (const [name, version] of Object.entries(packageJson.devDependencies ?? {})) {
      const entry = classifyPackage(name, version, true, options);
      audit.set(`${name}:dev`, entry);
    }
  }

  return [...audit.values()].sort((a, b) =>
    Number(a.isDev) - Number(b.isDev) || a.name.localeCompare(b.name),
  );
}
