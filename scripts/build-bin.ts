/**
 * Build script: reads all template files from templates/mvc/ and
 * generates a build-ready version of template-engine.ts with the
 * templates embedded as string literals. Then compiles the CLI binary.
 */
import { join, relative } from "node:path";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";

const ROOT = join(import.meta.dirname!, "..");
const TEMPLATES_DIR = join(ROOT, "templates");
const ENGINE_SRC = join(ROOT, "src", "template-engine.ts");
const ENGINE_BUILD = join(ROOT, "src", "template-engine.build.ts");

// Recursively collect all files under templates/
function collectFiles(dir: string, base: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      results.push(...collectFiles(fullPath, base));
    } else {
      results.push(relative(base, fullPath));
    }
  }
  return results;
}

const templateFiles = collectFiles(TEMPLATES_DIR, TEMPLATES_DIR);
console.log(`📦 Embedding ${templateFiles.length} template files...`);

// Build the embedded map
const entries = templateFiles.map((relPath) => {
  const content = readFileSync(join(TEMPLATES_DIR, relPath), "utf-8");
  const escaped = JSON.stringify(content);
  return `  ${JSON.stringify(relPath)}: ${escaped}`;
});

const embeddedMap = `{\n${entries.join(",\n")}\n}`;

// Read the template engine source and replace the empty EMBEDDED_TEMPLATES
const engineSource = readFileSync(ENGINE_SRC, "utf-8");
const patched = engineSource.replace(
  /const EMBEDDED_TEMPLATES: Record<string, string> = \{\};/,
  `const EMBEDDED_TEMPLATES: Record<string, string> = ${embeddedMap};`,
);

if (patched === engineSource) {
  console.error("❌ Could not find EMBEDDED_TEMPLATES placeholder in template-engine.ts");
  process.exit(1);
}

writeFileSync(ENGINE_BUILD, patched);
console.log(`✅ Generated ${ENGINE_BUILD}`);

// Now compile with the patched file
// We need to temporarily swap the files, compile, then restore
const originalEngine = readFileSync(ENGINE_SRC, "utf-8");

// Ensure template-engine.ts is always restored, even if the process is killed
// mid-compilation (SIGINT, SIGTERM, or unexpected exit).
const restoreEngine = () => {
  try { writeFileSync(ENGINE_SRC, originalEngine); } catch {}
};
process.on("exit", restoreEngine);
process.on("SIGINT", () => { restoreEngine(); process.exit(130); });
process.on("SIGTERM", () => { restoreEngine(); process.exit(143); });

writeFileSync(ENGINE_SRC, patched);

try {
  const proc = Bun.spawn({
    cmd: [
      "bun", "build",
      "./src/index.ts",
      "--compile",
      "--outfile", (() => {
        const homeDir = process.env.HOME;
        if (!homeDir) {
          console.error("❌ HOME environment variable is not set. Cannot determine install location.");
          process.exit(1);
        }
        return join(homeDir, ".local", "bin", "qwykz");
      })(),
    ],
    cwd: ROOT,
    stdout: "inherit",
    stderr: "inherit",
  });

  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    console.error("❌ Compilation failed");
    process.exit(1);
  }

  console.log("🎉 Binary compiled and installed to ~/.local/bin/qwykz");
} finally {
  // Restore original template-engine.ts
  writeFileSync(ENGINE_SRC, originalEngine);
  // Clean up the .build file
  try { Bun.spawn({ cmd: ["rm", "-f", ENGINE_BUILD], cwd: ROOT }); } catch {}
}
