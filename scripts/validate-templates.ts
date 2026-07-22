#!/usr/bin/env bun
import { runValidation } from '../src/validation/index';
import pc from 'picocolors';

const report = await runValidation();

for (const result of report.results) {
  const icon = result.passed ? pc.green('✅') : pc.red('❌');
  console.log(`${icon} ${result.check}: ${result.message}`);
  if (result.details && result.details.length > 0) {
    for (const detail of result.details) {
      console.log(pc.dim(`   ${detail}`));
    }
  }
}

console.log();
console.log(`Passed: ${report.passed}  Failed: ${report.failed}`);

if (report.failed > 0) {
  process.exit(1);
}
