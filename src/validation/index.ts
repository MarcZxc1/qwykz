import { validatePlaceholders } from './placeholders';
import { validateSyntax } from './syntax';
import { validateImports } from './imports';
import { validatePromptMapping } from './prompt-mapping';
import { validateCoverage } from './coverage';
import { getValidationPlans } from './plans';
import type { ValidationReport } from './types';

export async function runValidation(): Promise<ValidationReport> {
  const plans = await getValidationPlans();
  const syntaxResult = await validateSyntax();
  const placeholdersResult = await validatePlaceholders(plans);
  const importsResult = await validateImports(plans);
  const promptMappingResult = await validatePromptMapping(plans);
  const coverageResult = await validateCoverage();

  const results = [syntaxResult, placeholdersResult, importsResult, promptMappingResult, coverageResult];
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  return {
    results,
    passed,
    failed,
    warnings: 0,
    timestamp: new Date().toISOString()
  };
}

export { validatePlaceholders, validateSyntax, validateImports, validatePromptMapping, validateCoverage };
export type { ValidationResult, ValidationReport } from './types';
