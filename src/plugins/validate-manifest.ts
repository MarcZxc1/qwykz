import { isAbsolute, relative, resolve } from "node:path";
import { statSync, readdirSync, realpathSync } from "node:fs";
import { PluginManifestError, type PluginManifest } from "./types";
import pkg from "../../package.json";

const BUILT_IN_FRAMEWORKS = new Set([
  "express", "laravel", "nextjs", "react", "vue",
  "python", "go", "rust", "hono", "elysia", "monorepo"
]);
const BUILT_IN_AUTH_PROVIDERS = new Set(["local", "supabase", "clerk"]);
const CAPABILITY_NAME_REGEX = /^[a-z][a-z0-9-]*$/;

/** npm package name regex */
const NPM_PACKAGE_REGEX = /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;

/**
 * Validates a plugin manifest and its local template directory.
 * Throws PluginManifestError if the plugin is invalid.
 */
export function validateManifest(pluginDir: string, manifest: PluginManifest): void {
  if (!manifest.name || typeof manifest.name !== "string") {
    throw new PluginManifestError(pluginDir, "Missing or invalid 'name' field");
  }

  if (!manifest.version || typeof manifest.version !== "string") {
    throw new PluginManifestError(pluginDir, "Missing or invalid 'version' field");
  }

  if (!manifest.description || !manifest.author || !manifest.qwykzVersion) {
    throw new PluginManifestError(pluginDir, "Missing description, author, or qwykzVersion field");
  }
  if (!isCompatibleVersion(pkg.version, manifest.qwykzVersion)) {
    throw new PluginManifestError(
      pluginDir,
      `Requires qwykz ${manifest.qwykzVersion}, but the current version is ${pkg.version}`,
    );
  }

  if (!manifest.capabilities || typeof manifest.capabilities !== "object") {
    throw new PluginManifestError(pluginDir, "Missing 'capabilities' object");
  }

  const { frameworks = [], authProviders = [], deploymentTargets = [] } = manifest.capabilities;

  // Validate Frameworks
  for (const fw of frameworks) {
    if (!fw.name || !fw.templateDir) {
      throw new PluginManifestError(pluginDir, "Framework capability missing 'name' or 'templateDir'");
    }
    if (!CAPABILITY_NAME_REGEX.test(fw.name)) {
      throw new PluginManifestError(pluginDir, `Invalid framework capability name '${fw.name}'`);
    }
    if (BUILT_IN_FRAMEWORKS.has(fw.name)) {
      throw new PluginManifestError(pluginDir, `Framework name '${fw.name}' conflicts with a built-in framework`);
    }
    validateTemplateDir(pluginDir, fw.templateDir, fw.name);
  }

  // Validate Auth Providers
  for (const ap of authProviders) {
    if (!ap.name || !ap.templateDir) {
      throw new PluginManifestError(pluginDir, "Auth provider capability missing 'name' or 'templateDir'");
    }
    if (!CAPABILITY_NAME_REGEX.test(ap.name) || BUILT_IN_AUTH_PROVIDERS.has(ap.name)) {
      throw new PluginManifestError(pluginDir, `Invalid or conflicting auth provider name '${ap.name}'`);
    }
    validateTemplateDir(pluginDir, ap.templateDir, ap.name);
  }

  // Validate Deployment Targets
  for (const dt of deploymentTargets) {
    if (!dt.name || !dt.templateDir) {
      throw new PluginManifestError(pluginDir, "Deployment target capability missing 'name' or 'templateDir'");
    }
    if (!CAPABILITY_NAME_REGEX.test(dt.name)) {
      throw new PluginManifestError(pluginDir, `Invalid deployment target name '${dt.name}'`);
    }
    validateTemplateDir(pluginDir, dt.templateDir, dt.name);
  }

  // Validate Packages
  if (manifest.packages) {
    const checkDeps = (deps?: Record<string, string>) => {
      if (!deps) return;
      for (const [pkgName, version] of Object.entries(deps)) {
        if (!NPM_PACKAGE_REGEX.test(pkgName)) {
          throw new PluginManifestError(pluginDir, `Invalid npm package name: '${pkgName}'`);
        }
        if (typeof version !== "string" || version.trim() === "") {
          throw new PluginManifestError(pluginDir, `Invalid version for package '${pkgName}'`);
        }
      }
    };
    checkDeps(manifest.packages.dependencies);
    checkDeps(manifest.packages.devDependencies);
  }

  // Validate scripts boundary
  if (manifest.validation) {
    validateBoundary(pluginDir, manifest.validation, "validation");
  }
  if (manifest.postGenerate) {
    validateBoundary(pluginDir, manifest.postGenerate, "postGenerate");
  }
}

function validateTemplateDir(pluginDir: string, templateDir: string, capabilityName: string) {
  const fullPath = resolve(pluginDir, templateDir);

  // Must be inside pluginDir
  if (!isInside(pluginDir, fullPath)) {
    throw new PluginManifestError(pluginDir, `Template dir '${templateDir}' for '${capabilityName}' resolves outside the plugin directory`);
  }

  try {
    const stat = statSync(fullPath);
    if (!stat.isDirectory()) {
      throw new PluginManifestError(pluginDir, `Template dir '${templateDir}' for '${capabilityName}' is not a directory`);
    }
    const files = readdirSync(fullPath);
    if (files.length === 0) {
      throw new PluginManifestError(pluginDir, `Template dir '${templateDir}' for '${capabilityName}' is empty`);
    }
    if (!isInside(realpathSync(pluginDir), realpathSync(fullPath))) {
      throw new PluginManifestError(pluginDir, `Template dir '${templateDir}' resolves through a symlink outside the plugin directory`);
    }
  } catch (e: any) {
    if (e.code === "ENOENT") {
      throw new PluginManifestError(pluginDir, `Template dir '${templateDir}' for '${capabilityName}' does not exist`);
    }
    throw e;
  }
}

function validateBoundary(pluginDir: string, filePath: string, fieldName: string) {
  const fullPath = resolve(pluginDir, filePath);
  if (!isInside(pluginDir, fullPath)) {
    throw new PluginManifestError(pluginDir, `Script '${filePath}' for '${fieldName}' resolves outside the plugin directory`);
  }
  try {
    const stat = statSync(fullPath);
    if (!stat.isFile() || !isInside(realpathSync(pluginDir), realpathSync(fullPath))) {
      throw new PluginManifestError(pluginDir, `Script '${filePath}' for '${fieldName}' is not a safe file inside the plugin directory`);
    }
  } catch (error: any) {
    if (error.code === "ENOENT") {
      throw new PluginManifestError(pluginDir, `Script '${filePath}' for '${fieldName}' does not exist`);
    }
    throw error;
  }
}

function isInside(parent: string, child: string): boolean {
  const path = relative(resolve(parent), resolve(child));
  return path === "" || (!path.startsWith("..") && !isAbsolute(path));
}

function parseVersion(version: string): [number, number, number] | undefined {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)/);
  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : undefined;
}

function compareVersion(left: [number, number, number], right: [number, number, number]): number {
  for (let index = 0; index < 3; index++) {
    if (left[index] !== right[index]) return left[index]! - right[index]!;
  }
  return 0;
}

function isCompatibleVersion(current: string, range: string): boolean {
  const currentVersion = parseVersion(current);
  const requiredVersion = parseVersion(range.replace(/^(?:>=|\^|~)/, ""));
  if (!currentVersion || !requiredVersion) return false;
  if (range.startsWith(">=")) return compareVersion(currentVersion, requiredVersion) >= 0;
  if (range.startsWith("^")) {
    return currentVersion[0] === requiredVersion[0] && compareVersion(currentVersion, requiredVersion) >= 0;
  }
  if (range.startsWith("~")) {
    return currentVersion[0] === requiredVersion[0] && currentVersion[1] === requiredVersion[1] && compareVersion(currentVersion, requiredVersion) >= 0;
  }
  return compareVersion(currentVersion, requiredVersion) === 0;
}
