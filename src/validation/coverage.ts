import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ValidationResult } from "./types";

export async function validateCoverage(): Promise<ValidationResult> {
  const testSources = ["tests/full-matrix.test.ts", "tests/runtime-smoke.test.ts"]
    .map((path) => readFileSync(join(process.cwd(), path), "utf8"))
    .join("\n");
  const details: string[] = [];
  for (const framework of ["express", "hono", "elysia", "nextjs", "react", "vue", "python", "go", "rust", "laravel"]) {
    if (!testSources.includes(framework)) details.push(`No matrix or runtime coverage reference for ${framework}`);
  }
  return {
    check: "Stack Coverage Completeness",
    passed: details.length === 0,
    message: details.length === 0 ? "Every built-in framework is represented in matrix/runtime tests" : `Found ${details.length} coverage gaps`,
    details,
  };
}
