import { afterAll, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const ROOT = import.meta.dir.replace("/tests", "");
const CLI_PATH = join(ROOT, "src/index.ts");
const TMP_ROOT = join(tmpdir(), "qwykz-managed-credentials");
const BUN_TMPDIR = join(TMP_ROOT, "bun-tmp");
const RUN_PROVIDER_SMOKE = process.env.QWYKZ_RUN_MANAGED_CREDENTIAL_SMOKE === "1";

const MANAGED_ENV_KEYS = [
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
  "UPSTASH_REDIS_HOST",
  "UPSTASH_REDIS_PASSWORD",
  "UPSTASH_REDIS_PORT",
] as const;

mkdirSync(BUN_TMPDIR, { recursive: true });

afterAll(() => {
  if (process.env.QWYKZ_KEEP_MANAGED_PROJECTS !== "1") {
    rmSync(TMP_ROOT, { recursive: true, force: true });
  }
});

describe("managed provider credential safety", () => {
  test("generated managed-provider scaffold keeps credentials as env placeholders", async () => {
    const projectName = "managed-env-placeholders";
    rmSync(join(TMP_ROOT, projectName), { recursive: true, force: true });

    await runCommand([
      "bun",
      "run",
      CLI_PATH,
      "--yes",
      "--name",
      projectName,
      "--framework",
      "express",
      "--db",
      "supabase",
      "--auth",
      "clerk",
      "--caching",
      "upstash",
    ], TMP_ROOT);

    const envPath = join(TMP_ROOT, projectName, ".env");
    expect(existsSync(envPath)).toBe(true);

    const envContent = readFileSync(envPath, "utf-8");
    expect(envContent).toContain("DATABASE_URL=");
    expect(envContent).toContain("DIRECT_URL=");
    expect(envContent).toContain("CLERK_PUBLISHABLE_KEY=");
    expect(envContent).toContain("CLERK_SECRET_KEY=");
    expect(envContent).toContain("UPSTASH_REDIS_REST_URL=");
    expect(envContent).toContain("UPSTASH_REDIS_REST_TOKEN=");

    for (const key of MANAGED_ENV_KEYS) {
      const value = process.env[key];
      if (value) expect(envContent).not.toContain(value);
    }
  });

  test("legacy helper scripts do not contain committed provider credentials", () => {
    const scriptPaths = [
      "tests/scripts/test-matrix.sh",
      "tests/scripts/test-qwykz.sh",
      "tests/scripts/run-all-maximized.ts",
      "tests/scripts/test-rust-endpoints.sh",
    ];
    const forbiddenPatterns = [
      /sk_(test|live)_[A-Za-z0-9_-]+/,
      /pk_(test|live)_[A-Za-z0-9_-]+/,
      /gQ[A-Za-z0-9_-]{20,}/,
      /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/,
      /postgresql:\/\/postgres\.[^:\s]+:[^@\s]+@/,
      /https:\/\/(?!your-endpoint\.upstash\.io)[a-z0-9-]+\.upstash\.io/,
    ];

    for (const scriptPath of scriptPaths) {
      const content = readFileSync(join(ROOT, scriptPath), "utf-8");
      for (const pattern of forbiddenPatterns) {
        expect(content, `${scriptPath} contains a hardcoded provider credential`).not.toMatch(pattern);
      }
    }
  });

  test("legacy helper scripts handle Laravel split database and Predis env keys", () => {
    const scriptPaths = [
      "tests/scripts/test-matrix.sh",
      "tests/scripts/test-qwykz.sh",
    ];

    for (const scriptPath of scriptPaths) {
      const content = readFileSync(join(ROOT, scriptPath), "utf-8");
      expect(content).toContain("pg_url_field");
      expect(content).toContain("sed_escape");
      expect(content).toContain("DB_CONNECTION=pgsql");
      expect(content).toContain('DB_HOST=$(sed_escape "$(pg_url_field host)")');
      expect(content).toContain('DB_PORT=$(sed_escape "$(pg_url_field port)")');
      expect(content).toContain('DB_DATABASE=$(sed_escape "$(pg_url_field database)")');
      expect(content).toContain('DB_USERNAME=$(sed_escape "$(pg_url_field username)")');
      expect(content).toContain('DB_PASSWORD=$(sed_escape "$(pg_url_field password)")');
      expect(content).toContain("REDIS_CLIENT=predis");
      expect(content).toContain("UPSTASH_REDIS_HOST");
      expect(content).toContain("UPSTASH_REDIS_PASSWORD");
      expect(content).toContain("UPSTASH_REDIS_PORT");
    }
  });
});

describe("managed provider credential smoke tests", () => {
  providerTest("Supabase URL and anon key can reach Auth settings", ["SUPABASE_URL", "SUPABASE_ANON_KEY"], async () => {
    const supabaseUrl = trimSlash(requiredEnv("SUPABASE_URL"));
    const anonKey = requiredEnv("SUPABASE_ANON_KEY");
    const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: {
        apikey: anonKey,
        authorization: `Bearer ${anonKey}`,
      },
    });
    await expectOk(response, "Supabase Auth settings request failed");
  });

  providerTest("Clerk secret key can reach the users API", ["CLERK_SECRET_KEY"], async () => {
    const response = await fetch("https://api.clerk.com/v1/users?limit=1", {
      headers: {
        authorization: `Bearer ${requiredEnv("CLERK_SECRET_KEY")}`,
      },
    });
    await expectOk(response, "Clerk users request failed");
  });

  providerTest("Upstash Redis REST credentials can set, get, and delete a smoke key", [
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
  ], async () => {
    const baseUrl = trimSlash(requiredEnv("UPSTASH_REDIS_REST_URL"));
    const token = requiredEnv("UPSTASH_REDIS_REST_TOKEN");
    const key = `qwykz:managed-smoke:${Date.now()}:${Math.random().toString(16).slice(2)}`;
    const value = `ok-${Date.now()}`;
    const headers = { authorization: `Bearer ${token}` };

    try {
      await expectOk(await fetch(`${baseUrl}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}`, { method: "POST", headers }), "Upstash SET failed");
      const getResponse = await fetch(`${baseUrl}/get/${encodeURIComponent(key)}`, { headers });
      await expectOk(getResponse, "Upstash GET failed");
      const body = await getResponse.json() as { result?: string };
      expect(body.result).toBe(value);
    } finally {
      await fetch(`${baseUrl}/del/${encodeURIComponent(key)}`, { method: "POST", headers }).catch(() => {});
    }
  });
});

function providerTest(name: string, requiredKeys: string[], fn: () => Promise<void>) {
  const missing = requiredKeys.filter((key) => !process.env[key]);
  const runner = RUN_PROVIDER_SMOKE && missing.length === 0 ? test : test.skip;
  const reason = !RUN_PROVIDER_SMOKE
    ? "set QWYKZ_RUN_MANAGED_CREDENTIAL_SMOKE=1"
    : missing.length > 0
      ? `missing env: ${missing.join(", ")}`
      : "";

  runner(reason ? `${name} (${reason})` : name, fn, 120_000);
}

async function runCommand(command: string[], cwd: string) {
  const proc = Bun.spawn({
    cmd: command,
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
  if (code !== 0) {
    throw new Error(redact(`Command failed (${code}): ${command.join(" ")}\n${stderr}\n${stdout}`));
  }
}

function childEnv() {
  const env = { ...process.env, BUN_TMPDIR, NO_COLOR: "1" };
  for (const key of MANAGED_ENV_KEYS) {
    delete env[key];
  }
  return env;
}

function requiredEnv(key: string) {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
}

function trimSlash(value: string) {
  return value.replace(/\/+$/, "");
}

async function expectOk(response: Response, message: string) {
  if (response.ok) return;
  const body = await response.text().catch(() => "");
  throw new Error(redact(`${message}: HTTP ${response.status} ${body.slice(0, 500)}`));
}

function redact(message: string) {
  let redacted = message;
  for (const key of MANAGED_ENV_KEYS) {
    const value = process.env[key];
    if (value) redacted = redacted.split(value).join(`[redacted:${key}]`);
  }
  return redacted;
}
