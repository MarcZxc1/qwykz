import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEMPLATES_DIR = join(__dirname, "..", "templates");

/**
 * Detect if we're running inside a Bun compiled binary.
 * In compiled mode, import.meta.url starts with "file:///$bunfs/"
 */
const IS_COMPILED = __dirname.startsWith("/$bunfs");

/**
 * Read a template file from the templates/ directory.
 * Uses Bun.file(path).text() for fast reads.
 * Throws a clear, specific error if the file doesn't exist.
 */
export async function readTemplate(relativePath: string): Promise<string> {
  // In compiled binary mode, use the embedded templates
  if (IS_COMPILED) {
    const embedded = EMBEDDED_TEMPLATES[relativePath];
    if (!embedded) {
      throw new Error(
        `Template file not found: "${relativePath}"\n` +
          `  This template was not embedded in the compiled binary.\n` +
          `  Rebuild the binary with: bun run build:bin`,
      );
    }
    return embedded;
  }

  // In development mode, read from filesystem
  const fullPath = join(TEMPLATES_DIR, relativePath);
  const file = Bun.file(fullPath);

  if (!(await file.exists())) {
    throw new Error(
      `Template file not found: "${relativePath}"\n` +
        `  Expected at: ${fullPath}\n` +
        `  Ensure the templates/ directory is intact and the CLI was installed correctly.`,
    );
  }

  return file.text();
}

/**
 * Replace `{{PLACEHOLDER}}` tokens in template text with provided variables.
 *
 * - Matches tokens like `{{PROJECT_NAME}}`, `{{EXTRA_IMPORTS}}`, etc.
 * - If a placeholder has no matching key in `variables`, throws an error
 *   naming the missing key rather than leaving the literal placeholder.
 * - Variables may resolve to an empty string (e.g. for optional sections).
 */
export function injectVariables(
  templateText: string,
  variables: Record<string, string>,
): string {
  return templateText.replace(
    /\{\{([A-Z][A-Z0-9_]*)\}\}/g,
    (_match, key: string) => {
      if (!(key in variables)) {
        throw new Error(
          `Missing template variable: "{{${key}}}". ` +
            `Provided variables: [${Object.keys(variables).join(", ")}]`,
        );
      }
      return variables[key]!;
    },
  );
}

/**
 * Embedded templates for compiled binary mode.
 * This map is populated at build time by the embed-templates script.
 * In development mode, this is empty and templates are read from disk.
 */
const EMBEDDED_TEMPLATES: Record<string, string> = {};
