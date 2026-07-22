import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import type { ProjectOptions, ScaffoldPlan } from "../types";
import { generateProjectFiles } from "./dispatcher";
import { buildPackageAudit, collectScaffoldFiles } from "./package-policy";
import { applyPluginOverlay } from "./plugin-generation";

export async function buildScaffoldPlan(options: ProjectOptions): Promise<ScaffoldPlan> {
  const { registry } = await import("../plugins/registry");
  const frameworkPlugin = registry.getPluginForFramework(options.framework);
  const authPlugin = registry.getAuthProvider(options.authTarget);
  const deploymentPlugin = registry.getDeploymentTarget(options.deploymentTarget);
  if (frameworkPlugin) {
    const frameworkCapability = frameworkPlugin.manifest.capabilities.frameworks.find(
      (capability) => capability.name === options.framework,
    );
    if (!frameworkCapability) {
      throw new Error(`Plugin framework ${options.framework} has no registered capability`);
    }
    const declaredTargets = [
      ["database", frameworkCapability.dbTargets, options.dbTarget],
      ["auth", frameworkCapability.authTargets, options.authTarget],
      ["cache", frameworkCapability.cachingTargets, options.cachingTarget],
    ] as const;
    for (const [dimension, supportedTargets, selectedTarget] of declaredTargets) {
      if (supportedTargets?.length && !supportedTargets.includes(selectedTarget)) {
        throw new Error(
          `Plugin framework ${options.framework} does not support ${dimension} target ${selectedTarget}`,
        );
      }
    }
  }
  if (options.deploymentTarget && !deploymentPlugin) {
    throw new Error(`Unknown deployment target: ${options.deploymentTarget}`);
  }
  if (deploymentPlugin?.capability.supportedFrameworks?.length &&
      !deploymentPlugin.capability.supportedFrameworks.includes(options.framework)) {
    throw new Error(
      `Deployment target ${options.deploymentTarget} does not support ${options.framework}`,
    );
  }
  if (!frameworkPlugin && !authPlugin) {
    const { getProjectCapability } = await import("../capability/matrix");
    const capability = getProjectCapability(options);
    if (capability === "unsupported" || capability === "planned") {
      throw new Error(
        `Unsupported scaffold combination: ${options.framework} + ${options.dbTarget} DB + ${options.authTarget} auth + ${options.cachingTarget} cache`,
      );
    }
    if (capability === "experimental" && !options.experimental) {
      throw new Error(
        "This scaffold combination is experimental. Re-run with --experimental to acknowledge the risk.",
      );
    }
  }

  const originalCwd = process.cwd();
  const stagingRoot = await mkdtemp(join(tmpdir(), "qwykz-plan-"));
  const stagedOptions: ProjectOptions = {
    ...options,
    extraPackages: [...options.extraPackages],
    // A plugin auth provider overlays the core scaffold after generation. Use
    // the local variant only as the structural baseline.
    authTarget: authPlugin ? "local" : options.authTarget,
  };

  try {
    process.chdir(stagingRoot);
    await generateProjectFiles(stagedOptions);
    const projectRoot = join(stagingRoot, options.projectName);
    if (authPlugin) {
      await applyPluginOverlay(
        projectRoot,
        authPlugin.plugin,
        authPlugin.capability.templateDir,
        options,
        true,
      );
    }
    if (deploymentPlugin) {
      await applyPluginOverlay(
        projectRoot,
        deploymentPlugin.plugin,
        deploymentPlugin.capability.templateDir,
        options,
        false,
      );
    }
    const files = await collectScaffoldFiles(projectRoot);
    const plan: ScaffoldPlan = {
      projectName: options.projectName,
      options: { ...options, extraPackages: [...options.extraPackages] },
      files,
      packageAudit: buildPackageAudit(files, options),
      generatedAt: new Date().toISOString(),
    };

    if (!options.noAiContext) {
      const { generateContextPack } = await import("../context-pack");
      plan.files.push({ path: "AGENTS.md", content: generateContextPack(plan) });
    }

    const { buildManifest, serializeManifest } = await import("../manifest");
    plan.files.push({
      path: ".qwykz-manifest.json",
      content: serializeManifest(buildManifest(plan)),
    });
    plan.files.sort((a, b) => a.path.localeCompare(b.path));
    return plan;
  } finally {
    process.chdir(originalCwd);
    await rm(stagingRoot, { recursive: true, force: true }).catch(() => {});
  }
}

/** Write a completed scaffold plan to disk. */
export async function writePlan(plan: ScaffoldPlan, rootDir = process.cwd()): Promise<void> {
  const targetDir = join(rootDir, plan.projectName);
  await Promise.all(
    plan.files.map(async (file) => {
      const destination = join(targetDir, file.path);
      await mkdir(dirname(destination), { recursive: true });
      await Bun.write(destination, file.content);
    }),
  );
}

/** Build and write a project using the same plan consumed by dry-run. */
export async function generateProject(options: ProjectOptions): Promise<ScaffoldPlan> {
  const plan = await buildScaffoldPlan(options);
  await writePlan(plan);
  return plan;
}
