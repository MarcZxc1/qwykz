import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { ValidationResult } from './types';

function getAllFiles(dir: string, fileList: string[] = []): string[] {
  const files = readdirSync(dir);
  for (const file of files) {
    const path = join(dir, file);
    if (statSync(path).isDirectory()) {
      getAllFiles(path, fileList);
    } else {
      fileList.push(path);
    }
  }
  return fileList;
}

/**
 * Files that use framework template syntax (Vue `{{ expr }}`, React `{{...}}`)
 * rather than qwykz injection variables — skip SCREAMING_CASE check for these.
 *
 * Heuristic: Vue stubs (.vue.stub), React/JSX stubs (.tsx.stub), and Rust source
 * files (which can contain `}}` in format strings).
 */
function isFrameworkTemplateFile(filePath: string): boolean {
  return (
    filePath.endsWith('.vue.stub') ||
    filePath.endsWith('.tsx.stub') ||
    filePath.endsWith('.jsx.stub') ||
    filePath.endsWith('.rs') // Rust format strings can have {{ and }}
  );
}

export async function validateSyntax(): Promise<ValidationResult> {
  const templatesDir = join(process.cwd(), 'templates');
  let allFiles: string[] = [];
  try {
    allFiles = getAllFiles(templatesDir);
  } catch (e) {
    return {
      check: 'Template Syntax',
      passed: false,
      message: `Failed to read templates directory: ${e}`,
      details: []
    };
  }

  const details: string[] = [];
  let passed = true;

  for (const file of allFiles) {
    const content = readFileSync(file, 'utf-8');
    const isFramework = isFrameworkTemplateFile(file);

    // For non-framework files, check that {{ are properly matched
    if (!isFramework) {
      const openBraces = (content.match(/\{\{/g) || []).length;
      const closeBraces = (content.match(/\}\}/g) || []).length;

      if (openBraces !== closeBraces) {
        passed = false;
        details.push(`Mismatched braces in ${file}: ${openBraces} open, ${closeBraces} close`);
      }

      // For non-framework files, any {{...}} must be a qwykz injection variable
      const matches = content.match(/\{\{([^{}]+)\}\}/g);
      if (matches) {
        for (const match of matches) {
          const variable = match.slice(2, -2).trim();
          if (!/^[A-Z][A-Z0-9_]*$/.test(variable)) {
            passed = false;
            details.push(`Invalid injection variable ${match} in ${file.replace(process.cwd(), '')} (must be SCREAMING_SNAKE_CASE)`);
          }
        }
      }
    }
  }

  return {
    check: 'Template Syntax',
    passed,
    message: passed
      ? `All templates have valid syntax (checked ${allFiles.filter(f => !isFrameworkTemplateFile(f)).length} non-framework files)`
      : 'Found syntax errors in templates',
    details
  };
}
