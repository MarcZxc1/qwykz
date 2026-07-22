import { afterAll, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");
const CLI_PATH = join(ROOT, "src", "index.ts");
const TMP_ROOT = join(ROOT, ".test-tmp", "plugin-e2e");

afterAll(() => rmSync(TMP_ROOT, { recursive: true, force: true }));

describe("plugin generation", () => {
  test("discovers and generates a plugin framework non-interactively", async () => {
    const pluginsDir = join(TMP_ROOT, "plugins");
    const pluginDir = join(pluginsDir, "qwykz-plugin-fastify");
    const templateDir = join(pluginDir, "templates", "fastify");
    mkdirSync(templateDir, { recursive: true });
    writeFileSync(join(templateDir, "index.ts.stub"), "console.log('{{PROJECT_NAME}}')\n");
    writeFileSync(join(pluginDir, "plugin.json"), JSON.stringify({
      name: "qwykz-plugin-fastify",
      version: "1.0.0",
      description: "Fastify test plugin",
      author: "qwykz tests",
      qwykzVersion: ">=1.0.0",
      capabilities: {
        frameworks: [{
          name: "fastify",
          label: "Fastify",
          type: "backend",
          language: "typescript",
          runtime: "bun",
          templateDir: "templates/fastify",
        }],
        authProviders: [],
        deploymentTargets: [],
      },
      packages: { dependencies: { fastify: "^5.0.0" }, devDependencies: {} },
      scripts: { dev: "bun --watch index.ts" },
    }));
    const outputDir = join(TMP_ROOT, "output");
    mkdirSync(outputDir, { recursive: true });

    const child = Bun.spawn({
      cmd: [
        "bun", "run", CLI_PATH, "--yes", "--name", "plugin-app",
        "--framework", "fastify", "--plugins-dir", pluginsDir,
      ],
      cwd: outputDir,
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, NO_COLOR: "1" },
    });
    const exitCode = await child.exited;
    const stderr = await new Response(child.stderr).text();
    expect(exitCode, stderr).toBe(0);
    const projectDir = join(outputDir, "plugin-app");
    expect(existsSync(join(projectDir, "index.ts"))).toBe(true);
    expect(await Bun.file(join(projectDir, "index.ts")).text()).toContain("plugin-app");
    const packageJson = JSON.parse(await Bun.file(join(projectDir, "package.json")).text());
    expect(packageJson.dependencies.fastify).toBe("^5.0.0");
    const manifest = JSON.parse(await Bun.file(join(projectDir, ".qwykz-manifest.json")).text());
    expect(manifest.plugins[0].name).toBe("qwykz-plugin-fastify");
  });

  test("applies plugin auth and deployment overlays", async () => {
    const pluginsDir = join(TMP_ROOT, "overlay-plugins");
    const pluginDir = join(pluginsDir, "qwykz-plugin-platform");
    const authTemplateDir = join(pluginDir, "templates", "auth0");
    const deployTemplateDir = join(pluginDir, "templates", "fly");
    mkdirSync(join(authTemplateDir, "src"), { recursive: true });
    mkdirSync(deployTemplateDir, { recursive: true });
    writeFileSync(
      join(authTemplateDir, "src", "auth0-provider.ts.stub"),
      "export const provider = '{{AUTH_TARGET}}';\n",
    );
    writeFileSync(
      join(deployTemplateDir, "fly.toml.stub"),
      'app = "{{PROJECT_NAME}}"\n',
    );
    writeFileSync(join(pluginDir, "plugin.json"), JSON.stringify({
      name: "qwykz-plugin-platform",
      version: "1.0.0",
      description: "Auth and deployment test plugin",
      author: "qwykz tests",
      qwykzVersion: ">=1.0.0",
      capabilities: {
        frameworks: [],
        authProviders: [{
          name: "auth0",
          label: "Auth0",
          side: "fullstack",
          templateDir: "templates/auth0",
        }],
        deploymentTargets: [{
          name: "fly",
          label: "Fly.io",
          templateDir: "templates/fly",
          supportedFrameworks: ["express"],
        }],
      },
      packages: { dependencies: { jose: "^6.0.0" }, devDependencies: {} },
      scripts: {},
    }));
    const outputDir = join(TMP_ROOT, "overlay-output");
    mkdirSync(outputDir, { recursive: true });

    const child = Bun.spawn({
      cmd: [
        "bun", "run", CLI_PATH, "--yes", "--name", "platform-app",
        "--framework", "express", "--auth", "auth0", "--deploy", "fly",
        "--plugins-dir", pluginsDir,
      ],
      cwd: outputDir,
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, NO_COLOR: "1" },
    });
    const exitCode = await child.exited;
    const stderr = await new Response(child.stderr).text();
    expect(exitCode, stderr).toBe(0);
    const projectDir = join(outputDir, "platform-app");
    expect(await Bun.file(join(projectDir, "src", "auth0-provider.ts")).text()).toContain("auth0");
    expect(await Bun.file(join(projectDir, "fly.toml")).text()).toContain("platform-app");
    const packageJson = JSON.parse(await Bun.file(join(projectDir, "package.json")).text());
    expect(packageJson.dependencies.jose).toBe("^6.0.0");
    expect(packageJson.dependencies.jsonwebtoken).toBeUndefined();
    const manifest = JSON.parse(await Bun.file(join(projectDir, ".qwykz-manifest.json")).text());
    expect(manifest.plugins).toHaveLength(1);
    expect(manifest.promptAnswers).toBeUndefined();
  });
});
