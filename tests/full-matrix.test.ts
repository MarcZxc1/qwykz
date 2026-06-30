import { describe, test, expect, afterAll } from "bun:test";
import { execSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";

const ROOT = import.meta.dir.replace("/tests", "");
const CLI = `bun run ${join(ROOT, "src/index.ts")}`;

function scaffold(name: string, flags: string): boolean {
  try {
    execSync(`${CLI} -y --name ${name} ${flags}`, {
      cwd: ROOT,
      stdio: "pipe",
      timeout: 30_000,
    });
    return true;
  } catch (e: any) {
    console.error(`Scaffold failed for ${name}: ${e.stderr?.toString() || e.message}`);
    return false;
  }
}

function fileExists(project: string, path: string): boolean {
  return existsSync(join(ROOT, project, path));
}

function fileContains(project: string, path: string, needle: string): boolean {
  if (!fileExists(project, path)) return false;
  const content = readFileSync(join(ROOT, project, path), "utf-8");
  return content.includes(needle);
}

function bunInstall(project: string): boolean {
  try {
    execSync("bun install", {
      cwd: join(ROOT, project),
      stdio: "pipe",
      timeout: 60_000,
    });
    return true;
  } catch {
    return false;
  }
}

function cleanup(project: string) {
  try {
    rmSync(join(ROOT, project), { recursive: true, force: true });
  } catch {}
}

// Track all projects for cleanup
const allProjects: string[] = [];

afterAll(() => {
  for (const p of allProjects) cleanup(p);
});

// ─── Backend Frameworks × DB Targets ────────────────────────────────────────

describe("Express", () => {
  test("local DB", () => {
    const name = "t-express-local";
    allProjects.push(name);
    expect(scaffold(name, "--framework express --db local")).toBe(true);
    expect(fileExists(name, "src/index.ts")).toBe(true);
    expect(fileExists(name, "prisma/schema.prisma")).toBe(true);
    expect(fileExists(name, "package.json")).toBe(true);
    expect(fileExists(name, ".env")).toBe(true);
    expect(fileContains(name, ".env", "DATABASE_URL")).toBe(true);
    expect(bunInstall(name)).toBe(true);
  });

  test("docker DB", () => {
    const name = "t-express-docker";
    allProjects.push(name);
    expect(scaffold(name, "--framework express --db docker")).toBe(true);
    expect(fileExists(name, "docker-compose.yml")).toBe(true);
    expect(fileExists(name, "src/lib/wait-for-postgres.ts")).toBe(true);
    expect(bunInstall(name)).toBe(true);
  });

  test("supabase DB", () => {
    const name = "t-express-supa";
    allProjects.push(name);
    expect(scaffold(name, "--framework express --db supabase")).toBe(true);
    expect(fileExists(name, "src/index.ts")).toBe(true);
    expect(fileContains(name, ".env", "YOUR-PROJECT-ID")).toBe(true);
    expect(bunInstall(name)).toBe(true);
  });

  test("local DB + docker redis", () => {
    const name = "t-express-local-redis";
    allProjects.push(name);
    expect(scaffold(name, "--framework express --db local --caching docker")).toBe(true);
    expect(fileExists(name, "src/lib/redis.ts")).toBe(true);
    expect(fileContains(name, "src/lib/redis.ts", "ioredis")).toBe(true);
    expect(fileContains(name, "package.json", "ioredis")).toBe(true);
    expect(bunInstall(name)).toBe(true);
  });

  test("local DB + upstash redis", () => {
    const name = "t-express-local-upstash";
    allProjects.push(name);
    expect(scaffold(name, "--framework express --db local --caching upstash")).toBe(true);
    expect(fileExists(name, "src/lib/redis.ts")).toBe(true);
    expect(fileContains(name, "src/lib/redis.ts", "@upstash/redis")).toBe(true);
    expect(fileContains(name, "package.json", "@upstash/redis")).toBe(true);
    expect(bunInstall(name)).toBe(true);
  });
});

describe("Hono", () => {
  test("local DB", () => {
    const name = "t-hono-local";
    allProjects.push(name);
    expect(scaffold(name, "--framework hono --db local")).toBe(true);
    expect(fileExists(name, "src/index.ts")).toBe(true);
    expect(fileExists(name, "src/routes/auth.routes.ts")).toBe(true);
    expect(fileExists(name, "src/routes/health.routes.ts")).toBe(true);
    expect(bunInstall(name)).toBe(true);
  });

  test("docker DB", () => {
    const name = "t-hono-docker";
    allProjects.push(name);
    expect(scaffold(name, "--framework hono --db docker")).toBe(true);
    expect(fileExists(name, "docker-compose.yml")).toBe(true);
    expect(bunInstall(name)).toBe(true);
  });

  test("supabase DB", () => {
    const name = "t-hono-supa";
    allProjects.push(name);
    expect(scaffold(name, "--framework hono --db supabase")).toBe(true);
    expect(fileContains(name, ".env", "YOUR-PROJECT-ID")).toBe(true);
    expect(bunInstall(name)).toBe(true);
  });
});

describe("Elysia", () => {
  test("local DB", () => {
    const name = "t-elysia-local";
    allProjects.push(name);
    expect(scaffold(name, "--framework elysia --db local")).toBe(true);
    expect(fileExists(name, "src/index.ts")).toBe(true);
    // Verify no template placeholders leaked
    expect(fileContains(name, "src/index.ts", "{{")).toBe(false);
    expect(bunInstall(name)).toBe(true);
  });

  test("docker DB", () => {
    const name = "t-elysia-docker";
    allProjects.push(name);
    expect(scaffold(name, "--framework elysia --db docker")).toBe(true);
    expect(fileExists(name, "docker-compose.yml")).toBe(true);
    expect(bunInstall(name)).toBe(true);
  });

  test("supabase DB", () => {
    const name = "t-elysia-supa";
    allProjects.push(name);
    expect(scaffold(name, "--framework elysia --db supabase")).toBe(true);
    expect(fileContains(name, ".env", "YOUR-PROJECT-ID")).toBe(true);
    expect(bunInstall(name)).toBe(true);
  });
});

describe("Laravel", () => {
  test("local DB", () => {
    const name = "t-laravel-local";
    allProjects.push(name);
    expect(scaffold(name, "--framework laravel --db local")).toBe(true);
    expect(fileExists(name, "artisan")).toBe(true);
    expect(fileExists(name, "routes/api.php")).toBe(true);
    expect(fileExists(name, "app/Http/Controllers/Api/AuthController.php")).toBe(true);
  });

  test("docker DB", () => {
    const name = "t-laravel-docker";
    allProjects.push(name);
    expect(scaffold(name, "--framework laravel --db docker")).toBe(true);
    expect(fileExists(name, "docker-compose.yml")).toBe(true);
  });

  test("supabase DB", () => {
    const name = "t-laravel-supa";
    allProjects.push(name);
    expect(scaffold(name, "--framework laravel --db supabase")).toBe(true);
    expect(fileExists(name, ".env")).toBe(true);
  });
});

describe("Next.js", () => {
  test("local DB", () => {
    const name = "t-nextjs-local";
    allProjects.push(name);
    expect(scaffold(name, "--framework nextjs --db local")).toBe(true);
    expect(fileExists(name, "app/api/auth/register/route.ts")).toBe(true);
    expect(fileExists(name, "app/api/auth/login/route.ts")).toBe(true);
    expect(fileExists(name, "app/api/health/route.ts")).toBe(true);
    expect(fileExists(name, "prisma/schema.prisma")).toBe(true);
    expect(bunInstall(name)).toBe(true);
  });

  test("docker DB", () => {
    const name = "t-nextjs-docker";
    allProjects.push(name);
    expect(scaffold(name, "--framework nextjs --db docker")).toBe(true);
    expect(fileExists(name, "docker-compose.yml")).toBe(true);
    expect(bunInstall(name)).toBe(true);
  });

  test("supabase DB", () => {
    const name = "t-nextjs-supa";
    allProjects.push(name);
    expect(scaffold(name, "--framework nextjs --db supabase")).toBe(true);
    expect(fileContains(name, ".env", "supabase")).toBe(true);
    expect(bunInstall(name)).toBe(true);
  });
});

// ─── Frontend Frameworks × Auth Providers ────────────────────────────────────

describe("React", () => {
  test("supabase auth", () => {
    const name = "t-react-supa";
    allProjects.push(name);
    expect(scaffold(name, "--framework react --auth supabase")).toBe(true);
    expect(fileExists(name, "src/App.tsx")).toBe(true);
    expect(fileExists(name, "src/lib/supabase.ts")).toBe(true);
    expect(bunInstall(name)).toBe(true);
  });

  test("clerk auth", () => {
    const name = "t-react-clerk";
    allProjects.push(name);
    expect(scaffold(name, "--framework react --auth clerk")).toBe(true);
    expect(fileExists(name, "src/App.tsx")).toBe(true);
    // Clerk provider content is written directly into App.tsx
    expect(fileContains(name, "src/App.tsx", "clerk") || fileContains(name, "src/App.tsx", "Clerk")).toBe(true);
    expect(bunInstall(name)).toBe(true);
  });

  test("no auth (local)", () => {
    const name = "t-react-local";
    allProjects.push(name);
    expect(scaffold(name, "--framework react --auth local")).toBe(true);
    expect(fileExists(name, "src/App.tsx")).toBe(true);
    expect(bunInstall(name)).toBe(true);
  });
});

describe("Vue", () => {
  test("supabase auth", () => {
    const name = "t-vue-supa";
    allProjects.push(name);
    expect(scaffold(name, "--framework vue --auth supabase")).toBe(true);
    expect(fileExists(name, "src/App.vue")).toBe(true);
    expect(fileExists(name, "src/lib/supabase.ts")).toBe(true);
    expect(bunInstall(name)).toBe(true);
  });

  test("clerk auth", () => {
    const name = "t-vue-clerk";
    allProjects.push(name);
    expect(scaffold(name, "--framework vue --auth clerk")).toBe(true);
    expect(fileExists(name, "src/App.vue")).toBe(true);
    expect(bunInstall(name)).toBe(true);
  });

  test("no auth (local)", () => {
    const name = "t-vue-local";
    allProjects.push(name);
    expect(scaffold(name, "--framework vue --auth local")).toBe(true);
    expect(fileExists(name, "src/App.vue")).toBe(true);
    expect(bunInstall(name)).toBe(true);
  });
});

// ─── Multi-Language Frameworks ────────────────────────────────────────────────

describe("Python (FastAPI)", () => {
  test("scaffold", () => {
    const name = "t-python";
    allProjects.push(name);
    expect(scaffold(name, "--framework python")).toBe(true);
    expect(fileExists(name, "app/main.py")).toBe(true);
    expect(fileExists(name, "app/api/routes/auth.py")).toBe(true);
    expect(fileExists(name, "app/api/routes/health.py")).toBe(true);
    expect(fileExists(name, "requirements.txt")).toBe(true);
    expect(fileExists(name, "Dockerfile")).toBe(true);
    expect(fileExists(name, ".env")).toBe(true);
    expect(fileContains(name, "app/api/routes/auth.py", "register")).toBe(true);
    expect(fileContains(name, "app/api/routes/auth.py", "login")).toBe(true);
    expect(fileContains(name, "app/api/routes/health.py", "health")).toBe(true);
  });

  test("redis caching", () => {
    const name = "t-python-redis";
    allProjects.push(name);
    expect(scaffold(name, "--framework python --caching docker")).toBe(true);
    expect(fileExists(name, "app/core/redis.py")).toBe(true);
    expect(fileExists(name, "docker-compose.yml")).toBe(true);
    expect(fileContains(name, "requirements.txt", "redis")).toBe(true);
    expect(fileContains(name, ".env", "REDIS_URL")).toBe(true);
  });
});

describe("Go (Fiber)", () => {
  test("scaffold", () => {
    const name = "t-go";
    allProjects.push(name);
    expect(scaffold(name, "--framework go")).toBe(true);
    expect(fileExists(name, "cmd/api/main.go")).toBe(true);
    expect(fileExists(name, "go.mod")).toBe(true);
    expect(fileExists(name, "Dockerfile")).toBe(true);
    expect(fileExists(name, ".env")).toBe(true);
    expect(fileContains(name, "cmd/api/main.go", "register")).toBe(true);
    expect(fileContains(name, "cmd/api/main.go", "login")).toBe(true);
    expect(fileContains(name, "cmd/api/main.go", "health")).toBe(true);
  });

  test("redis caching", () => {
    const name = "t-go-redis";
    allProjects.push(name);
    expect(scaffold(name, "--framework go --caching docker")).toBe(true);
    expect(fileExists(name, "internal/cache/redis.go")).toBe(true);
    expect(fileExists(name, "docker-compose.yml")).toBe(true);
    expect(fileContains(name, "go.mod", "redis")).toBe(true);
    expect(fileContains(name, ".env", "REDIS_URL")).toBe(true);
  });
});

describe("Rust (Axum)", () => {
  test("scaffold", () => {
    const name = "t-rust";
    allProjects.push(name);
    expect(scaffold(name, "--framework rust")).toBe(true);
    expect(fileExists(name, "src/main.rs")).toBe(true);
    expect(fileExists(name, "Cargo.toml")).toBe(true);
    expect(fileExists(name, "Dockerfile")).toBe(true);
    expect(fileExists(name, ".env")).toBe(true);
    expect(fileContains(name, "src/main.rs", "register")).toBe(true);
    expect(fileContains(name, "src/main.rs", "login")).toBe(true);
    expect(fileContains(name, "src/main.rs", "health")).toBe(true);
  });

  test("redis caching", () => {
    const name = "t-rust-redis";
    allProjects.push(name);
    expect(scaffold(name, "--framework rust --caching docker")).toBe(true);
    expect(fileExists(name, "src/cache/redis.rs")).toBe(true);
    expect(fileExists(name, "docker-compose.yml")).toBe(true);
    expect(fileContains(name, "Cargo.toml", "redis")).toBe(true);
    expect(fileContains(name, ".env", "REDIS_URL")).toBe(true);
  });
});
