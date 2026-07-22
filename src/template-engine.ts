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

export function readEmbeddedTemplate(
  templates: Record<string, string>,
  relativePath: string,
): string {
  const embedded = templates[relativePath];
  // Empty files (for example Python __init__.py) are valid templates. Only an
  // absent map entry means the binary failed to embed the template.
  if (embedded === undefined) {
    throw new Error(
      `Template file not found: "${relativePath}"\n` +
        `  This template was not embedded in the compiled binary.\n` +
        `  Rebuild the binary with: bun run build:bin`,
    );
  }
  return embedded;
}

/**
 * Read a template file from the templates/ directory.
 * Uses Bun.file(path).text() for fast reads.
 * Throws a clear, specific error if the file doesn't exist.
 */
export async function readTemplate(relativePath: string, pluginTemplateDir?: string): Promise<string> {
  // If reading from a plugin, bypass the compiled embedded templates
  if (pluginTemplateDir) {
    const fullPath = join(pluginTemplateDir, relativePath);
    const file = Bun.file(fullPath);
    if (!(await file.exists())) {
      throw new Error(`Plugin template file not found: "${relativePath}" at ${fullPath}`);
    }
    return file.text();
  }

  // In compiled binary mode, use the embedded templates
  if (IS_COMPILED) {
    return readEmbeddedTemplate(EMBEDDED_TEMPLATES, relativePath);
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

import { readdirSync, statSync } from "node:fs";

export function getTemplatesInDirectory(dirPrefix: string, pluginTemplateDir?: string): string[] {
  if (pluginTemplateDir) {
    const results: string[] = [];
    // Here dirPrefix is expected to be a subpath within the plugin's templateDir, or empty to scan the whole capability templateDir
    const fullDir = join(pluginTemplateDir, dirPrefix);

    if (!require("node:fs").existsSync(fullDir)) return [];

    function walkPlugin(dir: string) {
      for (const entry of readdirSync(dir)) {
        const fullPath = join(dir, entry);
        if (statSync(fullPath).isDirectory()) {
          walkPlugin(fullPath);
        } else {
          // relativePath is the path relative to the plugin's base templateDir,
          // keeping the dirPrefix so it mirrors how core templates are returned
          let rel = fullPath.replace(pluginTemplateDir + "/", "").replace(/\\/g, "/");
          results.push(rel);
        }
      }
    }
    walkPlugin(fullDir);
    return results;
  }

  if (IS_COMPILED) {
    const prefix = dirPrefix.endsWith("/") ? dirPrefix : dirPrefix + "/";
    return Object.keys(EMBEDDED_TEMPLATES).filter(k => k.startsWith(prefix));
  } else {
    const fullDir = join(TEMPLATES_DIR, dirPrefix);
    const results: string[] = [];
    function walk(dir: string, baseDir: string) {
      for (const entry of readdirSync(dir)) {
        const fullPath = join(dir, entry);
        if (statSync(fullPath).isDirectory()) {
          walk(fullPath, baseDir);
        } else {
          // ensure we use forward slashes for the relative path
          const relativePath = (dirPrefix + "/" + fullPath.replace(baseDir + "/", "")).replace(/\\/g, "/");
          results.push(relativePath);
        }
      }
    }
    walk(fullDir, fullDir);
    return results.map(p => p.replace(/\\/g, "/").replace(/\/+/g, "/"));
  }
}
