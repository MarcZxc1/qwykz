import { CAPABILITY_MATRIX } from "../capability/matrix";
import type { ScaffoldPlan } from "../types";
import type { ValidationResult } from "./types";
import { getValidationPlans } from "./plans";

const BUILT_IN_FRAMEWORKS = [
  "express", "hono", "elysia", "nextjs", "react", "vue",
  "python", "go", "rust", "laravel",
];

export async function validatePromptMapping(
  suppliedPlans?: ScaffoldPlan[],
): Promise<ValidationResult> {
  const plans = suppliedPlans ?? await getValidationPlans();
  const details: string[] = [];
  for (const framework of BUILT_IN_FRAMEWORKS) {
    const capabilities = CAPABILITY_MATRIX.matrix[framework];
    if (!capabilities) {
      details.push(`Prompt framework ${framework} has no capability entry`);
      continue;
    }
    if (!Object.keys(capabilities.dbTargets).length || !Object.keys(capabilities.authTargets).length || !Object.keys(capabilities.cachingTargets).length) {
      details.push(`Capability entry ${framework} has an empty target dimension`);
    }
  }

  const generatedFrameworks = new Set(plans.map((plan) => plan.options.framework));
  for (const framework of ["express", "hono", "elysia", "react", "vue", "python", "go", "rust"]) {
    if (!generatedFrameworks.has(framework)) details.push(`No representative scaffold generated for ${framework}`);
  }

  return {
    check: "Prompt And Capability Mapping",
    passed: details.length === 0,
    message: details.length === 0 ? "Every built-in prompt framework maps to a capability contract" : `Found ${details.length} mapping gaps`,
    details,
  };
}
