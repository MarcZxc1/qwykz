/**
 * Plugin system types for qwykz extensibility.
 * Plugins register new frameworks, auth providers, and deployment targets
 * via a plugin.json manifest, without modifying core generator code.
 */

// ---------------------------------------------------------------------------
// Capability descriptors
// ---------------------------------------------------------------------------

export type PluginFrameworkType = "backend" | "frontend" | "fullstack";
export type PluginLanguage =
  | "typescript"
  | "javascript"
  | "python"
  | "go"
  | "rust"
  | "php"
  | "java";
export type PluginRuntime = "bun" | "node" | "python" | "go" | "rust" | "php";

export interface PluginFrameworkCapability {
  /** Unique framework identifier (e.g. "fastify"). Must not conflict with built-ins. */
  name: string;
  /** Human-readable label shown in prompts (e.g. "Fastify"). */
  label: string;
  /** Whether this is a backend, frontend, or fullstack framework. */
  type: PluginFrameworkType;
  /** Primary language of the framework. */
  language: PluginLanguage;
  /** Runtime used to run the framework. */
  runtime: PluginRuntime;
  /** Path to the templates directory, relative to the plugin root. */
  templateDir: string;
  /** Supported database targets (defaults to all if omitted). */
  dbTargets?: string[];
  /** Supported auth targets (defaults to all if omitted). */
  authTargets?: string[];
  /** Supported caching targets (defaults to all if omitted). */
  cachingTargets?: string[];
}

export interface PluginAuthProviderCapability {
  /** Unique auth provider identifier (e.g. "auth0"). */
  name: string;
  /** Human-readable label. */
  label: string;
  /** Whether this provider handles frontend auth, backend auth, or both. */
  side: "frontend" | "backend" | "fullstack";
  /** Path to the templates directory, relative to the plugin root. */
  templateDir: string;
}

export interface PluginDeploymentTargetCapability {
  /** Unique deployment target identifier (e.g. "fly"). */
  name: string;
  /** Human-readable label (e.g. "Fly.io"). */
  label: string;
  /** Path to the templates directory, relative to the plugin root. */
  templateDir: string;
  /** Frameworks this deployment target supports. Empty = all. */
  supportedFrameworks?: string[];
}

// ---------------------------------------------------------------------------
// Plugin manifest (plugin.json schema)
// ---------------------------------------------------------------------------

export interface PluginManifest {
  $schema?: string;
  /** npm-compatible package name (e.g. "qwykz-plugin-fastify"). */
  name: string;
  /** semver version string. */
  version: string;
  /** Human-readable description. */
  description: string;
  /** Author name or identifier. */
  author: string;
  /** Semver range of compatible qwykz CLI versions (e.g. ">=1.5.0"). */
  qwykzVersion: string;

  capabilities: {
    frameworks: PluginFrameworkCapability[];
    authProviders: PluginAuthProviderCapability[];
    deploymentTargets: PluginDeploymentTargetCapability[];
  };

  /** npm packages that will be added to the generated project. */
  packages?: {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };

  /** Dev commands for generated projects using this plugin. */
  scripts?: Record<string, string>;

  /**
   * Path to an optional validation module (relative to plugin root).
   * The module must export: `validate(options: PluginValidationContext): Promise<void>`
   * Throw to abort generation with an error.
   */
  validation?: string;

  /**
   * Path to an optional post-generate hook module (relative to plugin root).
   * Exported: `postGenerate(context: PluginPostGenerateContext): Promise<void>`
   */
  postGenerate?: string;
}

// ---------------------------------------------------------------------------
// Runtime plugin record (manifest + resolved absolute path)
// ---------------------------------------------------------------------------

export interface LoadedPlugin {
  /** Absolute path to the plugin directory. */
  pluginDir: string;
  /** Parsed and validated plugin.json contents. */
  manifest: PluginManifest;
  /** Source of discovery (for logging). */
  source: "global" | "local" | "node_modules";
}

// ---------------------------------------------------------------------------
// Plugin hook contexts
// ---------------------------------------------------------------------------

export interface PluginValidationContext {
  /** The framework name selected by the user. */
  framework: string;
  /** The database target selected by the user. */
  dbTarget: string;
  /** The auth target selected by the user. */
  authTarget: string;
  /** The caching target selected by the user. */
  cachingTarget: string;
  /** The project name. */
  projectName: string;
}

export interface PluginPostGenerateContext {
  /** Absolute path to the generated project directory. */
  outputDir: string;
  /** Same context as validation. */
  framework: string;
  dbTarget: string;
  authTarget: string;
  cachingTarget: string;
  projectName: string;
}

// ---------------------------------------------------------------------------
// Manifest validation error
// ---------------------------------------------------------------------------

export class PluginManifestError extends Error {
  constructor(
    public readonly pluginDir: string,
    message: string,
  ) {
    super(`Plugin at "${pluginDir}": ${message}`);
    this.name = "PluginManifestError";
  }
}
