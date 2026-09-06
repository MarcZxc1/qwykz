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

    if (options.learn) {
      applyLearnModeFilter(plan);
      const { generateHandsOnGuide } = await import("../learn");
      const guideContent = generateHandsOnGuide(plan);
      const guideIdx = plan.files.findIndex((f) => f.path === "GUIDE.md");
      if (guideIdx >= 0 && plan.files[guideIdx]) {
        plan.files[guideIdx].content = guideContent;
      } else {
        plan.files.push({ path: "GUIDE.md", content: guideContent });
      }
    }

    const { generateLearnGuide } = await import("../learn");
    const learnContent = generateLearnGuide(plan);
    const learnIdx = plan.files.findIndex((f) => f.path === "LEARN.md");
    if (learnIdx >= 0 && plan.files[learnIdx]) {
      plan.files[learnIdx].content = learnContent;
    } else {
      plan.files.push({ path: "LEARN.md", content: learnContent });
    }

    if (!options.noAiContext) {
      const { generateContextPack } = await import("../context-pack");
      const agentsContent = generateContextPack(plan);
      const existingIdx = plan.files.findIndex((f) => f.path === "AGENTS.md");
      if (existingIdx >= 0 && plan.files[existingIdx]) {
        plan.files[existingIdx].content = agentsContent;
      } else {
        plan.files.push({ path: "AGENTS.md", content: agentsContent });
      }
    } else {
      plan.files = plan.files.filter((f) => f.path !== "AGENTS.md");
    }

    const { buildManifest, serializeManifest } = await import("../manifest");
    const manifestContent = serializeManifest(buildManifest(plan));
    const manifestIdx = plan.files.findIndex((f) => f.path === ".qwykz-manifest.json");
    if (manifestIdx >= 0 && plan.files[manifestIdx]) {
      plan.files[manifestIdx].content = manifestContent;
    } else {
      plan.files.push({
        path: ".qwykz-manifest.json",
        content: manifestContent,
      });
    }
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

function getStarterEntryPoint(framework: string): string {
  switch (framework) {
    case "hono":
      return `// Welcome to your qwykz learning project!
// Open GUIDE.md in your editor to begin Milestone 1 & Milestone 2.

import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Open GUIDE.md to begin building your application!\\n");
});

export default {
  port: Number(process.env.PORT) || 3000,
  fetch: app.fetch,
};
`;
    case "elysia":
      return `// Welcome to your qwykz learning project!
// Open GUIDE.md in your editor to begin Milestone 1 & Milestone 2.

import { Elysia } from "elysia";

const app = new Elysia()
  .get("/", () => "Open GUIDE.md to begin building your application!\\n")
  .listen(Number(process.env.PORT) || 3000);

export default app;
`;
    case "express":
      return `// Welcome to your qwykz learning project!
// Open GUIDE.md in your editor to begin Milestone 1 & Milestone 2.

import express from "express";

const app = express();
const port = Number(process.env.PORT) || 3000;

app.get("/", (_req, res) => {
  res.send("Open GUIDE.md to begin building your application!\\n");
});

if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => {
    console.log(\`Server listening on http://localhost:\${port}\`);
  });
}

export default app;
`;
    case "rust":
      return `// Welcome to your qwykz learning project!
// Open GUIDE.md in your editor to begin Milestone 1 & Milestone 2.

fn main() {
    println!("Open GUIDE.md to begin building your application!");
}
`;
    case "go":
      return `// Welcome to your qwykz learning project!
// Open GUIDE.md in your editor to begin Milestone 1 & Milestone 2.

package main

import "fmt"

func main() {
\tfmt.Println("Open GUIDE.md to begin building your application!")
}
`;
    case "python":
      return `# Welcome to your qwykz learning project!
# Open GUIDE.md in your editor to begin Milestone 1 & Milestone 2.

print("Open GUIDE.md to begin building your application!")
`;
    case "laravel":
      return `<?php

use Illuminate\\Support\\Facades\\Route;

// Welcome to your qwykz learning project!
// Open GUIDE.md in your editor to begin Milestone 1 & Milestone 2.

Route::get('/', function () {
    return response()->json(['message' => 'Open GUIDE.md to begin building your application!']);
});
`;
    case "nextjs":
      return `// Welcome to your qwykz learning project!
// Open GUIDE.md in your editor to begin building.

export default function Home() {
  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Welcome to your qwykz learning project!</h1>
      <p>Open <code>GUIDE.md</code> to begin building your application.</p>
    </main>
  );
}
`;
    default:
      return `// Welcome to your qwykz learning project!
// Open GUIDE.md in your editor to begin building your application.
`;
  }
}

function applyLearnModeFilter(plan: ScaffoldPlan): void {
  const fw = plan.options.framework;
  const strippedDirs = new Set<string>();

  plan.files = plan.files.filter((f) => {
    const p = f.path;

    // Never strip configuration, environment files, schemas, manifests, or docs
    if (
      p === "package.json" ||
      p === "tsconfig.json" ||
      p === ".env" ||
      p === ".env.example" ||
      p === "README.md" ||
      p === "AGENTS.md" ||
      p === "GUIDE.md" ||
      p === "LEARN.md" ||
      p === ".qwykz-manifest.json" ||
      p === "docker-compose.yml" ||
      p.startsWith("prisma/") ||
      p === "prisma.config.ts" ||
      p === "Cargo.toml" ||
      p === "go.mod" ||
      p === "requirements.txt" ||
      p === "composer.json" ||
      p === "vite.config.ts" ||
      p === "index.html" ||
      p.endsWith(".gitkeep")
    ) {
      return true;
    }

    // Node API boilerplate
    if (
      p.startsWith("src/controllers/") ||
      p.startsWith("src/routes/") ||
      p.startsWith("src/services/") ||
      p.startsWith("src/middlewares/") ||
      p === "src/index.test.ts"
    ) {
      const dir = p.substring(0, p.lastIndexOf("/"));
      if (dir) strippedDirs.add(dir);
      return false;
    }

    // Go boilerplate
    if (p.startsWith("internal/handlers/") || p.startsWith("internal/middleware/")) {
      const dir = p.substring(0, p.lastIndexOf("/"));
      if (dir) strippedDirs.add(dir);
      return false;
    }

    // Rust boilerplate
    if (p.startsWith("src/api/")) {
      const dir = p.substring(0, p.lastIndexOf("/"));
      if (dir) strippedDirs.add(dir);
      return false;
    }

    // Python boilerplate
    if (p.startsWith("app/api/")) {
      const dir = p.substring(0, p.lastIndexOf("/"));
      if (dir) strippedDirs.add(dir);
      return false;
    }

    // Next.js API boilerplate
    if (p.startsWith("app/api/")) {
      const dir = p.substring(0, p.lastIndexOf("/"));
      if (dir) strippedDirs.add(dir);
      return false;
    }

    return true;
  });

  // Preserve stripped directory structures with .gitkeep
  for (const dir of strippedDirs) {
    const keepPath = `${dir}/.gitkeep`;
    if (!plan.files.some((f) => f.path === keepPath)) {
      plan.files.push({ path: keepPath, content: "" });
    }
  }

  // Replace entry points with clean starter stubs
  const starterContent = getStarterEntryPoint(fw);
  const entryIdx = plan.files.findIndex((f) =>
    f.path === "src/index.ts" ||
    f.path === "src/main.rs" ||
    f.path === "cmd/api/main.go" ||
    f.path === "app/main.py" ||
    f.path === "routes/api.php" ||
    f.path === "app/page.tsx"
  );
  if (entryIdx >= 0 && plan.files[entryIdx]) {
    plan.files[entryIdx].content = starterContent;
  }
}

