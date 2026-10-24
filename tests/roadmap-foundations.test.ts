import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { existsSync, mkdirSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildScaffoldPlan, writePlan } from "../src/generator";
import type { ProjectOptions, ScaffoldPlan } from "../src/types";

const CLI_PATH = join(import.meta.dir, "..", "src", "index.ts");
const TMP_ROOT = join(import.meta.dir, "..", ".test-tmp", "roadmap-foundations");
let runDir = "";

beforeEach(() => {
  runDir = join(TMP_ROOT, `${Date.now()}-${Math.random().toString(16).slice(2)}`);
  mkdirSync(runDir, { recursive: true });
});

function projectOptions(overrides: Partial<ProjectOptions> = {}): ProjectOptions {
  return {
    projectName: "reliable-app", framework: "express", dbTarget: "local",
    authTarget: "local", cachingTarget: "none", extraPackages: [], ...overrides,
  };
}

function filePlan(files: ScaffoldPlan["files"]): ScaffoldPlan {
  const options = projectOptions();
  return { projectName: options.projectName, options, files, packageAudit: [], generatedAt: "2026-01-01T00:00:00.000Z" };
}

describe("scaffold reliability", () => {
  test("monorepo package names are valid and unique across workspaces", async () => {
    for (const backendFramework of ["express", "hono", "elysia"]) {
      for (const frontendFramework of ["react", "vue"]) {
        const plan = await buildScaffoldPlan(projectOptions({
          framework: "monorepo", backendFramework, frontendFramework,
        }));
        const names = plan.files.filter((file) => file.path.endsWith("package.json"))
          .map((file) => JSON.parse(file.content).name as string);
        expect(names).toHaveLength(3);
        expect(new Set(names).size).toBe(names.length);
        for (const name of names) expect(name).toMatch(/^[a-z][a-z0-9-]*$/);
      }
    }
  });

  test("planning concurrently keeps cwd stable and outputs isolated", async () => {
    const cwd = process.cwd();
    const cwdChanges = spyOn(process, "chdir");
    let results: ScaffoldPlan[];
    try {
      const pending = ["express", "react", "go"].map((framework) =>
        buildScaffoldPlan(projectOptions({ framework })),
      );
      await new Promise((resolve) => setTimeout(resolve, 0));
      const observedCwd = process.cwd();
      const settled = await Promise.allSettled(pending);
      expect(observedCwd).toBe(cwd);
      expect(process.cwd()).toBe(cwd);
      expect(cwdChanges).not.toHaveBeenCalled();
      expect(settled.every((result) => result.status === "fulfilled")).toBe(true);
      results = settled.map((result) => {
        if (result.status === "rejected") throw result.reason;
        return result.value;
      });
    } finally {
      cwdChanges.mockRestore();
      process.chdir(cwd);
    }
    expect(results[0]!.files.some((file) => file.path === "src/routes/auth.routes.ts")).toBe(true);
    expect(results[1]!.files.some((file) => file.path === "src/App.tsx")).toBe(true);
    expect(results[2]!.files.some((file) => file.path === "cmd/api/main.go")).toBe(true);
    expect(results[0]!.files.some((file) => file.path === "src/App.tsx")).toBe(false);
  });

  test("built-in npm dependencies are exact, repeatable, and resolved offline", async () => {
    const network = spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
    try {
      for (const framework of ["express", "hono", "elysia", "react", "vue", "nextjs", "monorepo"]) {
        const options = projectOptions({ framework, frontendFramework: "react", backendFramework: "hono" });
        const first = await buildScaffoldPlan(options);
        const second = await buildScaffoldPlan(options);
        const packages = first.files.filter((file) => file.path.endsWith("package.json"));
        expect(packages.length).toBeGreaterThan(0);
        for (const file of packages) {
          expect(second.files.find((candidate) => candidate.path === file.path)?.content).toBe(file.content);
          const pkg = JSON.parse(file.content);
          for (const version of Object.values({ ...pkg.dependencies, ...pkg.devDependencies })) {
            expect(version).toMatch(/^\d+\.\d+\.\d+$/);
          }
        }
        const manifest = JSON.parse(first.files.find((file) => file.path === ".qwykz-manifest.json")!.content);
        expect(manifest.packages.dependencies).toEqual(Object.fromEntries(
          first.packageAudit.filter((entry) => !entry.isDev).map((entry) => [entry.name, entry.version]),
        ));
      }
      expect(network).not.toHaveBeenCalled();
    } finally {
      network.mockRestore();
    }
  });

  test("write failure leaves no target or staging artifacts", async () => {
    const plan = filePlan([
      { path: "first.txt", content: "ready" },
      { path: "conflict", content: "file" },
      { path: "conflict/child.txt", content: "cannot write beneath a file" },
    ]);
    await expect(writePlan(plan, runDir)).rejects.toThrow();
    expect(readdirSync(runDir)).toEqual([]);
  });

  test("existing targets are preserved, including empty directories", async () => {
    const plan = filePlan([{ path: "new.txt", content: "new" }]);
    const target = join(runDir, plan.projectName);
    mkdirSync(target);
    await expect(writePlan(plan, runDir)).rejects.toThrow();
    expect(readdirSync(target)).toEqual([]);
    writeFileSync(join(target, "keep.txt"), "original");
    await expect(writePlan(plan, runDir)).rejects.toThrow();
    expect(await Bun.file(join(target, "keep.txt")).text()).toBe("original");
    expect(readdirSync(target)).toEqual(["keep.txt"]);
    expect(readdirSync(runDir)).toEqual([plan.projectName]);
  });

  test("concurrent publishers cannot merge or overwrite each other's output", async () => {
    const plans = ["one", "two"].map((value) => filePlan([{ path: `${value}.txt`, content: value }]));
    const results = await Promise.allSettled(plans.map((plan) => writePlan(plan, runDir)));
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
    const winner = results.findIndex((result) => result.status === "fulfilled");
    expect(readdirSync(join(runDir, plans[winner]!.projectName))).toEqual([plans[winner]!.files[0]!.path]);
    expect(readdirSync(runDir)).toEqual([plans[winner]!.projectName]);
  });

  test("a dangling target symlink is preserved", async () => {
    const plan = filePlan([{ path: "new.txt", content: "new" }]);
    symlinkSync(join(runDir, "missing"), join(runDir, plan.projectName), "dir");
    await expect(writePlan(plan, runDir)).rejects.toThrow("Target already exists");
    expect(readdirSync(runDir)).toEqual([plan.projectName]);
  });

  test("rejects paths outside the project and duplicate file destinations", async () => {
    for (const path of ["../escape.txt", "/absolute.txt", "dir/../../escape.txt", "..\\escape.txt"]) {
      await expect(writePlan(filePlan([{ path, content: "invalid" }]), runDir)).rejects.toThrow();
    }
    await expect(writePlan(filePlan([
      { path: "same.txt", content: "one" }, { path: "same.txt", content: "two" },
    ]), runDir)).rejects.toThrow();
    expect(readdirSync(runDir)).toEqual([]);
    await expect(buildScaffoldPlan(projectOptions({ projectName: "../escape" }))).rejects.toThrow();
  });
});

afterEach(() => {
  rmSync(runDir, { recursive: true, force: true });
});

async function run(args: string[]) {
  const child = Bun.spawn({
    cmd: ["bun", "run", CLI_PATH, "--yes", ...args],
    cwd: runDir,
    stdout: "pipe",
    stderr: "pipe",
    env: { ...process.env, NO_COLOR: "1" },
  });
  const [exitCode, stdout, stderr] = await Promise.all([
    child.exited,
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
  ]);
  return { exitCode, stdout, stderr };
}

describe("roadmap foundations", () => {
  test("dry-run previews exact output without creating the target", async () => {
    const result = await run(["--name", "preview-app", "--dry-run", "--db", "docker"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Files That Would Be Created");
    expect(result.stdout).toContain("package.json");
    expect(result.stdout).toContain(".qwykz-manifest.json");
    expect(result.stdout).toContain("AGENTS.md");
    expect(result.stdout).toContain("Packages That Would Be Added");
    expect(result.stdout).toContain("File Diffs");
    expect(result.stdout).not.toContain("0 files, 0 deps");
    expect(existsSync(join(runDir, "preview-app"))).toBe(false);
  });

  test("normal generation writes a reproducible manifest and context pack", async () => {
    const result = await run(["--name", "manifest-app", "--strict", "--record-prompts"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Package policy audit");
    const projectDir = join(runDir, "manifest-app");
    expect(existsSync(join(projectDir, "AGENTS.md"))).toBe(true);
    const manifest = JSON.parse(await Bun.file(join(projectDir, ".qwykz-manifest.json")).text());
    expect(manifest.scaffold.framework).toBe("express");
    expect(manifest.packageAudit.length).toBeGreaterThan(0);
    expect(manifest.capabilities.combinationStatus).toBe("supported");
    expect(manifest.promptAnswers.framework).toBe("express");
    expect(manifest.templates.checksums["package.json"]).toStartWith("sha256:");
  });

  test("no-ai-context suppresses AGENTS.md", async () => {
    const result = await run(["--name", "no-context-app", "--no-ai-context"]);
    expect(result.exitCode).toBe(0);
    expect(existsSync(join(runDir, "no-context-app", "AGENTS.md"))).toBe(false);
  });

  test("experimental combinations require explicit acknowledgement", async () => {
    const { CAPABILITY_MATRIX } = await import("../src/capability/matrix");
    CAPABILITY_MATRIX.matrix["test-experimental"] = {
      dbTargets: { local: "experimental" },
      authTargets: { local: "supported" },
      cachingTargets: { none: "supported" },
      dockerfile: false,
    };
    try {
      expect(
        buildScaffoldPlan({
          projectName: "exp-test",
          framework: "test-experimental",
          dbTarget: "local",
          authTarget: "local",
          cachingTarget: "none",
          extraPackages: [],
        }),
      ).rejects.toThrow("This scaffold combination is experimental");
    } finally {
      delete CAPABILITY_MATRIX.matrix["test-experimental"];
    }
  });

  test("react local auth succeeds as standard without --experimental", async () => {
    const result = await run(["--name", "react-local-std", "--framework", "react", "--auth", "local", "--dry-run"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Dry run complete");
  });

  test("unsupported combinations are rejected before writing", async () => {
    const result = await run(["--name", "bad-combo", "--framework", "python", "--auth", "clerk"]);
    expect(result.exitCode).toBe(1);
    expect(existsSync(join(runDir, "bad-combo"))).toBe(false);
  });

  test("monorepo planning does not mutate caller options", async () => {
    const options: ProjectOptions = {
      projectName: "immutable-monorepo",
      framework: "monorepo",
      frontendFramework: "react",
      backendFramework: "express",
      dbTarget: "local",
      authTarget: "local",
      cachingTarget: "none",
      extraPackages: [],
      experimental: true,
    };
    const original = structuredClone(options);

    const plan = await buildScaffoldPlan(options);

    expect(options).toEqual(original);
    expect(plan.files.some((file) => file.path === "backend/package.json")).toBe(true);
    expect(plan.files.some((file) => file.path === "frontend/package.json")).toBe(true);
  });
});
