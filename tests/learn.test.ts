import { describe, expect, it } from "bun:test";
import { generateLearnGuide } from "../src/learn/learn-guide";
import { generateHandsOnGuide } from "../src/learn/hands-on-guide";
import { buildScaffoldPlan } from "../src/generator";
import type { ProjectOptions } from "../src/types";

function makeOptions(overrides: Partial<ProjectOptions> = {}): ProjectOptions {
  return {
    framework: "hono",
    projectName: "edu-hono-app",
    dbTarget: "docker",
    authTarget: "local",
    cachingTarget: "none",
    extraPackages: ["zod"],
    dbPort: 54321,
    redisPort: 63791,
    ...overrides,
  };
}

describe("Educational Scaffolding & LEARN.md", () => {
  it("generates a comprehensive LEARN.md for standard boilerplate", () => {
    const options = makeOptions({ framework: "hono" });
    const content = generateLearnGuide(options);

    expect(content).toContain("# Architecture & Codebase Guide: edu-hono-app");
    expect(content).toContain("## 1. The Starting Point");
    expect(content).toContain("src/index.ts");
    expect(content).toContain("## 2. How to Make It Functional");
    expect(content).toContain("## 3. Request Flow & Mental Model");
    expect(content).toContain("## 4. Syntax & Methods Reference");
    expect(content).toContain("new Hono()");
    expect(content).toContain("c.json(");
    expect(content).toContain("## 5. How to Extend This Codebase");
    expect(content).toContain("Adding a New Route");
  });

  it("tailors syntax and methods reference for Express", () => {
    const options = makeOptions({ framework: "express" });
    const content = generateLearnGuide(options);

    expect(content).toContain("express.Router()");
    expect(content).toContain("res.status(");
    expect(content).toContain("next(err)");
  });

  it("tailors syntax and methods reference for Rust Axum", () => {
    const options = makeOptions({ framework: "rust" });
    const content = generateLearnGuide(options);

    expect(content).toContain("src/main.rs");
    expect(content).toContain("Router::new()");
    expect(content).toContain("Arc<AppState>");
    expect(content).toContain("sqlx");
  });

  it("tailors syntax and methods reference for Go Fiber", () => {
    const options = makeOptions({ framework: "go" });
    const content = generateLearnGuide(options);

    expect(content).toContain("cmd/api/main.go");
    expect(content).toContain("fiber.New()");
    expect(content).toContain("c.Locals(");
    expect(content).toContain("c.Status(");
  });

  it("tailors syntax and methods reference for Python FastAPI", () => {
    const options = makeOptions({ framework: "python" });
    const content = generateLearnGuide(options);

    expect(content).toContain("app/main.py");
    expect(content).toContain("FastAPI()");
    expect(content).toContain("APIRouter()");
    expect(content).toContain("Depends(");
  });

  it("tailors syntax and methods reference for Next.js", () => {
    const options = makeOptions({ framework: "nextjs" });
    const content = generateLearnGuide(options);

    expect(content).toContain("app/page.tsx");
    expect(content).toContain("Route Handlers");
    expect(content).toContain("Server Component");
  });

  it("tailors syntax and methods reference for frontend SPA (React/Vue)", () => {
    const reactContent = generateLearnGuide(makeOptions({ framework: "react" }));
    expect(reactContent).toContain("src/main.tsx");
    expect(reactContent).toContain("Vite");

    const vueContent = generateLearnGuide(makeOptions({ framework: "vue" }));
    expect(vueContent).toContain("src/main.ts");
    expect(vueContent).toContain("Vite");
  });
});

describe("Hands-On Learn Mode (--learn & GUIDE.md)", () => {
  it("generates a feature-based GUIDE.md without spoon-feeding", () => {
    const options = makeOptions({ framework: "hono", learn: true });
    const content = generateHandsOnGuide(options);

    expect(content).toContain("# Hands-On Developer Guide: Build edu-hono-app from Scratch");
    expect(content).toContain("--learn");
    expect(content).toContain("Not spoon-feeding");
    expect(content).toContain("Milestone 1: Project Initialization & Tooling");
    expect(content).toContain("Milestone 2: Server Entry Point & Health Route");
    expect(content).toContain("Milestone 3: Database Connection & Schema Definition");
    expect(content).toContain("Milestone 4: Core CRUD Feature");
    expect(content).toContain("Milestone 5: Input Validation & Error Boundaries");
    expect(content).toContain("Milestone 6: Authentication & Protected Routes");
    expect(content).toContain("Key Methods & APIs to Use");
    expect(content).toContain("Verification Command");
  });

  it("integrates LEARN.md into standard scaffold plan", async () => {
    const plan = await buildScaffoldPlan(makeOptions({ framework: "hono", learn: false }));
    const learnFile = plan.files.find((f) => f.path === "LEARN.md");
    expect(learnFile).toBeDefined();
    expect(learnFile?.content).toContain("Architecture & Codebase Guide");

    // Standard mode contains full boilerplate
    const hasUserController = plan.files.some((f) => f.path.includes("user.controller"));
    expect(hasUserController).toBe(true);
  });

  it("integrates GUIDE.md and strips boilerplate in --learn mode", async () => {
    const plan = await buildScaffoldPlan(makeOptions({ framework: "hono", learn: true }));
    
    // Includes both GUIDE.md and LEARN.md
    const guideFile = plan.files.find((f) => f.path === "GUIDE.md");
    expect(guideFile).toBeDefined();
    expect(guideFile?.content).toContain("Hands-On Developer Guide");

    const learnFile = plan.files.find((f) => f.path === "LEARN.md");
    expect(learnFile).toBeDefined();

    // Strips finished controller and route boilerplate files
    const hasUserController = plan.files.some((f) => f.path === "src/controllers/user.controller.ts");
    const hasUserRoutes = plan.files.some((f) => f.path === "src/routes/user.routes.ts");
    const hasAuthRoutes = plan.files.some((f) => f.path === "src/routes/auth.routes.ts");
    expect(hasUserController).toBe(false);
    expect(hasUserRoutes).toBe(false);
    expect(hasAuthRoutes).toBe(false);

    // Retains config, env, and minimal entry file
    const hasPackageJson = plan.files.some((f) => f.path === "package.json");
    const hasEnv = plan.files.some((f) => f.path === ".env");
    const entryFile = plan.files.find((f) => f.path === "src/index.ts");
    expect(hasPackageJson).toBe(true);
    expect(hasEnv).toBe(true);
    expect(entryFile).toBeDefined();
    expect(entryFile?.content).toContain("GUIDE.md");

    // Preserves directories via .gitkeep
    const hasControllersKeep = plan.files.some((f) => f.path === "src/controllers/.gitkeep");
    expect(hasControllersKeep).toBe(true);
  });

  it("handles Rust Axum in --learn mode", async () => {
    const plan = await buildScaffoldPlan(makeOptions({ framework: "rust", learn: true }));
    const guideFile = plan.files.find((f) => f.path === "GUIDE.md");
    expect(guideFile).toBeDefined();
    expect(guideFile?.content).toContain("Rust (Axum)");

    const mainFile = plan.files.find((f) => f.path === "src/main.rs");
    expect(mainFile).toBeDefined();
    expect(mainFile?.content).toContain("GUIDE.md");

    // Finished routes stripped
    const hasHealthApi = plan.files.some((f) => f.path === "src/api/health.rs");
    expect(hasHealthApi).toBe(false);
  });

  it("handles Go Fiber in --learn mode", async () => {
    const plan = await buildScaffoldPlan(makeOptions({ framework: "go", learn: true }));
    const guideFile = plan.files.find((f) => f.path === "GUIDE.md");
    expect(guideFile).toBeDefined();
    expect(guideFile?.content).toContain("Go (Fiber)");

    const mainFile = plan.files.find((f) => f.path === "cmd/api/main.go");
    expect(mainFile).toBeDefined();
    expect(mainFile?.content).toContain("GUIDE.md");

    // Handlers stripped
    const hasUserHandler = plan.files.some((f) => f.path === "internal/handlers/user.go");
    expect(hasUserHandler).toBe(false);
  });

  it("records learn: true in .qwykz-manifest.json", async () => {
    const plan = await buildScaffoldPlan(makeOptions({ framework: "hono", learn: true }));
    const manifestFile = plan.files.find((f) => f.path === ".qwykz-manifest.json");
    expect(manifestFile).toBeDefined();
    const manifest = JSON.parse(manifestFile!.content);
    expect(manifest.scaffold.learn).toBe(true);
  });
});

