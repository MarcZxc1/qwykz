import { test, expect, afterEach, beforeEach, describe, setSystemTime } from "bun:test";
import { join } from "node:path";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { test as bunTest } from "bun:test";

// Increase timeout to 15 seconds to account for slow NPM registry lookups
bunTest.setTimeout(15000);

const CLI_PATH = join(import.meta.dirname!, "..", "src", "index.ts");
const TMP_BASE = join(import.meta.dirname!, "..", ".test-tmp");

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
    expect(serverSource).toContain("app.use(cors())");
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
    expect(prismaClient).toContain("DB URL DETECTED");

    // Supabase should NOT have docker-compose
    expect(existsSync(join(projectDir, "docker-compose.yml"))).toBe(false);
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
    expect(serverSource).toContain('"/auth"');

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
  });
});
