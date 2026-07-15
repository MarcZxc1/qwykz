import { afterAll, describe, expect, test } from "bun:test";
import { mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const ROOT = import.meta.dir.replace("/tests", "");
const CLI_PATH = join(ROOT, "src/index.ts");
const RUN_RUNTIME_SMOKE = process.env.QWYKZ_RUN_RUNTIME_SMOKE === "1";
const FILTER = process.env.QWYKZ_SMOKE_FILTER?.split(",").map((item) => item.trim()).filter(Boolean) ?? [];
const TMP_ROOT = join(tmpdir(), "qwykz-runtime-smoke");
const BUN_TMPDIR = join(TMP_ROOT, "bun-tmp");

const BACKENDS = ["express", "hono", "elysia", "laravel", "python", "go", "rust"] as const;
const FRONTENDS = ["react", "vue"] as const;
const DB_TARGETS = ["docker", "local"] as const;
const CACHE_TARGETS = ["none", "docker"] as const;

type BackendFramework = typeof BACKENDS[number];
type FrontendFramework = typeof FRONTENDS[number];
type DbTarget = typeof DB_TARGETS[number];
type CacheTarget = typeof CACHE_TARGETS[number];
type SmokeKind = "backend" | "fullstack" | "nextjs";

type SmokeSpec = {
  name: string;
  kind: SmokeKind;
  backend: BackendFramework | "nextjs";
  frontend?: FrontendFramework;
  dbTarget: DbTarget;
  cacheTarget: CacheTarget;
  flags: string;
  projectSubdir?: string;
  start: string;
  port: number;
  healthPath: string;
  auth: boolean;
  external: boolean;
  tags: string[];
};

type CurlResult = {
  status: number;
  body: string;
};

const GENERATED_ENV_KEYS = [
  "DATABASE_URL",
  "DIRECT_URL",
  "JWT_SECRET",
  "REDIS_URL",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_DB_URL",
  "SUPABASE_DIRECT_URL",
  "CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
] as const;

const smokeSpecs = buildSmokeSpecs();
const selectedSpecs = smokeSpecs.filter((spec) => {
  if (spec.external && process.env.QWYKZ_SMOKE_INCLUDE_EXTERNAL !== "1") return false;
  if (FILTER.length === 0) return true;
  return FILTER.some((filter) => spec.name === filter || spec.kind === filter || spec.tags.includes(filter));
});

afterAll(async () => {
  for (const spec of selectedSpecs) {
    await cleanupSpec(spec);
  }
});

describe("runtime smoke matrix definition", () => {
  test("covers backend API, fullstack, and Next.js db/cache combinations", () => {
    expect(smokeSpecs.filter((spec) => spec.kind === "backend")).toHaveLength(28);
    expect(smokeSpecs.filter((spec) => spec.kind === "fullstack")).toHaveLength(56);
    expect(smokeSpecs.filter((spec) => spec.kind === "nextjs")).toHaveLength(4);
    expect(smokeSpecs.filter((spec) => spec.backend === "laravel" && spec.external)).toHaveLength(12);

    for (const backend of BACKENDS) {
      for (const dbTarget of DB_TARGETS) {
        for (const cacheTarget of CACHE_TARGETS) {
          expect(findSpec("backend", backend, undefined, dbTarget, cacheTarget)).toBeDefined();
        }
      }
    }

    for (const frontend of FRONTENDS) {
      for (const backend of BACKENDS) {
        for (const dbTarget of DB_TARGETS) {
          for (const cacheTarget of CACHE_TARGETS) {
            expect(findSpec("fullstack", backend, frontend, dbTarget, cacheTarget)).toBeDefined();
          }
        }
      }
    }
  });
});

describe("generated app runtime smoke tests", () => {
  for (const spec of smokeSpecs) {
    const skipReason = shouldSkip(spec);
    const runner = skipReason ? test.skip : test;

    runner(`${spec.kind}: ${spec.name} responds through health and auth endpoints`, async () => {
      await cleanupSpec(spec);
      await mkdir(BUN_TMPDIR, { recursive: true });
      await generateProject(spec);
      expect(existsSync(specRootDir(spec))).toBe(true);

      try {
        await runSetup(spec);
        await withServer(spec, async (health) => {
          expect(health.status).toBeGreaterThanOrEqual(200);
          expect(health.status).toBeLessThan(300);
          if (spec.auth) await assertAuthFlow(spec);
        });
      } finally {
        await cleanupSpec(spec);
        if (process.env.QWYKZ_KEEP_SMOKE_PROJECTS !== "1") {
          await rm(specRootDir(spec), { recursive: true, force: true }).catch(() => {});
        }
      }
    }, 900_000);
  }
});

function buildSmokeSpecs(): SmokeSpec[] {
  const specs: SmokeSpec[] = [];

  for (const backend of BACKENDS) {
    for (const dbTarget of DB_TARGETS) {
      for (const cacheTarget of CACHE_TARGETS) {
        specs.push(createSpec({
          kind: "backend",
          backend,
          dbTarget,
          cacheTarget,
          flags: `--framework ${backend} --db ${dbTarget} --auth local --caching ${cacheTarget}`,
        }));
      }
    }
  }

  for (const frontend of FRONTENDS) {
    for (const backend of BACKENDS) {
      for (const dbTarget of DB_TARGETS) {
        for (const cacheTarget of CACHE_TARGETS) {
          specs.push(createSpec({
            kind: "fullstack",
            frontend,
            backend,
            dbTarget,
            cacheTarget,
            flags: `--framework monorepo --frontend ${frontend} --backend ${backend} --db ${dbTarget} --auth local --caching ${cacheTarget}`,
            projectSubdir: "backend",
          }));
        }
      }
    }
  }

  for (const dbTarget of DB_TARGETS) {
    for (const cacheTarget of CACHE_TARGETS) {
      specs.push(createSpec({
        kind: "nextjs",
        backend: "nextjs",
        dbTarget,
        cacheTarget,
        flags: `--framework nextjs --db ${dbTarget} --auth local --caching ${cacheTarget}`,
      }));
    }
  }

  return specs;
}

function createSpec(input: {
  kind: SmokeKind;
  backend: BackendFramework | "nextjs";
  frontend?: FrontendFramework;
  dbTarget: DbTarget;
  cacheTarget: CacheTarget;
  flags: string;
  projectSubdir?: string;
}): SmokeSpec {
  const runtime = runtimeFor(input.backend);
  const nameParts = [
    input.kind === "backend" ? "api" : input.kind,
    input.frontend,
    input.backend,
    input.dbTarget,
    input.cacheTarget === "docker" ? "redis" : "no-redis",
  ].filter(Boolean);
  const name = nameParts.join("-");
  const external = input.backend === "laravel";
  const tags = [
    input.kind,
    input.backend,
    input.frontend,
    input.dbTarget,
    input.cacheTarget === "docker" ? "redis" : "no-redis",
    external ? "external" : "default",
  ].filter(Boolean) as string[];

  return {
    name,
    kind: input.kind,
    backend: input.backend,
    frontend: input.frontend,
    dbTarget: input.dbTarget,
    cacheTarget: input.cacheTarget,
    flags: input.flags,
    projectSubdir: input.projectSubdir,
    start: input.kind === "fullstack" ? "bun run dev" : runtime.start,
    port: runtime.port,
    healthPath: runtime.healthPath,
    auth: true,
    external,
    tags,
  };
}

function runtimeFor(backend: BackendFramework | "nextjs") {
  if (backend === "python") {
    return {
      start: "venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000",
      port: 8000,
      healthPath: "/api/health/",
    };
  }
  if (backend === "go") {
    return { start: "go run cmd/api/main.go", port: 3000, healthPath: "/api/health" };
  }
  if (backend === "rust") {
    return { start: "cargo run", port: 8080, healthPath: "/api/health" };
  }
  if (backend === "laravel") {
    return { start: "php artisan serve --host 0.0.0.0 --port 8000", port: 8000, healthPath: "/api/health" };
  }
  if (backend === "nextjs") {
    return { start: "bun dev", port: 3000, healthPath: "/api/health" };
  }
  return { start: "bun run dev", port: 3000, healthPath: "/api/health" };
}

function findSpec(
  kind: SmokeKind,
  backend: BackendFramework | "nextjs",
  frontend: FrontendFramework | undefined,
  dbTarget: DbTarget,
  cacheTarget: CacheTarget,
) {
  return smokeSpecs.find((spec) =>
    spec.kind === kind &&
    spec.backend === backend &&
    spec.frontend === frontend &&
    spec.dbTarget === dbTarget &&
    spec.cacheTarget === cacheTarget
  );
}

function specProjectName(spec: SmokeSpec) {
  return `smoke-${spec.name}`;
}

function specRootDir(spec: SmokeSpec) {
  return join(TMP_ROOT, specProjectName(spec));
}

function specWorkingDir(spec: SmokeSpec) {
  return join(specRootDir(spec), spec.projectSubdir ?? "");
}

function specDatabaseName(spec: SmokeSpec) {
  return specProjectName(spec.projectSubdir ? { ...spec, name: `${spec.name}-backend` } : spec).replace(/[\\/]/g, "-");
}

function shouldSkip(spec: SmokeSpec) {
  if (!RUN_RUNTIME_SMOKE) return "set QWYKZ_RUN_RUNTIME_SMOKE=1";
  if (!selectedSpecs.includes(spec)) return "filtered out";
  return false;
}

function needsCompose(spec: SmokeSpec) {
  return spec.dbTarget === "docker" || spec.cacheTarget === "docker";
}

async function runCommand(command: string[], cwd: string, allowFailure = false) {
  const timeoutSeconds = commandTimeoutSeconds();
  const timedCommand = ["timeout", "--kill-after=5s", `${timeoutSeconds}s`, ...command];
  const proc = Bun.spawn({
    cmd: timedCommand,
    cwd,
    stdout: "pipe",
    stderr: "pipe",
    stdin: "ignore",
    env: childEnv(),
  });
  const [stdout, stderr, code] = await Promise.all([
    proc.stdout ? new Response(proc.stdout).text() : "",
    proc.stderr ? new Response(proc.stderr).text() : "",
    proc.exited,
  ]);
  if (code === 124 && !allowFailure) {
    throw new Error(`Command timed out after ${timeoutSeconds}s: ${command.join(" ")}\n${stderr}\n${stdout}`);
  }
  if (code !== 0 && !allowFailure) {
    throw new Error(`Command failed (${code}): ${command.join(" ")}\n${stderr}\n${stdout}`);
  }
  return { stdout, stderr, code };
}

function commandTimeoutSeconds() {
  const override = Number(process.env.QWYKZ_SMOKE_COMMAND_TIMEOUT_SECONDS);
  return Number.isFinite(override) && override > 0 ? override : 300;
}

function childEnv() {
  const env = { ...process.env, BUN_TMPDIR };
  for (const key of GENERATED_ENV_KEYS) {
    delete env[key];
  }
  return env;
}

async function runShell(command: string, cwd: string, allowFailure = false) {
  return runCommand(["bash", "-lc", command], cwd, allowFailure);
}

async function curl(args: string[]): Promise<CurlResult> {
  const result = await runCommand(["curl", "-sS", "-L", "-o", "-", "-w", "\n%{http_code}", ...args], ROOT);
  const output = result.stdout.trimEnd();
  const lastNewline = output.lastIndexOf("\n");
  if (lastNewline === -1) throw new Error(`Could not parse curl output: ${output}`);
  const body = output.slice(0, lastNewline);
  const status = Number(output.slice(lastNewline + 1));
  return { status, body };
}

async function waitForHealthy(spec: SmokeSpec) {
  const url = `http://127.0.0.1:${spec.port}${spec.healthPath}`;
  let lastError = "";
  for (let i = 0; i < healthTimeoutSeconds(spec); i++) {
    try {
      const result = await curl([url]);
      if (result.status >= 200 && result.status < 300) return result;
      lastError = `${result.status} ${result.body}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await Bun.sleep(1000);
  }
  throw new Error(`Health check failed for ${url}: ${lastError}`);
}

function healthTimeoutSeconds(spec: SmokeSpec) {
  const override = Number(process.env.QWYKZ_SMOKE_HEALTH_TIMEOUT_SECONDS);
  if (Number.isFinite(override) && override > 0) return override;
  return spec.backend === "rust" ? 180 : 45;
}

async function postJson(url: string, payload: Record<string, string>) {
  return curl([
    "-X",
    "POST",
    url,
    "-H",
    "Content-Type: application/json",
    "-d",
    JSON.stringify(payload),
  ]);
}

async function assertAuthFlow(spec: SmokeSpec) {
  const baseUrl = `http://127.0.0.1:${spec.port}`;
  const email = `${specProjectName(spec)}-${Date.now()}@example.com`;
  const password = "supersecuredpassword";
  const register = await postJson(`${baseUrl}/api/auth/register`, {
    name: "Smoke Test",
    email,
    password,
  });
  expect([200, 201]).toContain(register.status);

  const login = await postJson(`${baseUrl}/api/auth/login`, {
    email,
    password,
  });
  expect(login.status).toBe(200);
}

async function generateProject(spec: SmokeSpec) {
  await rm(specRootDir(spec), { recursive: true, force: true });
  await runShell(`bun run ${CLI_PATH} --yes --name ${specProjectName(spec)} ${spec.flags}`, TMP_ROOT);
}

async function runSetup(spec: SmokeSpec) {
  if (spec.kind === "fullstack") {
    await runShell("bun install", specRootDir(spec));
  }

  if (spec.dbTarget === "local") {
    await ensureLocalPostgresDatabase(spec);
  }

  if (needsCompose(spec)) {
    await runShell("docker compose config", specWorkingDir(spec));
    await runShell("docker compose up -d --wait --wait-timeout 120", specWorkingDir(spec));
  }

  if (spec.backend === "express" || spec.backend === "hono" || spec.backend === "elysia" || spec.backend === "nextjs") {
    await runShell("bun install", specWorkingDir(spec));
    await runShell("bun run db:generate", specWorkingDir(spec));
    await runShell("bun run db:push", specWorkingDir(spec));
    return;
  }

  if (spec.backend === "python") {
    const python = spec.kind === "fullstack" ? "python3" : "python";
    await runShell(`${python} -m venv venv`, specWorkingDir(spec));
    await runShell("venv/bin/pip install -r requirements.txt", specWorkingDir(spec));
    return;
  }

  if (spec.backend === "go") {
    await runShell("go mod tidy", specWorkingDir(spec));
    return;
  }

  if (spec.backend === "rust") {
    await runShell("cargo sqlx migrate run", specWorkingDir(spec));
    return;
  }

  if (spec.backend === "laravel") {
    await runShell("php artisan key:generate --force -n", specWorkingDir(spec));
    await runShell("php artisan migrate --force -n", specWorkingDir(spec));
  }
}

async function ensureLocalPostgresDatabase(spec: SmokeSpec) {
  const databaseName = specDatabaseName(spec);
  const exists = await runShell(
    `psql -U postgres -d postgres -v ON_ERROR_STOP=1 -tAc "SELECT 1 FROM pg_database WHERE datname = '${databaseName.replace(/'/g, "''")}'"`,
    specWorkingDir(spec),
  );
  if (exists.stdout.trim() !== "1") {
    await runShell(`createdb -U postgres "${databaseName.replace(/"/g, '""')}"`, specWorkingDir(spec));
  }
}

async function cleanupSpec(spec: SmokeSpec) {
  if (existsSync(specWorkingDir(spec)) && needsCompose(spec)) {
    await runShell("docker compose down -v --remove-orphans", specWorkingDir(spec), true).catch(() => {});
  }
  if (needsCompose(spec)) {
    const prefix = specDatabaseName(spec);
    if (spec.dbTarget === "docker") {
      await runCommand(["docker", "rm", "-f", `${prefix}-postgres`], ROOT, true).catch(() => {});
      await runCommand(["docker", "volume", "rm", "-f", `${prefix}_data`], ROOT, true).catch(() => {});
    }
    if (spec.cacheTarget === "docker") {
      await runCommand(["docker", "rm", "-f", `${prefix}-redis`], ROOT, true).catch(() => {});
    }
  }
  if (spec.dbTarget === "local") {
    await runShell(`dropdb -U postgres --if-exists "${specDatabaseName(spec).replace(/"/g, '""')}"`, ROOT, true).catch(() => {});
  }
}

async function withServer(spec: SmokeSpec, fn: (health: CurlResult) => Promise<void>) {
  const cwd = spec.kind === "fullstack" ? specRootDir(spec) : specWorkingDir(spec);
  const verbose = process.env.QWYKZ_SMOKE_VERBOSE === "1";
  const server = Bun.spawn({
    cmd: ["bash", "-lc", spec.start],
    cwd,
    stdout: verbose ? "inherit" : "ignore",
    stderr: verbose ? "inherit" : "ignore",
    stdin: "ignore",
    env: childEnv(),
    detached: true,
  });

  try {
    const health = await waitForHealthy(spec);
    await fn(health);
  } finally {
    await stopServer(server);
  }
}

async function stopServer(server: ReturnType<typeof Bun.spawn>) {
  try {
    process.kill(-server.pid, "SIGTERM");
  } catch {
    server.kill("SIGTERM");
  }

  const exited = await Promise.race([
    server.exited.then(() => true).catch(() => true),
    Bun.sleep(5000).then(() => false),
  ]);
  if (exited) return;

  try {
    process.kill(-server.pid, "SIGKILL");
  } catch {
    server.kill("SIGKILL");
  }
  await Promise.race([
    server.exited.catch(() => {}),
    Bun.sleep(2000),
  ]);
}
