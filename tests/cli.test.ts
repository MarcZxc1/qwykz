import { test, expect, afterEach, beforeEach, describe } from "bun:test";
import { join } from "node:path";
import { mkdirSync, rmSync, existsSync } from "node:fs";

const CLI_PATH = join(import.meta.dirname!, "..", "src", "index.ts");
const TMP_BASE = join(import.meta.dirname!, "..", ".test-tmp");
const BUN_TMPDIR = join(TMP_BASE, "bun-tmp");

mkdirSync(BUN_TMPDIR, { recursive: true });
process.env.BUN_TMPDIR = BUN_TMPDIR;

let testDir: string;
let testCounter = 0;

beforeEach(() => {
  testCounter++;
  testDir = join(TMP_BASE, `run-${testCounter}-${Date.now()}`);
  mkdirSync(testDir, { recursive: true });
});

afterEach(() => {
  // Clean up temp directory even on failure
  try {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  } catch {
    // Best-effort cleanup
  }
});

describe("qwykz CLI integration", () => {
  test("generates project with default options via --yes", async () => {
    const projectName = "test-app";

    const proc = Bun.spawn({
      cmd: ["bun", "run", CLI_PATH, "--yes", "--name", projectName],
      cwd: testDir,
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, NO_COLOR: "1" },
    });

    const exitCode = await proc.exited;
    expect(exitCode).toBe(0);

    const projectDir = join(testDir, projectName);

    // Assert core files were created
    expect(existsSync(join(projectDir, "package.json"))).toBe(true);
    expect(existsSync(join(projectDir, "src/index.ts"))).toBe(true);
    expect(existsSync(join(projectDir, "tsconfig.json"))).toBe(true);
    expect(existsSync(join(projectDir, "prisma/schema.prisma"))).toBe(true);
    expect(existsSync(join(projectDir, ".env"))).toBe(true);
    expect(existsSync(join(projectDir, "src/lib/prisma.ts"))).toBe(true);
    expect(existsSync(join(projectDir, "src/middlewares/error.middleware.ts"))).toBe(true);
    expect(existsSync(join(projectDir, "src/routes/health.routes.ts"))).toBe(true);
    expect(existsSync(join(projectDir, "src/routes/user.routes.ts"))).toBe(true);
    expect(existsSync(join(projectDir, "src/controllers/user.controller.ts"))).toBe(true);
    expect(existsSync(join(projectDir, "src/services/user.service.ts"))).toBe(true);

    // Assert package.json contains the correct project name
    const pkgJson = JSON.parse(await Bun.file(join(projectDir, "package.json")).text());
    expect(pkgJson.name).toBe(projectName);
  });

  test("generates project with custom name", async () => {
    const projectName = "my-cool-api";

    const proc = Bun.spawn({
      cmd: ["bun", "run", CLI_PATH, "--yes", "--name", projectName],
      cwd: testDir,
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, NO_COLOR: "1" },
    });

    const exitCode = await proc.exited;
    expect(exitCode).toBe(0);

    const projectDir = join(testDir, projectName);
    const pkgJson = JSON.parse(await Bun.file(join(projectDir, "package.json")).text());
    expect(pkgJson.name).toBe(projectName);
  });

  test("generates docker-compose.yml when --db docker is specified", async () => {
    const projectName = "docker-app";

    const proc = Bun.spawn({
      cmd: ["bun", "run", CLI_PATH, "--yes", "--name", projectName, "--db", "docker"],
      cwd: testDir,
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, NO_COLOR: "1" },
    });

    const exitCode = await proc.exited;
    expect(exitCode).toBe(0);

    const projectDir = join(testDir, projectName);
    expect(existsSync(join(projectDir, "docker-compose.yml"))).toBe(true);
    expect(existsSync(join(projectDir, "src/lib/wait-for-postgres.ts"))).toBe(true);

    // Verify docker-compose content has the project name injected
    const dockerContent = await Bun.file(join(projectDir, "docker-compose.yml")).text();
    expect(dockerContent).toContain(projectName);
    expect(dockerContent).not.toContain("{{");
    expect(dockerContent).toContain("mem_limit: 512m");
    expect(dockerContent).toContain("max_connections=50");
    expect(dockerContent).toContain('max-size: "10m"');
    expect(dockerContent).toContain('io.qwykz.managed: "true"');
  });

  test("generates a bounded ephemeral Docker Redis cache", async () => {
    const projectName = "docker-cache-app";

    const proc = Bun.spawn({
      cmd: [
        "bun", "run", CLI_PATH,
        "--yes", "--name", projectName,
        "--db", "local", "--caching", "docker",
      ],
      cwd: testDir,
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, NO_COLOR: "1" },
    });

    const exitCode = await proc.exited;
    expect(exitCode).toBe(0);

    const dockerContent = await Bun.file(
      join(testDir, projectName, "docker-compose.yml"),
    ).text();
    expect(dockerContent).toContain("mem_limit: 128m");
    expect(dockerContent).toContain("- 96mb");
    expect(dockerContent).toContain("- allkeys-lru");
    expect(dockerContent).toContain('- "no"');
    expect(dockerContent).not.toContain("redis_data:/data");
    expect(dockerContent).not.toContain("volumes:\n");
  });

  test("includes zod in controller when --zod is specified", async () => {
    const projectName = "zod-app";

    const proc = Bun.spawn({
      cmd: ["bun", "run", CLI_PATH, "--yes", "--name", projectName, "--zod"],
      cwd: testDir,
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, NO_COLOR: "1" },
    });

    const exitCode = await proc.exited;
    expect(exitCode).toBe(0);

    const projectDir = join(testDir, projectName);
    const controller = await Bun.file(join(projectDir, "src/controllers/user.controller.ts")).text();
    expect(controller).toContain('from "zod"');

    const pkgJson = JSON.parse(await Bun.file(join(projectDir, "package.json")).text());
    expect(pkgJson.dependencies.zod).toBeDefined();
  });

  test("includes helmet and cors imports when flags are specified", async () => {
    const projectName = "full-app";

    const proc = Bun.spawn({
      cmd: [
        "bun", "run", CLI_PATH,
        "--yes", "--name", projectName,
        "--helmet", "--cors",
      ],
      cwd: testDir,
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, NO_COLOR: "1" },
    });

    const exitCode = await proc.exited;
    expect(exitCode).toBe(0);

    const projectDir = join(testDir, projectName);
    const serverSource = await Bun.file(join(projectDir, "src/index.ts")).text();
    expect(serverSource).toContain('import helmet from "helmet"');
    expect(serverSource).toContain('import cors from "cors"');
    expect(serverSource).toContain("app.use(helmet())");
    expect(serverSource).toContain("app.use(cors(");
    expect(serverSource).not.toContain("{{");
  });

  test("supabase variant uses correct prisma client", async () => {
    const projectName = "supa-app";

    const proc = Bun.spawn({
      cmd: ["bun", "run", CLI_PATH, "--yes", "--name", projectName, "--db", "supabase"],
      cwd: testDir,
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, NO_COLOR: "1" },
    });

    const exitCode = await proc.exited;
    expect(exitCode).toBe(0);

    const projectDir = join(testDir, projectName);
    const prismaClient = await Bun.file(join(projectDir, "src/lib/prisma.ts")).text();
    expect(prismaClient).toContain('throw new Error("DATABASE_URL is not defined');
    expect(prismaClient).not.toContain("DB URL DETECTED");
    expect(prismaClient).not.toContain("console.log");

    // Supabase should NOT have docker-compose
    expect(existsSync(join(projectDir, "docker-compose.yml"))).toBe(false);
  });

  test("generates Next.js app without external create-next-app bootstrap", async () => {
    const projectName = "next-local";

    const proc = Bun.spawn({
      cmd: ["bun", "run", CLI_PATH, "--yes", "--name", projectName, "--framework", "nextjs", "--db", "local", "--auth", "local", "--experimental"],
      cwd: testDir,
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, NO_COLOR: "1" },
    });

    const exitCode = await proc.exited;
    expect(exitCode).toBe(0);

    const projectDir = join(testDir, projectName);
    expect(existsSync(join(projectDir, "package.json"))).toBe(true);
    expect(existsSync(join(projectDir, "app", "layout.tsx"))).toBe(true);
    expect(existsSync(join(projectDir, "app", "api", "auth", "register", "route.ts"))).toBe(true);
    const pkgJson = JSON.parse(await Bun.file(join(projectDir, "package.json")).text());
    expect(pkgJson.dependencies.next).toBeDefined();
    expect(pkgJson.scripts.dev).toBe("next dev");
  });

  test("generates auth module files with correct content", async () => {
    const projectName = "auth-app";

    const proc = Bun.spawn({
      cmd: ["bun", "run", CLI_PATH, "--yes", "--name", projectName],
      cwd: testDir,
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, NO_COLOR: "1" },
    });

    const exitCode = await proc.exited;
    expect(exitCode).toBe(0);

    const projectDir = join(testDir, projectName);

    // Auth files exist
    expect(existsSync(join(projectDir, "src/controllers/auth.controller.ts"))).toBe(true);
    expect(existsSync(join(projectDir, "src/middlewares/auth.middleware.ts"))).toBe(true);
    expect(existsSync(join(projectDir, "src/routes/auth.routes.ts"))).toBe(true);

    // Auth controller uses argon2 and JWT
    const authController = await Bun.file(join(projectDir, "src/controllers/auth.controller.ts")).text();
    expect(authController).toContain('from "argon2"');
    expect(authController).toContain('from "jsonwebtoken"');
    expect(authController).toContain("JWT_SECRET");
    expect(authController).toContain('expiresIn: "15m"');

    // Auth middleware verifies Bearer token
    const authMiddleware = await Bun.file(join(projectDir, "src/middlewares/auth.middleware.ts")).text();
    expect(authMiddleware).toContain("Bearer ");
    expect(authMiddleware).toContain("JWT_SECRET");

    // Server has auth routes mounted
    const serverSource = await Bun.file(join(projectDir, "src/index.ts")).text();
    expect(serverSource).toContain('"/api/auth"');

    // .env has JWT_SECRET
    const envContent = await Bun.file(join(projectDir, ".env")).text();
    expect(envContent).toContain("JWT_SECRET");

    // Prisma schema has password field
    const schema = await Bun.file(join(projectDir, "prisma/schema.prisma")).text();
    expect(schema).toContain("password");

    // package.json has auth deps
    const pkgJson = JSON.parse(await Bun.file(join(projectDir, "package.json")).text());
    expect(pkgJson.dependencies.argon2).toBeDefined();
    expect(pkgJson.dependencies.jsonwebtoken).toBeDefined();
    expect(pkgJson.devDependencies["@types/jsonwebtoken"]).toBeDefined();
    expect(pkgJson.devDependencies.effect).toBeUndefined();
    const userService = await Bun.file(join(projectDir, "src/services/user.service.ts")).text();
    expect(userService).toContain("select: publicUserSelect");
  });

  test("installs only the dependencies required by Clerk Node auth", async () => {
    const projectName = "clerk-api";

    const proc = Bun.spawn({
      cmd: ["bun", "run", CLI_PATH, "--yes", "--name", projectName, "--auth", "clerk", "--experimental"],
      cwd: testDir,
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, NO_COLOR: "1" },
    });

    expect(await proc.exited).toBe(0);

    const pkgJson = JSON.parse(await Bun.file(join(testDir, projectName, "package.json")).text());
    expect(pkgJson.dependencies["@clerk/clerk-sdk-node"]).toBeDefined();
    expect(pkgJson.dependencies["@clerk/backend"]).toBeUndefined();
    expect(pkgJson.dependencies.zod).toBeUndefined();
    expect(pkgJson.dependencies.argon2).toBeUndefined();
    expect(pkgJson.dependencies.jsonwebtoken).toBeUndefined();
  });

  test("uses Hono-specific dependencies for Clerk auth", async () => {
    const projectName = "clerk-hono";

    const proc = Bun.spawn({
      cmd: ["bun", "run", CLI_PATH, "--yes", "--name", projectName, "--framework", "hono", "--auth", "clerk", "--experimental"],
      cwd: testDir,
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, NO_COLOR: "1" },
    });

    expect(await proc.exited).toBe(0);

    const pkgJson = JSON.parse(await Bun.file(join(testDir, projectName, "package.json")).text());
    expect(pkgJson.dependencies["@clerk/backend"]).toBeDefined();
    expect(pkgJson.dependencies["@clerk/clerk-sdk-node"]).toBeUndefined();
    expect(pkgJson.devDependencies["@prisma/config"]).toBeDefined();
  });

  test("uses backend-appropriate scripts in a fullstack monorepo", async () => {
    const projectName = "python-monorepo";

    const proc = Bun.spawn({
      cmd: [
        "bun", "run", CLI_PATH,
        "--yes", "--name", projectName,
        "--framework", "monorepo",
        "--frontend", "react",
        "--backend", "python",
      ],
      cwd: testDir,
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, NO_COLOR: "1" },
    });

    expect(await proc.exited).toBe(0);

    const rootPackage = JSON.parse(await Bun.file(join(testDir, projectName, "package.json")).text());
    expect(rootPackage.scripts.dev).toContain("venv/bin/uvicorn app.main:app --reload");
    expect(rootPackage.devDependencies.concurrently).toBeDefined();
    expect(rootPackage.scripts["db:generate"]).toBeUndefined();
    expect(rootPackage.scripts["db:push"]).toBeUndefined();
    expect(rootPackage.scripts["db:studio"]).toBeUndefined();

    const backendEnv = await Bun.file(join(testDir, projectName, "backend", ".env")).text();
    expect(backendEnv).toContain("python-monorepo-backend");
  });

  test("keeps Prisma packages on version 7 and rejects Prisma 8 / pre-releases", async () => {
    const projectName = "prisma7-version-guard";

    const proc = Bun.spawn({
      cmd: [
        "bun", "run", CLI_PATH,
        "--yes", "--name", projectName,
        "--framework", "express",
      ],
      cwd: testDir,
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, NO_COLOR: "1" },
    });

    expect(await proc.exited).toBe(0);

    const pkgJson = JSON.parse(await Bun.file(join(testDir, projectName, "package.json")).text());
    expect(pkgJson.devDependencies.prisma).toMatch(/^\^7\./);
    expect(pkgJson.dependencies["@prisma/client"]).toMatch(/^\^7\./);
    expect(pkgJson.devDependencies["@prisma/config"]).toMatch(/^\^7\./);
    expect(pkgJson.dependencies["@prisma/adapter-pg"]).toMatch(/^\^7\./);
  });

  test("generates a project directly via --preset flag", async () => {
    const projectName = "preset-cli-express";

    const proc = Bun.spawn({
      cmd: [
        "bun", "run", CLI_PATH,
        "--preset", "express",
        "--name", projectName,
      ],
      cwd: testDir,
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, NO_COLOR: "1" },
    });

    expect(await proc.exited).toBe(0);

    const manifest = JSON.parse(await Bun.file(join(testDir, projectName, ".qwykz-manifest.json")).text());
    expect(manifest.scaffold.preset).toBe("api-express");
    expect(manifest.scaffold.framework).toBe("express");
    expect(manifest.scaffold.extraPackages).toContain("zod");
    expect(manifest.scaffold.extraPackages).toContain("helmet");
    expect(manifest.scaffold.extraPackages).toContain("cors");

    const agentsMd = await Bun.file(join(testDir, projectName, "AGENTS.md")).text();
    expect(agentsMd).toContain("- **Preset**    : api-express");
    expect(agentsMd).toContain("## Agent Guidelines");
  });
});

