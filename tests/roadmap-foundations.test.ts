import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { buildScaffoldPlan } from "../src/generator";
import type { ProjectOptions } from "../src/types";

const CLI_PATH = join(import.meta.dir, "..", "src", "index.ts");
const TMP_ROOT = join(import.meta.dir, "..", ".test-tmp", "roadmap-foundations");
let runDir = "";

beforeEach(() => {
  runDir = join(TMP_ROOT, `${Date.now()}-${Math.random().toString(16).slice(2)}`);
  mkdirSync(runDir, { recursive: true });
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
