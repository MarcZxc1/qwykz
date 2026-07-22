import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { resolve, join } from "node:path";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { validateManifest } from "../src/plugins/validate-manifest";
import { discoverPluginDirectories, getPluginSearchPaths } from "../src/plugins/discovery";
import { registry } from "../src/plugins/registry";
import { PluginManifestError } from "../src/plugins/types";

const TEST_DIR = resolve(process.cwd(), ".test-plugins");

describe("Plugin System", () => {
  beforeEach(() => {
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it("validates a correct manifest", () => {
    const pluginDir = join(TEST_DIR, "valid-plugin");
    mkdirSync(pluginDir);
    mkdirSync(join(pluginDir, "templates", "fastify"), { recursive: true });
    writeFileSync(join(pluginDir, "templates", "fastify", "dummy.txt"), "hello");

    const manifest = {
      name: "qwykz-plugin-fastify",
      version: "1.0.0",
      description: "Fastify plugin",
      author: "test",
      qwykzVersion: ">=1.0.0",
      capabilities: {
        frameworks: [
          {
            name: "fastify",
            label: "Fastify",
            type: "backend" as const,
            language: "typescript" as const,
            runtime: "bun" as const,
            templateDir: "templates/fastify"
          }
        ],
        authProviders: [],
        deploymentTargets: []
      }
    };

    expect(() => validateManifest(pluginDir, manifest)).not.toThrow();
  });

  it("rejects built-in framework conflicts", () => {
    const pluginDir = join(TEST_DIR, "conflict-plugin");
    mkdirSync(pluginDir);
    mkdirSync(join(pluginDir, "templates", "nextjs"), { recursive: true });
    writeFileSync(join(pluginDir, "templates", "nextjs", "dummy.txt"), "hello");

    const manifest = {
      name: "qwykz-plugin-nextjs-fake",
      version: "1.0.0",
      description: "Fake",
      author: "test",
      qwykzVersion: ">=1.0.0",
      capabilities: {
        frameworks: [
          {
            name: "nextjs",
            label: "Next",
            type: "fullstack" as const,
            language: "typescript" as const,
            runtime: "bun" as const,
            templateDir: "templates/nextjs"
          }
        ],
        authProviders: [],
        deploymentTargets: []
      }
    };

    expect(() => validateManifest(pluginDir, manifest)).toThrow(PluginManifestError);
  });

  it("rejects path traversal in templates", () => {
    const pluginDir = join(TEST_DIR, "traversal-plugin");
    mkdirSync(pluginDir);

    const manifest = {
      name: "qwykz-plugin-traversal",
      version: "1.0.0",
      description: "Bad",
      author: "test",
      qwykzVersion: ">=1.0.0",
      capabilities: {
        frameworks: [
          {
            name: "traversal",
            label: "Traversal",
            type: "backend" as const,
            language: "typescript" as const,
            runtime: "bun" as const,
            templateDir: "../../../etc"
          }
        ],
        authProviders: [],
        deploymentTargets: []
      }
    };

    expect(() => validateManifest(pluginDir, manifest)).toThrow(/resolves outside the plugin directory/);
  });
});
