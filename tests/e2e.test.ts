import { test, expect } from "bun:test";
import { rm, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

const BUN_TMPDIR = join(tmpdir(), "qwykz-e2e-bun-tmp");
const RUN_EXTERNAL_BOOTSTRAPS = process.env.QWYKZ_RUN_EXTERNAL_BOOTSTRAPS === "1";
const externalBootstrapTest = RUN_EXTERNAL_BOOTSTRAPS ? test : test.skip;
await mkdir(BUN_TMPDIR, { recursive: true });
process.env.BUN_TMPDIR = BUN_TMPDIR;

async function run(cmd: string, cwd: string) {
  const [bin, ...args] = cmd.trim().split(/\s+/);
  if (!bin) throw new Error("Command cannot be empty");

  const proc = Bun.spawn({
    cmd: [bin, ...args],
    cwd,
    stdout: "ignore",
    stderr: "pipe",
    env: { ...process.env, BUN_TMPDIR },
  });

  const code = await proc.exited;
  if (code === 0) return true;

  const stderr = proc.stderr ? await new Response(proc.stderr).text() : "";
  throw new Error(`Command failed: ${cmd}\n${stderr}`);
}

async function waitForServer(url: string) {
  for (let i = 0; i < 15; i++) {
    try {
      await fetch(url);
      return;
    } catch {
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  throw new Error("Server failed to boot in time");
}

test("E2E: Express with Docker Postgres", async () => {
  const projectName = "e2e-express";
  await rm(projectName, { recursive: true, force: true });
  const cwd = join(process.cwd(), projectName);

  try {
    await run(`bun run src/index.ts -y --name ${projectName} --framework express --db docker`, process.cwd());
    expect(await Bun.file(join(cwd, "docker-compose.yml")).exists()).toBe(true);
    expect(await Bun.file(join(cwd, "src/lib/wait-for-postgres.ts")).exists()).toBe(true);
    expect(await Bun.file(join(cwd, "src/index.ts")).exists()).toBe(true);
    const pkg = JSON.parse(await Bun.file(join(cwd, "package.json")).text());
    expect(pkg.scripts["db:generate"]).toBeDefined();
  } finally {
    await rm(projectName, { recursive: true, force: true }).catch(() => {});
  }
}, 120000);

externalBootstrapTest("E2E: Laravel with Docker Postgres", async () => {
  const projectName = "e2e-laravel";
  await rm(projectName, { recursive: true, force: true });
  const cwd = join(process.cwd(), projectName);

  try {
    await run(`bun run src/index.ts -y --name ${projectName} --framework laravel --db docker`, process.cwd());
    expect(await Bun.file(join(cwd, "artisan")).exists()).toBe(true);
    expect(await Bun.file(join(cwd, "routes/api.php")).exists()).toBe(true);
    expect(await Bun.file(join(cwd, "app/Http/Controllers/Api/AuthController.php")).exists()).toBe(true);
    expect(await Bun.file(join(cwd, "docker-compose.yml")).exists()).toBe(true);
  } finally {
    await rm(projectName, { recursive: true, force: true }).catch(() => {});
  }
}, 120000);

externalBootstrapTest("E2E: Next.js with Docker Postgres", async () => {
  const projectName = "e2e-nextjs";
  await rm(projectName, { recursive: true, force: true });
  const cwd = join(process.cwd(), projectName);

  try {
    await run(`bun run src/index.ts -y --name ${projectName} --framework nextjs --db docker`, process.cwd());
    expect(await Bun.file(join(cwd, "app/api/health/route.ts")).exists()).toBe(true);
    expect(await Bun.file(join(cwd, "app/api/auth/register/route.ts")).exists()).toBe(true);
    expect(await Bun.file(join(cwd, "app/api/auth/login/route.ts")).exists()).toBe(true);
    const pkg = JSON.parse(await Bun.file(join(cwd, "package.json")).text());
    expect(pkg.dependencies["@prisma/client"]).toBeDefined();
  } finally {
    await rm(projectName, { recursive: true, force: true }).catch(() => {});
  }
}, 180000);

test("E2E: React with Vite Build", async () => {
  const projectName = "e2e-react";
  await rm(projectName, { recursive: true, force: true });
  const cwd = join(process.cwd(), projectName);

  try {
    await run(`bun run src/index.ts -y --name ${projectName} --framework react`, process.cwd());
    expect(await Bun.file(join(cwd, "index.html")).exists()).toBe(true);
    expect(await Bun.file(join(cwd, "src/main.tsx")).exists()).toBe(true);
    const pkg = JSON.parse(await Bun.file(join(cwd, "package.json")).text());
    expect(pkg.dependencies.react).toBeDefined();
    expect(pkg.dependencies["@clerk/react"]).toBeUndefined();
  } finally {
    await rm(projectName, { recursive: true, force: true }).catch(() => {});
  }
}, 180000);

test("E2E: Vue with Vite Build", async () => {
  const projectName = "e2e-vue";
  await rm(projectName, { recursive: true, force: true });
  const cwd = join(process.cwd(), projectName);

  try {
    await run(`bun run src/index.ts -y --name ${projectName} --framework vue`, process.cwd());
    expect(await Bun.file(join(cwd, "index.html")).exists()).toBe(true);
    expect(await Bun.file(join(cwd, "src/main.ts")).exists()).toBe(true);
    const pkg = JSON.parse(await Bun.file(join(cwd, "package.json")).text());
    expect(pkg.dependencies.vue).toBeDefined();
    expect(pkg.dependencies["@clerk/vue"]).toBeUndefined();
  } finally {
    await rm(projectName, { recursive: true, force: true }).catch(() => {});
  }
}, 180000);

test("E2E: Python FastAPI Scaffold Verification", async () => {
  const projectName = "e2e-python";
  await rm(projectName, { recursive: true, force: true });
  const cwd = join(process.cwd(), projectName);

  try {
    await run(`bun run src/index.ts -y --name ${projectName} --framework python`, process.cwd());
    const mainStat = await Bun.file(join(cwd, "app/main.py")).exists();
    const reqStat = await Bun.file(join(cwd, "requirements.txt")).exists();
    const dbStat = await Bun.file(join(cwd, "app/core/db.py")).exists();
    
    expect(mainStat).toBe(true);
    expect(reqStat).toBe(true);
    expect(dbStat).toBe(true);
  } finally {
    await rm(projectName, { recursive: true, force: true }).catch(() => {});
  }
});

test("E2E: Go Fiber Scaffold Verification", async () => {
  const projectName = "e2e-go";
  await rm(projectName, { recursive: true, force: true });
  const cwd = join(process.cwd(), projectName);

  try {
    await run(`bun run src/index.ts -y --name ${projectName} --framework go`, process.cwd());
    const mainStat = await Bun.file(join(cwd, "cmd/api/main.go")).exists();
    const goModStat = await Bun.file(join(cwd, "go.mod")).exists();
    const authStat = await Bun.file(join(cwd, "internal/handlers/auth.go")).exists();
    
    expect(mainStat).toBe(true);
    expect(goModStat).toBe(true);
    expect(authStat).toBe(true);
  } finally {
    await rm(projectName, { recursive: true, force: true }).catch(() => {});
  }
});

test("E2E: Rust Axum Scaffold Verification", async () => {
  const projectName = "e2e-rust";
  await rm(projectName, { recursive: true, force: true });
  const cwd = join(process.cwd(), projectName);

  try {
    await run(`bun run src/index.ts -y --name ${projectName} --framework rust`, process.cwd());
    const mainStat = await Bun.file(join(cwd, "src/main.rs")).exists();
    const cargoStat = await Bun.file(join(cwd, "Cargo.toml")).exists();
    const dbStat = await Bun.file(join(cwd, "src/db/models.rs")).exists();
    
    expect(mainStat).toBe(true);
    expect(cargoStat).toBe(true);
    expect(dbStat).toBe(true);
  } finally {
    await rm(projectName, { recursive: true, force: true }).catch(() => {});
  }
});

test("E2E: Hono Scaffold Verification", async () => {
  const projectName = "e2e-hono";
  await rm(projectName, { recursive: true, force: true });
  const cwd = join(process.cwd(), projectName);

  try {
    await run(`bun run src/index.ts -y --name ${projectName} --framework hono`, process.cwd());
    const mainStat = await Bun.file(join(cwd, "src/index.ts")).exists();
    const testStat = await Bun.file(join(cwd, "src/index.test.ts")).exists();
    
    expect(mainStat).toBe(true);
    expect(testStat).toBe(true);
  } finally {
    await rm(projectName, { recursive: true, force: true }).catch(() => {});
  }
});

test("E2E: Elysia Scaffold Verification", async () => {
  const projectName = "e2e-elysia";
  await rm(projectName, { recursive: true, force: true });
  const cwd = join(process.cwd(), projectName);

  try {
    await run(`bun run src/index.ts -y --name ${projectName} --framework elysia`, process.cwd());
    const mainStat = await Bun.file(join(cwd, "src/index.ts")).exists();
    const testStat = await Bun.file(join(cwd, "src/index.test.ts")).exists();
    
    expect(mainStat).toBe(true);
    expect(testStat).toBe(true);
  } finally {
    await rm(projectName, { recursive: true, force: true }).catch(() => {});
  }
});
