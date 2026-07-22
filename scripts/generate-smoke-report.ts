#!/usr/bin/env bun
const inputPath = Bun.argv[2];
const outputPath = Bun.argv[3] ?? "runtime-smoke-report.md";
if (!inputPath) throw new Error("Usage: generate-smoke-report.ts <test-log> [output-file]");

const log = await Bun.file(inputPath).text();
const passed = (log.match(/^\(pass\)/gm) ?? []).length;
const failed = (log.match(/^\(fail\)/gm) ?? []).length;
const skipped = (log.match(/^\(skip\)/gm) ?? []).length;
const generatedAt = new Date().toISOString();

const report = `# Runtime Smoke Report

Generated: ${generatedAt}

| Result | Count |
|---|---:|
| Passed | ${passed} |
| Failed | ${failed} |
| Skipped | ${skipped} |

This report was generated from the Bun runtime-smoke test log. The workflow retains the raw log as an artifact for diagnosis.
`;

await Bun.write(outputPath, report);
console.log(`Generated ${outputPath}`);
