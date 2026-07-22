import { describe, it, expect } from 'bun:test';
import { validateSyntax } from '../src/validation/syntax';
import { validatePlaceholders } from '../src/validation/placeholders';
import { validateImports } from '../src/validation/imports';
import type { ScaffoldPlan } from '../src/types';

function plan(content: string): ScaffoldPlan {
  return {
    projectName: 'validation-test',
    options: {
      projectName: 'validation-test',
      framework: 'express',
      dbTarget: 'local',
      authTarget: 'local',
      cachingTarget: 'none',
      extraPackages: [],
    },
    files: [{ path: 'src/index.ts', content }],
    packageAudit: [],
    generatedAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('template validation', () => {
  it('syntax check passes on existing templates', async () => {
    const result = await validateSyntax();
    expect(result.passed).toBe(true);
  });

  it('placeholder check passes generated scaffolds', async () => {
    const result = await validatePlaceholders();
    expect(result.passed).toBe(true);
  });

  it('placeholder check fails on unresolved injection tokens', async () => {
    const result = await validatePlaceholders([plan('const value = "{{MISSING_VALUE}}";')]);
    expect(result.passed).toBe(false);
    expect(result.details?.[0]).toContain('MISSING_VALUE');
  });

  it('import alignment fails on undeclared packages', async () => {
    const result = await validateImports([plan('import value from "missing-package";')]);
    expect(result.passed).toBe(false);
    expect(result.details?.[0]).toContain('missing-package');
  });
});
