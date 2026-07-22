import { mkdir } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { dirname, join } from "node:path";
import {
  getTemplatesInDirectory,
  injectVariables,
  readTemplate,
} from "../template-engine";
import type { ProjectOptions, ProjectPackageJson } from "../types";
import type {
  LoadedPlugin,
  PluginFrameworkCapability,
} from "../plugins/types";

export async function applyPluginOverlay(
  projectRoot: string,
  plugin: LoadedPlugin,
  templateDir: string,
  options: ProjectOptions,
  replaceLocalAuth: boolean,
): Promise<void> {
  const overlayRoot = join(plugin.pluginDir, templateDir);
  const templateFiles = getTemplatesInDirectory("", overlayRoot);
  const variables = {
    PROJECT_NAME: options.projectName,
    DB_TARGET: options.dbTarget,
    AUTH_TARGET: options.authTarget,
    CACHING_TARGET: options.cachingTarget,
    JWT_SECRET: randomBytes(32).toString("hex"),
    DB_PORT: String(options.dbPort ?? 5432),
    REDIS_PORT: String(options.redisPort ?? 6379),
    EXTRA_IMPORTS: "",
    EXTRA_MIDDLEWARE: "",
  };

  for (const relativePath of templateFiles) {
    const raw = await readTemplate(relativePath, overlayRoot);
    const destination = join(
      projectRoot,
      relativePath.endsWith(".stub") ? relativePath.slice(0, -5) : relativePath,
    );
    await mkdir(dirname(destination), { recursive: true });
    await Bun.write(destination, injectVariables(raw, variables));
  }

  const hasPackages = Object.keys(plugin.manifest.packages?.dependencies ?? {}).length > 0 ||
    Object.keys(plugin.manifest.packages?.devDependencies ?? {}).length > 0 ||
    Object.keys(plugin.manifest.scripts ?? {}).length > 0;
  if (!hasPackages) return;

  const packageJsonPath = join(projectRoot, "package.json");
  if (!(await Bun.file(packageJsonPath).exists())) {
    throw new Error(
      `Plugin ${plugin.manifest.name} declares npm packages/scripts, but ${options.framework} does not generate package.json`,
    );
  }

  const packageJson = JSON.parse(await Bun.file(packageJsonPath).text()) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    scripts?: Record<string, string>;
  };
  packageJson.dependencies ??= {};
  packageJson.devDependencies ??= {};
  packageJson.scripts ??= {};

  if (replaceLocalAuth) {
    for (const dependency of ["argon2", "jsonwebtoken", "bcryptjs"]) {
      delete packageJson.dependencies[dependency];
    }
    for (const dependency of ["@types/jsonwebtoken", "@types/bcryptjs"]) {
      delete packageJson.devDependencies[dependency];
    }
    if (!options.extraPackages.includes("zod")) delete packageJson.dependencies.zod;
  }

  Object.assign(packageJson.dependencies, plugin.manifest.packages?.dependencies ?? {});
  Object.assign(packageJson.devDependencies, plugin.manifest.packages?.devDependencies ?? {});
  Object.assign(packageJson.scripts, plugin.manifest.scripts ?? {});
  await Bun.write(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
}

export async function generatePluginProject(
  options: ProjectOptions,
  plugin: LoadedPlugin,
  frameworkCap: PluginFrameworkCapability
) {
  console.log(`\n🚀 Scaffolding plugin framework ${frameworkCap.label}...`);
  const targetDir = join(process.cwd(), options.projectName);

  const pluginTemplatePath = join(plugin.pluginDir, frameworkCap.templateDir);
  const templateFiles = getTemplatesInDirectory("", pluginTemplatePath);

  const vars = {
    PROJECT_NAME: options.projectName,
    DB_TARGET: options.dbTarget,
    AUTH_TARGET: options.authTarget,
    CACHING_TARGET: options.cachingTarget,
    JWT_SECRET: randomBytes(32).toString("hex"),
    DB_PORT: (options.dbPort || 5432).toString(),
    REDIS_PORT: (options.redisPort || 6379).toString(),
    EXTRA_IMPORTS: "",
    EXTRA_MIDDLEWARE: "",
  };

  for (const relativePath of templateFiles) {
    const raw = await readTemplate(relativePath, pluginTemplatePath);
    const content = injectVariables(raw, vars);

    const targetFile = relativePath.endsWith(".stub") ? relativePath.slice(0, -5) : relativePath;
    const outPath = join(targetDir, targetFile);
    await mkdir(dirname(outPath), { recursive: true });
    await Bun.write(outPath, content);
  }

  const pkgJson: ProjectPackageJson = {
    name: options.projectName,
    version: "1.0.0",
    type: "module",
    scripts: { ...(plugin.manifest.scripts ?? {}) },
    dependencies: { ...(plugin.manifest.packages?.dependencies ?? {}) },
    devDependencies: { ...(plugin.manifest.packages?.devDependencies ?? {}) },
  };
  await Bun.write(join(targetDir, "package.json"), JSON.stringify(pkgJson, null, 2));
}
