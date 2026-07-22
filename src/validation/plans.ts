import { buildScaffoldPlan } from "../generator";
import type { ProjectOptions, ScaffoldPlan } from "../types";

const REPRESENTATIVE_OPTIONS: ProjectOptions[] = [
  options("express", { dbTarget: "local", authTarget: "local", cachingTarget: "none" }),
  options("hono", { dbTarget: "docker", authTarget: "local", cachingTarget: "docker" }),
  options("elysia", { dbTarget: "supabase", authTarget: "local", cachingTarget: "upstash" }),
  options("react", { authTarget: "supabase" }),
  options("vue", { authTarget: "clerk" }),
  options("python"),
  options("go", { dbTarget: "docker", cachingTarget: "docker" }),
  options("rust"),
];

function options(
  framework: ProjectOptions["framework"],
  overrides: Partial<ProjectOptions> = {},
): ProjectOptions {
  return {
    framework,
    projectName: `validate-${framework}`,
    dbTarget: "local",
    authTarget: "local",
    cachingTarget: "none",
    extraPackages: [],
    dbPort: 55432,
    redisPort: 56379,
    ...overrides,
  };
}

let plansPromise: Promise<ScaffoldPlan[]> | undefined;

export function getValidationPlans(): Promise<ScaffoldPlan[]> {
  plansPromise ??= Promise.all(REPRESENTATIVE_OPTIONS.map((item) => buildScaffoldPlan(item)));
  return plansPromise;
}
