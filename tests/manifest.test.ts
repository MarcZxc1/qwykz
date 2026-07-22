import { describe, it, expect } from "bun:test";
import { buildManifest, serializeManifest } from "../src/manifest";
import type { ScaffoldPlan, ProjectOptions } from "../src/types";

function makePlan(overrides: Partial<ProjectOptions> = {}): ScaffoldPlan {
  const options: ProjectOptions = {
    framework: "express",
    projectName: "test-project",
    dbTarget: "docker",
    authTarget: "local",
    cachingTarget: "none",
    extraPackages: [],
    dbPort: 54320,
    redisPort: 63790,
    ...overrides,
  };
  return {
    projectName: options.projectName,
    options,
    files: [],
    packageAudit: [
      { name: "express", version: "^5.0.0", category: "framework", reason: "HTTP framework", isDev: false },
      { name: "typescript", version: "^5.0.0", category: "dev", reason: "TypeScript compiler", isDev: true },
    ],
    generatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("buildManifest", () => {
  it("sets generator name to qwykz", () => {
    const plan = makePlan();
    const manifest = buildManifest(plan);
    expect(manifest.generator.name).toBe("qwykz");
  });

  it("records the correct framework in scaffold section", () => {
    const plan = makePlan({ framework: "hono" });
    const manifest = buildManifest(plan);
    expect(manifest.scaffold.framework).toBe("hono");
  });

  it("separates deps from devDeps in packages", () => {
    const plan = makePlan();
    const manifest = buildManifest(plan);
    expect(manifest.packages.dependencies["express"]).toBe("^5.0.0");
    expect(manifest.packages.devDependencies["typescript"]).toBe("^5.0.0");
    expect(manifest.packages.dependencies["typescript"]).toBeUndefined();
  });

  it("includes $schema field", () => {
    const manifest = buildManifest(makePlan());
    expect(manifest.$schema).toContain("qwykz");
  });

  it("preserves createdAt from plan.generatedAt", () => {
    const manifest = buildManifest(makePlan());
    expect(manifest.createdAt).toBe("2026-01-01T00:00:00.000Z");
  });

  it("sets frontendFramework to null when not in options", () => {
    const manifest = buildManifest(makePlan());
    expect(manifest.scaffold.frontendFramework).toBeNull();
  });

  it("records frontendFramework when set", () => {
    const plan = makePlan({ frontendFramework: "react", framework: "monorepo", backendFramework: "express" });
    const manifest = buildManifest(plan);
    expect(manifest.scaffold.frontendFramework).toBe("react");
  });
});

describe("serializeManifest", () => {
  it("produces valid JSON", () => {
    const manifest = buildManifest(makePlan());
    const json = serializeManifest(manifest);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it("ends with a newline", () => {
    const manifest = buildManifest(makePlan());
    const json = serializeManifest(manifest);
    expect(json.endsWith("\n")).toBe(true);
  });
});
