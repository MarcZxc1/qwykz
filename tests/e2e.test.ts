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

test("E2E: Express with Docker Postgres", async () => {
  const projectName = "e2e-express";
  await rm(projectName, { recursive: true, force: true });

  console.log("Generating Express...");
  await run(`bun run src/index.ts -y --name ${projectName} --framework express --db docker`, process.cwd());
  
  const cwd = join(process.cwd(), projectName);
  
  console.log("Installing and booting DB...");
  await run("bun install", cwd);
  await run("docker compose up -d --wait", cwd);
  await run("bun run db:generate", cwd);
  await run("bun run db:push", cwd);

  console.log("Testing API...");
  const server = spawn("bun", ["dev"], { cwd, stdio: "ignore" });
  await new Promise(r => setTimeout(r, 2000));

  try {
    const res = await fetch("http://localhost:8000/api/health");
    expect(res.status).toBe(200);
  } finally {
    server.kill();
    await run("docker compose down -v", cwd);
    await rm(projectName, { recursive: true, force: true });
  }
}, 120000);

test("E2E: Laravel with Docker Postgres", async () => {
  const projectName = "e2e-laravel";
  await rm(projectName, { recursive: true, force: true });

  console.log("Generating Laravel...");
  await run(`bun run src/index.ts -y --name ${projectName} --framework laravel --db docker`, process.cwd());
  
  const cwd = join(process.cwd(), projectName);
  
  console.log("Booting DB and migrating...");
  await run("docker compose up -d --wait", cwd);
  await run("php artisan key:generate", cwd);
  await run("php artisan migrate --force", cwd);

  console.log("Testing API...");
  const server = spawn("php", ["artisan", "serve"], { cwd, stdio: "ignore" });
  
  await new Promise(r => setTimeout(r, 3000));

  try {
    const res = await fetch("http://localhost:8000/api/health");
    expect(res.status).toBe(200);

    const authRes = await fetch("http://localhost:8000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ name: "Test", email: "test2@example.com", password: "password123" })
    });
    expect(authRes.status).toBe(201);
  } finally {
    server.kill();
    await run("docker compose down -v", cwd);
    await rm(projectName, { recursive: true, force: true });
  }
}, 120000);
