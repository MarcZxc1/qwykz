import { describe, it, expect } from "bun:test";
import { generateContextPack } from "../src/context-pack";
import type { ProjectOptions } from "../src/types";

function makeOptions(overrides: Partial<ProjectOptions> = {}): ProjectOptions {
  return {
    framework: "express",
    projectName: "test-project",
    dbTarget: "docker",
    authTarget: "local",
    cachingTarget: "none",
    extraPackages: [],
    dbPort: 54320,
    redisPort: 63790,
    ...overrides,
  };
}

describe("generateContextPack", () => {
  it("produces AGENTS.md with stack section for express", () => {
    const md = generateContextPack(makeOptions());
    expect(md).toContain("# AGENTS.md");
    expect(md).toContain("express");
    expect(md).toContain("## Stack");
    expect(md).toContain("## Commands");
    expect(md).toContain("## Auth Model");
    expect(md).toContain("## Environment Variables");
  });

  it("includes JWT auth section for local auth", () => {
    const md = generateContextPack(makeOptions({ authTarget: "local" }));
    expect(md).toContain("POST");
    expect(md).toContain("/api/auth/register");
    expect(md).toContain("JWT");
  });

  it("includes Supabase auth section for supabase auth", () => {
    const md = generateContextPack(
      makeOptions({ authTarget: "supabase", dbTarget: "supabase" }),
    );
    expect(md).toContain("Supabase Auth");
    expect(md).toContain("Status: experimental");
    expect(md).not.toContain("Supabase Admin SDK");
    expect(md).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(md).toContain("SUPABASE_URL");
  });

  it("does not duplicate the development command", () => {
    const md = generateContextPack(makeOptions());
    expect(md.match(/\| `bun run dev` \|/g)).toHaveLength(1);
  });

  it("includes Clerk auth section for clerk auth", () => {
    const md = generateContextPack(makeOptions({ authTarget: "clerk" }));
    expect(md).toContain("Clerk Auth");
    expect(md).toContain("CLERK_PUBLISHABLE_KEY");
  });

  it("generates context for hono framework", () => {
    const md = generateContextPack(makeOptions({ framework: "hono" }));
    expect(md).toContain("hono");
    expect(md).toContain("## Commands");
  });

  it("generates context for elysia framework", () => {
    const md = generateContextPack(makeOptions({ framework: "elysia" }));
    expect(md).toContain("Elysia app");
  });

  it("generates context for laravel framework", () => {
    const md = generateContextPack(makeOptions({ framework: "laravel" }));
    expect(md).toContain("Eloquent");
  });

  it("generates context for python framework", () => {
    const md = generateContextPack(makeOptions({ framework: "python" }));
    expect(md).toContain("FastAPI");
  });

  it("generates context for go framework", () => {
    const md = generateContextPack(makeOptions({ framework: "go" }));
    expect(md).toContain("go mod tidy");
  });

  it("generates context for rust framework", () => {
    const md = generateContextPack(makeOptions({ framework: "rust" }));
    expect(md).toContain("cargo");
  });

  it("generates context for nextjs framework", () => {
    const md = generateContextPack(makeOptions({ framework: "nextjs" }));
    expect(md).toContain("nextjs");
    expect(md).toContain("page.tsx");
    expect(md).toContain("Prisma");
  });

  it("generates context for react framework", () => {
    const md = generateContextPack(makeOptions({ framework: "react" }));
    expect(md).toContain("main.tsx");
  });

  it("generates context for vue framework", () => {
    const md = generateContextPack(makeOptions({ framework: "vue" }));
    expect(md).toContain("main.ts");
  });

  it("generates monorepo context with both frontend and backend info", () => {
    const md = generateContextPack(
      makeOptions({
        framework: "monorepo",
        frontendFramework: "react",
        backendFramework: "express",
      }),
    );
    expect(md).toContain("monorepo");
    expect(md).toContain("backend");
    expect(md).toContain("frontend");
  });

  it("shows docker compose command when dbTarget is docker", () => {
    const md = generateContextPack(
      makeOptions({ dbTarget: "docker" }),
    );
    expect(md).toContain("docker compose");
  });

  it("includes Redis env vars for upstash caching", () => {
    const md = generateContextPack(
      makeOptions({ cachingTarget: "upstash" }),
    );
    expect(md).toContain("UPSTASH_REDIS_REST_URL");
  });
});
