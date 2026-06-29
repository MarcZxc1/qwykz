import { test, expect } from "bun:test";
import { spawn } from "node:child_process";
import { rm } from "node:fs/promises";
import { join } from "node:path";

async function run(cmd: string, cwd: string) {
  return new Promise((resolve, reject) => {
    let stderr = "";
    const proc = spawn("bash", ["-c", cmd], { cwd });
    proc.stderr.on("data", d => stderr += d.toString());
    proc.on("close", (code) => (code === 0 ? resolve(true) : reject(new Error(`Command failed: ${cmd}\n${stderr}`))));
  });
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
    await run("bun install", cwd);
    await run("docker compose up -d --wait", cwd);
    await run("bun run db:generate", cwd);
    await run("bun run db:push", cwd);

    const server = spawn("bun", ["dev"], { cwd, stdio: "ignore" });

    await waitForServer("http://127.0.0.1:3000/api/health");
    const res = await fetch("http://127.0.0.1:3000/api/health");
    expect(res.status).toBe(200);

    const authRes = await fetch("http://127.0.0.1:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test", email: "test@example.com", password: "password123" })
    });
    expect(authRes.status).toBe(201);
    server.kill();
  } finally {
    await run("docker compose down -v", cwd).catch(() => {});
    await rm(projectName, { recursive: true, force: true }).catch(() => {});
  }
}, 120000);

test("E2E: Laravel with Docker Postgres", async () => {
  const projectName = "e2e-laravel";
  await rm(projectName, { recursive: true, force: true });
  const cwd = join(process.cwd(), projectName);

  try {
    await run(`bun run src/index.ts -y --name ${projectName} --framework laravel --db docker`, process.cwd());
    await run("docker compose up -d --wait", cwd);
    await run("php artisan key:generate", cwd);
    await new Promise(r => setTimeout(r, 3000)); // Wait for DB init
    await run("php artisan migrate --force", cwd);

    const server = spawn("php", ["artisan", "serve"], { cwd, stdio: "ignore" });

    await waitForServer("http://127.0.0.1:8000/api/health");
    const res = await fetch("http://127.0.0.1:8000/api/health");
    expect(res.status).toBe(200);

    const authRes = await fetch("http://127.0.0.1:8000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ name: "Test", email: "test2@example.com", password: "password123" })
    });
    expect(authRes.status).toBe(201);
    server.kill();
  } finally {
    await run("docker compose down -v", cwd).catch(() => {});
    await rm(projectName, { recursive: true, force: true }).catch(() => {});
  }
}, 120000);

test("E2E: Next.js with Docker Postgres", async () => {
  const projectName = "e2e-nextjs";
  await rm(projectName, { recursive: true, force: true });
  const cwd = join(process.cwd(), projectName);

  try {
    await run(`bun run src/index.ts -y --name ${projectName} --framework nextjs --db docker`, process.cwd());
    await run("bun install", cwd);
    await run("docker compose up -d --wait", cwd);
    await new Promise(r => setTimeout(r, 3000)); // Wait for DB init
    await run("bun run db:generate", cwd);
    await run("bun run db:push", cwd);

    const server = spawn("bun", ["dev"], { cwd, stdio: "ignore" });

    await waitForServer("http://127.0.0.1:3000/api/health");
    const res = await fetch("http://127.0.0.1:3000/api/health");
    expect(res.status).toBe(200);

    const authRes = await fetch("http://127.0.0.1:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test Next", email: "next@example.com", password: "password123" })
    });
    expect(authRes.status).toBe(201);
    server.kill();
  } finally {
    await run("docker compose down -v", cwd).catch(() => {});
    await rm(projectName, { recursive: true, force: true }).catch(() => {});
  }
}, 180000);

test("E2E: React with Vite Build", async () => {
  const projectName = "e2e-react";
  await rm(projectName, { recursive: true, force: true });
  const cwd = join(process.cwd(), projectName);

  try {
    await run(`bun run src/index.ts -y --name ${projectName} --framework react`, process.cwd());
    await run("bun install", cwd);
    await run("bun run build", cwd);
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
    await run("bun install", cwd);
    await run("bun run build", cwd);
  } finally {
    await rm(projectName, { recursive: true, force: true }).catch(() => {});
  }
}, 180000);
