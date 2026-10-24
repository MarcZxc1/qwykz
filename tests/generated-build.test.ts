import { expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildScaffoldPlan, writePlan } from "../src/generator";
import type { ProjectOptions } from "../src/types";

const enabled = process.env.QWYKZ_RUN_GENERATED_BUILDS === "1";
const filter = process.env.QWYKZ_BUILD_FILTER;
const frameworks = ["express", "hono", "elysia", "react", "vue", "nextjs", "monorepo"];
if (enabled && filter && !frameworks.includes(filter)) throw new Error(`Unknown build filter: ${filter}`);

async function run(cmd: string[], cwd: string) {
  const child = Bun.spawn({
    cmd, cwd, stdout: "pipe", stderr: "pipe",
    env: {
      ...process.env,
      NEXT_TELEMETRY_DISABLED: "1",
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/build_check",
      JWT_SECRET: "build-check-placeholder-not-a-deployed-secret",
      NEXT_PUBLIC_SUPABASE_URL: "https://build-check.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "build-check-placeholder",
      SUPABASE_URL: "https://build-check.supabase.co",
      SUPABASE_ANON_KEY: "build-check-placeholder",
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: `pk_test_${btoa("build-check.clerk.accounts.dev$")}`,
    },
  });
  const timeout = setTimeout(() => child.kill(), 240_000);
  try {
    const [code, stdout, stderr] = await Promise.all([
      child.exited, new Response(child.stdout).text(), new Response(child.stderr).text(),
    ]);
    if (code !== 0) throw new Error(`${cmd.join(" ")} exited ${code}\n${stdout.slice(-8000)}\n${stderr.slice(-8000)}`);
  } finally {
    clearTimeout(timeout);
  }
}

for (const framework of frameworks) {
  for (const authTarget of ["local", "supabase", "clerk"] as const) {
    if (framework === "monorepo" && authTarget !== "local") continue;
    const runner = enabled && (!filter || filter === framework) ? test : test.skip;
    runner(`generated build: ${framework} with ${authTarget} auth installs, typechecks, and builds`, async () => {
      const root = await mkdtemp(join(tmpdir(), "qwykz-build-"));
      try {
        const options: ProjectOptions = {
          projectName: "build-check", framework, authTarget,
          dbTarget: "local", cachingTarget: "none",
          extraPackages: ["cors", "helmet", "zod"],
          ...(framework === "monorepo" ? { frontendFramework: "react", backendFramework: "hono" } : {}),
        };
        await writePlan(await buildScaffoldPlan(options), root);
        const project = join(root, options.projectName);
        await run(["bun", "install"], project);
        await run(["bun", "audit", "--audit-level=high"], project);
        // A second install must accept the lockfile produced by the first.
        await run(["bun", "install", "--frozen-lockfile"], project);
        if (framework === "hono" && authTarget === "clerk") {
          await run(["bun", "-e", `
            import { mock, expect } from "bun:test";
            import { Hono } from "hono";
            mock.module("@clerk/backend", () => ({ verifyToken: async (token) => {
              if (token === "invalid") throw new Error("Invalid token");
              return { sub: "test-user", role: token };
            } }));
            mock.module("./src/lib/prisma.ts", () => ({ prisma: { user: { findMany: async () => [] } } }));
            const { userRouter } = await import("./src/routes/user.routes.ts");
            const { errorHandler } = await import("./src/middlewares/error.middleware.ts");
            const app = new Hono().onError(errorHandler).route("/api/users", userRouter);
            for (const [token, status] of [[null, 401], ["invalid", 401], ["USER", 403], ["ADMIN", 200]]) {
              const response = await app.request("/api/users", { headers: token ? { authorization: "Bearer " + token } : {} });
              expect(response.status).toBe(status);
            }
          `], project);
        }
        if (framework === "elysia") {
          await run(["bun", "-e", `
            import { mock, expect } from "bun:test";
            import { Elysia } from "elysia";
            mock.module("./src/lib/prisma.ts", () => ({ prisma: { user: { findMany: async () => [] } } }));
            const { userRouter } = await import("./src/routes/user.routes.ts");
            const { errorHandler } = await import("./src/middlewares/error.middleware.ts");
            const app = new Elysia().onError(errorHandler).get("/api/health", () => "ok").use(userRouter);
            expect((await app.handle(new Request("http://localhost/api/health"))).status).toBe(200);
            expect((await app.handle(new Request("http://localhost/api/users/"))).status).toBe(401);
            ${authTarget === "local" ? `const { sign } = await import("jsonwebtoken");
            for (const [role, status] of [["USER", 403], ["ADMIN", 200]]) {
              const token = sign({ sub: "test-user", role }, process.env.JWT_SECRET);
              const response = await app.handle(new Request("http://localhost/api/users/", { headers: { authorization: "Bearer " + token } }));
              expect(response.status).toBe(status);
            }` : ""}
          `], project);
        }
        if (["express", "hono", "elysia", "nextjs"].includes(framework) && authTarget === "local") {
          // A profile created without local credentials must never reach the
          // password verifier or authenticate. Run in its own process so module
          // mocks cannot affect other generated applications.
          const next = framework === "nextjs";
          await run(["bun", "-e", `
            import { mock, expect } from "bun:test";
            mock.module(${JSON.stringify(next ? "./lib/prisma.ts" : "./src/lib/prisma.ts")}, () => ({
              prisma: { user: { findUnique: async () => ({ id: "profile", password: null }) } }
            }));
            const controller = await import(${JSON.stringify(next ? "./app/api/auth/login/route.ts" : "./src/controllers/auth.controller.ts")});
            const body = { email: "profile@example.com", password: "wrong-password" };
            ${next
              ? 'const response = await controller.POST(new Request("http://localhost/api/auth/login", { method: "POST", body: JSON.stringify(body) })); expect(response.status).toBe(401);'
              : `try {
                  await controller.login(${framework === "hono" ? '{ req: { json: async () => body } }' : '{ body }'});
                  throw new Error("Passwordless profile authenticated");
                } catch (error) { expect(error.statusCode).toBe(401); }`}
          `], project);
        }
        for (const relative of framework === "monorepo" ? ["backend", "frontend"] : [""]) {
          const cwd = join(project, relative);
          await run(["bun", "run", "--bun", framework === "vue" ? "vue-tsc" : "tsc", "--noEmit"], cwd);
          await run(["bun", "run", "build"], cwd);
          expect(await Bun.file(join(cwd, framework === "nextjs" ? ".next/BUILD_ID" : "dist/index.js")).exists() ||
            await Bun.file(join(cwd, "dist/index.html")).exists()).toBe(true);
        }
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    }, 600_000);
  }
}
