import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { randomBytes } from "node:crypto";
import { getTemplatesInDirectory, readTemplate } from "../../template-engine";

export async function copyDirectoryRecursive(dirPrefix: string, destDir: string, replacements: Record<string, string>) {
  const files = getTemplatesInDirectory(dirPrefix);
  for (const file of files) {
    if (file.endsWith(".stub")) continue;
    let content = await readTemplate(file);
    for (const [key, value] of Object.entries(replacements)) {
      content = content.split(key).join(value);
    }
    const relativeDest = file.slice(dirPrefix.length).replace(/^\//, "");
    const destPath = join(destDir, relativeDest);
    await mkdir(dirname(destPath), { recursive: true });
    await Bun.write(destPath, content);
  }
}

// ---------------------------------------------------------------------------
// Cryptographic secret helpers
// ---------------------------------------------------------------------------

/** Generate a 48-byte (96-char hex) secret suitable for JWT_SECRET. */
export function generateJwtSecret(): string {
  return randomBytes(48).toString("hex");
}

/** Generate a 12-byte (24-char hex) password for the Docker PostgreSQL user. */
export function generateDbPassword(): string {
  return randomBytes(12).toString("hex");
}

export const PROJECT_FOLDERS = [
  "src/controllers",
  "src/services",
  "src/middlewares",
  "src/lib",
  "src/routes",
  "prisma",
];

export async function writeJson(path: string, value: unknown) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}
