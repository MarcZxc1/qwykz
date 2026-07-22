import type { ScaffoldPlan } from "../types";
import type { ValidationResult } from "./types";
import { getValidationPlans } from "./plans";

const IMPORT_PATTERN = /(?:from\s+|import\s*\(|require\s*\()\s*["']([^"']+)["']/g;

function packageName(specifier: string): string | undefined {
  if (specifier.startsWith(".") || specifier.startsWith("/") || specifier.startsWith("node:") || specifier.startsWith("bun:")) return;
  if (specifier.startsWith("@/")) return;
  const parts = specifier.split("/");
  return specifier.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
}

export async function validateImports(
  suppliedPlans?: ScaffoldPlan[],
): Promise<ValidationResult> {
  const plans = suppliedPlans ?? await getValidationPlans();
  const details: string[] = [];

  for (const plan of plans) {
    const declared = new Set(plan.packageAudit.map((entry) => entry.name));
    for (const file of plan.files.filter((candidate) => /\.(?:ts|tsx|js|jsx|vue)$/.test(candidate.path))) {
      for (const match of file.content.matchAll(IMPORT_PATTERN)) {
        const dependency = packageName(match[1]!);
        if (dependency && !declared.has(dependency)) {
          details.push(`${plan.options.framework}: ${file.path} imports undeclared package ${dependency}`);
        }
      }
    }
  }

  return {
    check: "Import And Package Alignment",
    passed: details.length === 0,
    message: details.length === 0
      ? `All external imports are declared across ${plans.length} representative scaffolds`
      : `Found ${details.length} undeclared imports`,
    details,
  };
}
