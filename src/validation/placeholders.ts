import type { ScaffoldPlan } from "../types";
import type { ValidationResult } from "./types";
import { getValidationPlans } from "./plans";

const INJECTION_TOKEN = /\{\{[A-Z][A-Z0-9_]*\}\}/g;

export async function validatePlaceholders(
  suppliedPlans?: ScaffoldPlan[],
): Promise<ValidationResult> {
  try {
    const plans = suppliedPlans ?? await getValidationPlans();
    const details: string[] = [];
    for (const plan of plans) {
      for (const file of plan.files) {
        const matches = file.content.match(INJECTION_TOKEN) ?? [];
        for (const token of matches) {
          details.push(`${plan.options.framework}: unresolved ${token} in ${file.path}`);
        }
      }
    }
    return {
      check: "Generated Output Placeholders",
      passed: details.length === 0,
      message: details.length === 0
        ? `No unresolved injection placeholders across ${plans.length} representative scaffolds`
        : `Found ${details.length} unresolved injection placeholders`,
      details,
    };
  } catch (error) {
    return {
      check: "Generated Output Placeholders",
      passed: false,
      message: `Could not generate validation scaffolds: ${error instanceof Error ? error.message : String(error)}`,
      details: [],
    };
  }
}
