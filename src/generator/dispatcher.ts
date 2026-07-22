import { join } from "node:path";
import { packageVersions } from "../package-versions";
import type { ProjectOptions } from "../types";
import type { FrameworkGenerator } from "./contracts";
import {
  generateElysiaProject,
  generateExpressProject,
  generateHonoProject,
} from "./frameworks/node-api";
import { generateLaravelProject } from "./frameworks/laravel";
import { generateNextJsProject } from "./frameworks/nextjs";
import {
  generateReactProject,
  generateVueProject,
} from "./frameworks/vite";
import {
  generateGoProject,
  generatePythonProject,
  generateRustProject,
} from "./frameworks/native";
import { generatePluginProject } from "./plugin-generation";

const BUILT_IN_GENERATORS: Readonly<Record<string, FrameworkGenerator>> = {
  express: generateExpressProject,
  laravel: generateLaravelProject,
  nextjs: generateNextJsProject,
  react: generateReactProject,
  vue: generateVueProject,
  python: generatePythonProject,
  go: generateGoProject,
  rust: generateRustProject,
  hono: generateHonoProject,
  elysia: generateElysiaProject,
};

function getBackendCommand(backendFramework: string): string {
  if (backendFramework === "laravel") return "php artisan serve";
  if (backendFramework === "python") {
    return process.platform === "win32"
      ? "venv\\\\Scripts\\\\uvicorn app.main:app --reload"
      : "venv/bin/uvicorn app.main:app --reload";
  }
  if (backendFramework === "go") return "go run cmd/api/main.go";
  if (backendFramework === "rust") return "cargo run";
  return "bun dev";
}

async function generateMonorepo(options: ProjectOptions): Promise<void> {
  if (!options.backendFramework || !options.frontendFramework) {
    throw new Error("Monorepo generation requires backendFramework and frontendFramework");
  }

  const rootName = options.projectName;
  const backendFramework = options.backendFramework;
  const targetDir = join(process.cwd(), rootName);
  const backendOptions: ProjectOptions = {
    ...options,
    framework: backendFramework,
    projectName: `${rootName}/backend`,
    extraPackages: [...options.extraPackages],
  };
  const frontendOptions: ProjectOptions = {
    ...options,
    framework: options.frontendFramework,
    projectName: `${rootName}/frontend`,
    extraPackages: [...options.extraPackages],
  };

  await generateProjectFiles(backendOptions);
  await generateProjectFiles(frontendOptions);

  const includeBackendWorkspace = ["express", "hono", "elysia", "laravel"].includes(backendFramework);
  const hasPrismaBackend = ["express", "hono", "elysia"].includes(backendFramework);
  const rootPackage = {
    name: rootName,
    private: true,
    workspaces: includeBackendWorkspace ? ["backend", "frontend"] : ["frontend"],
    scripts: {
      dev: `bunx concurrently "cd backend && ${getBackendCommand(backendFramework)}" "cd frontend && bun dev"`,
      ...(hasPrismaBackend
        ? {
            "db:generate": "cd backend && bun run db:generate",
            "db:push": "cd backend && bun run db:push",
            "db:studio": "cd backend && bun run db:studio",
          }
        : backendFramework === "laravel"
          ? { "db:migrate": "cd backend && php artisan migrate" }
          : {}),
    },
    devDependencies: {
      concurrently: packageVersions.devDependencies.concurrently,
    },
  };

  await Bun.write(join(targetDir, "package.json"), JSON.stringify(rootPackage, null, 2));
}

export async function generateProjectFiles(options: ProjectOptions): Promise<void> {
  if (options.framework === "monorepo") {
    await generateMonorepo(options);
    return;
  }

  const builtInGenerator = BUILT_IN_GENERATORS[options.framework];
  if (builtInGenerator) {
    await builtInGenerator(options);
    return;
  }

  const { registry } = await import("../plugins/registry");
  const plugin = registry.getPluginForFramework(options.framework);
  const frameworkCapability = plugin?.manifest.capabilities.frameworks.find(
    (capability) => capability.name === options.framework,
  );
  if (!plugin || !frameworkCapability) {
    throw new Error(`Unknown framework: ${options.framework}`);
  }

  await generatePluginProject(options, plugin, frameworkCapability);
}
