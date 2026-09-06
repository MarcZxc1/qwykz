import { describe, expect, it } from "bun:test";
import {
  PRESETS,
  findPreset,
  formatPresetsTable,
  listPresets,
  resolvePresetOptions,
} from "../src/presets";
import { getProjectCapability } from "../src/capability/matrix";
import { buildScaffoldPlan } from "../src/generator";
import { buildManifest } from "../src/manifest";

describe("Presets System", () => {
  it("defines a comprehensive catalog of presets", () => {
    const presets = listPresets();
    expect(presets.length).toBeGreaterThanOrEqual(15);

    // Verify key categories exist
    const categories = new Set(presets.map((p) => p.category));
    expect(categories.has("api")).toBe(true);
    expect(categories.has("fullstack")).toBe(true);
    expect(categories.has("web")).toBe(true);
  });

  it("resolves presets by primary name", () => {
    const rust = findPreset("api-rust");
    expect(rust).toBeDefined();
    expect(rust?.options.framework).toBe("rust");
    expect(rust?.options.dbTarget).toBe("docker");

    const go = findPreset("api-go");
    expect(go).toBeDefined();
    expect(go?.options.framework).toBe("go");

    const python = findPreset("api-python");
    expect(python).toBeDefined();
    expect(python?.options.framework).toBe("python");

    const elysia = findPreset("api-elysia");
    expect(elysia).toBeDefined();
    expect(elysia?.options.framework).toBe("elysia");

    const nextjs = findPreset("web-nextjs");
    expect(nextjs).toBeDefined();
    expect(nextjs?.options.framework).toBe("nextjs");
  });

  it("resolves presets by ergonomic aliases", () => {
    expect(findPreset("rust")?.name).toBe("api-rust");
    expect(findPreset("go")?.name).toBe("api-go");
    expect(findPreset("python")?.name).toBe("api-python");
    expect(findPreset("fastapi")?.name).toBe("api-python");
    expect(findPreset("elysia")?.name).toBe("api-elysia");
    expect(findPreset("bun")?.name).toBe("api-elysia");
    expect(findPreset("hono")?.name).toBe("api-hono");
    expect(findPreset("express")?.name).toBe("api-express");
    expect(findPreset("node")?.name).toBe("api-express");
    expect(findPreset("laravel")?.name).toBe("api-laravel");
    expect(findPreset("nextjs")?.name).toBe("web-nextjs");
    expect(findPreset("saas")?.name).toBe("web-nextjs");
    expect(findPreset("react")?.name).toBe("web-react");
    expect(findPreset("vue")?.name).toBe("web-vue");
    expect(findPreset("react-rust")?.name).toBe("fullstack-react-rust");
    expect(findPreset("react-go")?.name).toBe("fullstack-react-go");
    expect(findPreset("react-elysia")?.name).toBe("fullstack-react-elysia");
    expect(findPreset("react-express")?.name).toBe("fullstack-react-express");
    expect(findPreset("react-python")?.name).toBe("fullstack-react-fastapi");
    expect(findPreset("react-fastapi")?.name).toBe("fullstack-react-fastapi");
    expect(findPreset("vue-hono")?.name).toBe("fullstack-vue-hono");
  });

  it("returns undefined for unknown preset names", () => {
    expect(findPreset("unknown-stack")).toBeUndefined();
    expect(findPreset("")).toBeUndefined();
  });

  it("every preset has a valid capability status in capability matrix", () => {
    for (const preset of PRESETS) {
      const opts = resolvePresetOptions(preset.name, { projectName: "test-app" });
      expect(opts).toBeDefined();
      if (!opts) continue;

      const status = getProjectCapability(opts);
      expect(["supported", "experimental"]).toContain(status);
      expect(status).not.toBe("unsupported");

      if (status === "experimental") {
        expect(preset.options.experimental).toBe(true);
      }
    }
  });

  it("allows overriding specific options when resolving preset", () => {
    const opts = resolvePresetOptions("rust", {
      projectName: "my-custom-rust-service",
      dryRun: true,
      strict: true,
    });

    expect(opts).toBeDefined();
    expect(opts?.projectName).toBe("my-custom-rust-service");
    expect(opts?.preset).toBe("api-rust");
    expect(opts?.framework).toBe("rust");
    expect(opts?.dryRun).toBe(true);
    expect(opts?.strict).toBe(true);
  });

  it("records preset name in scaffold manifest", async () => {
    const opts = resolvePresetOptions("rust", {
      projectName: "test-rust-manifest",
      recordPrompts: true,
    });
    expect(opts).toBeDefined();
    if (!opts) return;

    const plan = await buildScaffoldPlan(opts);
    const manifest = buildManifest(plan);

    expect(manifest.scaffold.preset).toBe("api-rust");
    expect(manifest.promptAnswers?.preset).toBe("api-rust");
  });

  it("generates a formatted table for --list-presets", () => {
    const table = formatPresetsTable();
    expect(table).toContain("api-rust");
    expect(table).toContain("api-go");
    expect(table).toContain("fullstack-react-rust");
    expect(table).toContain("web-nextjs");
  });

  it("CLI prints preset catalog with --list-presets", async () => {
    const proc = Bun.spawn(["bun", "src/index.ts", "--list-presets"], {
      stdout: "pipe",
      stderr: "pipe",
    });
    const stdout = await new Response(proc.stdout).text();
    const exitCode = await proc.exited;

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Available Curated Presets");
    expect(stdout).toContain("api-rust");
    expect(stdout).toContain("fullstack-react-go");
  });

  it("CLI previews scaffold when run with --preset and --dry-run", async () => {
    const proc = Bun.spawn(
      ["bun", "src/index.ts", "--preset", "rust", "--name", "my-test-rust", "--dry-run"],
      {
        stdout: "pipe",
        stderr: "pipe",
      },
    );
    const stdout = await new Response(proc.stdout).text();
    const exitCode = await proc.exited;

    expect(exitCode).toBe(0);
    expect(stdout).toContain("DRY RUN PREVIEW");
    expect(stdout).toContain("my-test-rust");
    expect(stdout).toContain("Cargo.toml");
  });

  it("CLI fails with clear error on unknown preset", async () => {
    const proc = Bun.spawn(
      ["bun", "src/index.ts", "--preset", "nonexistent-preset", "--dry-run"],
      {
        stdout: "pipe",
        stderr: "pipe",
      },
    );
    const stderr = await new Response(proc.stderr).text();
    const exitCode = await proc.exited;

    expect(exitCode).toBe(1);
    expect(stderr).toContain('Unknown preset "nonexistent-preset"');
  });
});

