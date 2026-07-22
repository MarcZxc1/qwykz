import { join, resolve } from "node:path";
import { readdirSync, statSync, existsSync } from "node:fs";
import { homedir } from "node:os";

export function getPluginSearchPaths(overrideDir?: string): Array<{ path: string; source: "global" | "local" | "node_modules" }> {
  if (overrideDir) {
    return [{ path: resolve(process.cwd(), overrideDir), source: "local" }];
  }

  const paths: Array<{ path: string; source: "global" | "local" | "node_modules" }> = [];

  // 1. Project local plugins
  const localPlugins = join(process.cwd(), "plugins");
  if (existsSync(localPlugins)) {
    paths.push({ path: localPlugins, source: "local" });
  }

  // 2. Global user plugins
  const globalPlugins = join(homedir(), ".qwykz", "plugins");
  if (existsSync(globalPlugins)) {
    paths.push({ path: globalPlugins, source: "global" });
  }

  // 3. node_modules (local project)
  const nodeModules = join(process.cwd(), "node_modules");
  if (existsSync(nodeModules)) {
    paths.push({ path: nodeModules, source: "node_modules" });
  }

  // 4. node_modules (global install - approximated by the CLI's own node_modules)
  const cliNodeModules = resolve(__dirname, "..", "..", "node_modules");
  if (existsSync(cliNodeModules) && cliNodeModules !== nodeModules) {
    paths.push({ path: cliNodeModules, source: "node_modules" });
  }

  return paths;
}

/**
 * Discovers plugin directories by scanning the provided base paths.
 */
export function discoverPluginDirectories(searchPaths = getPluginSearchPaths()): Array<{ dir: string, source: "global" | "local" | "node_modules" }> {
  const discovered: Array<{ dir: string, source: "global" | "local" | "node_modules" }> = [];
  const seen = new Set<string>();

  for (const searchPath of searchPaths) {
    try {
      const entries = readdirSync(searchPath.path);

      for (const entry of entries) {
        // If searching node_modules, only look for qwykz-plugin-*
        if (searchPath.source === "node_modules" && !entry.startsWith("qwykz-plugin-")) {
          // Check for scoped packages: @scope/qwykz-plugin-*
          if (entry.startsWith("@")) {
            const scopeDir = join(searchPath.path, entry);
            if (statSync(scopeDir).isDirectory()) {
              const scopeEntries = readdirSync(scopeDir);
              for (const scopeEntry of scopeEntries) {
                if (scopeEntry.startsWith("qwykz-plugin-")) {
                  addDir(join(scopeDir, scopeEntry), searchPath.source);
                }
              }
            }
          }
          continue;
        }

        const fullPath = join(searchPath.path, entry);
        if (statSync(fullPath).isDirectory()) {
          // A valid plugin directory must contain a plugin.json
          if (existsSync(join(fullPath, "plugin.json"))) {
            addDir(fullPath, searchPath.source);
          }
        }
      }
    } catch (e) {
      // Ignore errors reading directories (e.g. permission denied)
    }
  }

  function addDir(dir: string, source: "global" | "local" | "node_modules") {
    if (!seen.has(dir)) {
      seen.add(dir);
      discovered.push({ dir, source });
    }
  }

  return discovered;
}
