import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { packageVersions } from "./package-versions";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Where we store the daily version cache */
const CACHE_DIR = join(__dirname, "..", ".cache");
const CACHE_FILE = join(CACHE_DIR, "npm-versions.json");

/** Per-request timeout in ms */
const FETCH_TIMEOUT_MS = 5_000;

/** Validates that a string conforms to the npm package name spec before fetching or caching. */
const VALID_NPM_PACKAGE_NAME = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;

interface CacheData {
  /** ISO date string (YYYY-MM-DD) for the day the cache was written */
  date: string;
  /** Package name → version string */
  versions: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Cache helpers
// ---------------------------------------------------------------------------

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // "2025-06-20"
}

function readCache(): CacheData | null {
  try {
    const raw = readFileSync(CACHE_FILE, "utf-8");
    const data = JSON.parse(raw) as CacheData;
    if (data && data.date && data.versions) return data;
  } catch {
    // Cache doesn't exist or is corrupt — that's fine
  }
  return null;
}

function writeCache(versions: Record<string, string>): void {
  try {
    mkdirSync(CACHE_DIR, { recursive: true });
    const data: CacheData = { date: todayKey(), versions };
    writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
  } catch {
    // Non-critical — we just won't have cache next time
  }
}

// ---------------------------------------------------------------------------
// NPM registry fetcher
// ---------------------------------------------------------------------------

/**
 * Fetch the latest version of a single package from the npm registry.
 * Returns a `^version` string (e.g. `"^5.2.1"`).
 */
async function fetchLatestVersion(packageName: string): Promise<string> {
  if (!VALID_NPM_PACKAGE_NAME.test(packageName)) {
    throw new Error(`Invalid npm package name: "${packageName}"`);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const url = `https://registry.npmjs.org/${encodeURIComponent(packageName)}/latest`;
    const res = await fetch(url, { signal: controller.signal });

    if (!res.ok) {
      throw new Error(`npm registry returned ${res.status} for ${packageName}`);
    }

    const data = (await res.json()) as { version?: string };
    if (!data.version) {
      throw new Error(`No version field in npm response for ${packageName}`);
    }

    return `^${data.version}`;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Resolve the latest versions for an array of npm packages.
 *
 * Strategy (3-tier fallback):
 *   1. If today's cache exists → return cached versions immediately
 *   2. Fetch all packages from the npm registry in parallel
 *   3. On any network failure → fall back to cache (any date) → then hardcoded versions
 *
 * Never throws — always returns a usable version map.
 */
export async function resolveLatestVersions(
  packageNames: string[],
): Promise<Record<string, string>> {
  // 1. Check if today's cache is fresh
  const cached = readCache();
  if (cached && cached.date === todayKey()) {
    const allPresent = packageNames.every((name) => name in cached.versions);
    if (allPresent) {
      return cached.versions;
    }
  }

  // 2. Fetch from npm registry in parallel
  try {
    const results = await Promise.all(
      packageNames.map(async (name) => {
        const version = await fetchLatestVersion(name);
        return [name, version] as const;
      }),
    );

    const versions = Object.fromEntries(results);

    // Merge with any existing cached versions (for packages we didn't fetch this time)
    const merged = { ...(cached?.versions ?? {}), ...versions };
    writeCache(merged);

    return merged;
  } catch {
    // 3. Fallback: stale cache → hardcoded
    if (cached?.versions) {
      const allPresent = packageNames.every((name) => name in cached.versions);
      if (allPresent) {
        return cached.versions;
      }
    }

    // Ultimate fallback: hardcoded versions from package-versions.ts
    return {
      ...packageVersions.dependencies,
      ...packageVersions.devDependencies,
    };
  }
}
