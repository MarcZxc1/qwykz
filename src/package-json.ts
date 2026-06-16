import { packageVersions } from "./package-versions";
import type {
  DbTarget,
  ExtraPackage,
  PackageMap,
  ProjectPackageJson,
} from "./types";

const optionalPackages: Record<
  ExtraPackage,
  { dependencies?: PackageMap; devDependencies?: PackageMap }
> = {
  cors: {
    dependencies: { cors: packageVersions.dependencies.cors },
    devDependencies: {
      "@types/cors": packageVersions.devDependencies["@types/cors"],
    },
  },
  helmet: {
    dependencies: { helmet: packageVersions.dependencies.helmet },
  },
  zod: {
    dependencies: { zod: packageVersions.dependencies.zod },
  },
};

export function createPackageJson(
  projectName: string,
  dbTarget: DbTarget,
  extraPackages: ExtraPackage[],
): ProjectPackageJson {
  const dependencies: PackageMap = {
    "@prisma/adapter-pg": packageVersions.dependencies["@prisma/adapter-pg"],
    "@prisma/client": packageVersions.dependencies["@prisma/client"],
    dotenv: packageVersions.dependencies.dotenv,
    express: packageVersions.dependencies.express,
    pg: packageVersions.dependencies.pg,
  };

  const devDependencies: PackageMap = {
    "@types/bun": packageVersions.devDependencies["@types/bun"],
    "@types/express": packageVersions.devDependencies["@types/express"],
    "@types/node": packageVersions.devDependencies["@types/node"],
    "@types/pg": packageVersions.devDependencies["@types/pg"],
    prisma: packageVersions.devDependencies.prisma,
    typescript: packageVersions.devDependencies.typescript,
  };

  for (const pkg of extraPackages) {
    Object.assign(dependencies, optionalPackages[pkg].dependencies);
    Object.assign(devDependencies, optionalPackages[pkg].devDependencies);
  }

  return {
    name: projectName,
    version: "1.0.0",
    type: "module",
    scripts: {
      dev: "bun --watch src/index.ts",
      build: "bun build ./src/index.ts --outdir ./dist --target bun",
      start: "bun dist/index.js",
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
