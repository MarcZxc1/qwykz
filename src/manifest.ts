/**
 * Scaffold manifest — written as .qwykz-manifest.json into every generated project.
 * Records what qwykz decided so the scaffold is reproducible and inspectable.
 */
import type { ScaffoldManifest, ScaffoldPlan } from "./types";
import pkg from "../package.json";
import { createHash } from "node:crypto";
import { getProjectCapability } from "./capability/matrix";
import { registry } from "./plugins/registry";

/**
 * Build a ScaffoldManifest from a completed ScaffoldPlan.
 * The plan must already contain the resolved package audit list.
 */
export function buildManifest(plan: ScaffoldPlan): ScaffoldManifest {
  const { options, packageAudit, generatedAt } = plan;

  const dependencies: Record<string, string> = {};
  const devDependencies: Record<string, string> = {};

  for (const entry of packageAudit) {
    if (entry.isDev) {
      devDependencies[entry.name] = entry.version;
    } else {
      dependencies[entry.name] = entry.version;
    }
  }

  const checksums = Object.fromEntries(
    plan.files
      .filter((file) => file.path !== ".qwykz-manifest.json")
      .map((file) => [
        file.path,
        `sha256:${createHash("sha256").update(file.content).digest("hex")}`,
      ]),
  );

  return {
    $schema: "https://qwykz.dev/manifest.schema.json",
    generator: {
      name: "qwykz",
      version: pkg.version,
    },
    scaffold: {
      framework: options.framework,
      ...(options.preset ? { preset: options.preset } : {}),
      dbTarget: options.dbTarget,
      authTarget: options.authTarget,
      cachingTarget: options.cachingTarget,
      frontendFramework: options.frontendFramework ?? null,
      backendFramework: options.backendFramework ?? null,
      extraPackages: options.extraPackages,
      ...(options.learn ? { learn: true } : {}),
    },
    packages: {
      dependencies,
      devDependencies,
    },
    packageAudit: packageAudit.map((entry) => ({ ...entry })),
    templates: {
      engine: "qwykz-template-v1",
      version: pkg.version,
      checksums,
    },
    plugins: registry.getActivePlugins(options).map((plugin) => ({
      name: plugin.manifest.name,
      version: plugin.manifest.version,
    })),
    capabilities: {
      combinationStatus: registry.getPluginForFramework(options.framework) || registry.getAuthProvider(options.authTarget)
        ? "supported"
        : getProjectCapability(options),
    },
    ...(options.recordPrompts
      ? {
          promptAnswers: {
            ...(options.preset ? { preset: options.preset } : {}),
            framework: options.framework,
            dbTarget: options.dbTarget,
            authTarget: options.authTarget,
            cachingTarget: options.cachingTarget,
            extraPackages: [...options.extraPackages],
            frontendFramework: options.frontendFramework,
            backendFramework: options.backendFramework,
            deploymentTarget: options.deploymentTarget,
            ...(options.learn ? { learn: true } : {}),
          },
        }
      : {}),
    createdAt: generatedAt,
  };
}

/**
 * Serialise the manifest to a pretty-printed JSON string.
 */
export function serializeManifest(manifest: ScaffoldManifest): string {
  return JSON.stringify(manifest, null, 2) + "\n";
}
