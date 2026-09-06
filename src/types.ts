export type NodeFramework = "express" | "hono" | "elysia";

export type Framework = "express" | "laravel" | "nextjs" | "react" | "vue" | "hono" | "elysia" | "python" | "go" | "rust" | "monorepo" | (string & {});

export type CapabilityStatus = "supported" | "experimental" | "planned" | "unsupported";

export type DbTarget = "supabase" | "local" | "docker" | "neon" | (string & {});

export type AuthTarget = "supabase" | "clerk" | "local" | (string & {});

export type CachingTarget = "none" | "upstash" | "docker" | (string & {});

export type ExtraPackage = "cors" | "helmet" | "zod";

export type PackageMap = Record<string, string>;

export interface ProjectOptions {
  framework: Framework;
  projectName: string;
  preset?: string;
  dbTarget: DbTarget;
  authTarget: AuthTarget;
  cachingTarget: CachingTarget;
  extraPackages: ExtraPackage[];
  frontendFramework?: Framework;
  backendFramework?: Framework;
  supabaseDbUrl?: string;
  dbPort?: number;
  redisPort?: number;
  // P1: Trust & Predictability flags
  dryRun?: boolean;
  strict?: boolean;
  recordPrompts?: boolean;
  // P5: AI context pack
  noAiContext?: boolean;
  // P5: allow combinations explicitly marked experimental
  experimental?: boolean;
  deploymentTarget?: string;
  // Educational scaffolding & hands-on learning mode
  learn?: boolean;
}

/** A record of a single file that will be generated. */
export interface ScaffoldFile {
  /** Relative path within the project directory. */
  path: string;
  /** File content. */
  content: string;
}

/** A package entry with audit reason for strict policy mode. */
export interface PackageAudit {
  name: string;
  version: string;
  category: "core" | "auth" | "cache" | "extra" | "framework" | "dev";
  reason: string;
  isDev: boolean;
}

/**
 * The complete description of what a scaffold run will produce.
 * Built before writing anything to disk; used by dry-run, manifest, and context pack.
 */
export interface ScaffoldPlan {
  projectName: string;
  options: ProjectOptions;
  files: ScaffoldFile[];
  packageAudit: PackageAudit[];
  generatedAt: string;
}

/** Machine-readable manifest written into every generated project. */
export interface ScaffoldManifest {
  $schema: string;
  generator: {
    name: string;
    version: string;
  };
  scaffold: {
    framework: string;
    preset?: string;
    dbTarget: string;
    authTarget: string;
    cachingTarget: string;
    frontendFramework: string | null;
    backendFramework: string | null;
    extraPackages: string[];
    learn?: boolean;
  };
  packages: {
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
  };
  packageAudit: PackageAudit[];
  templates: {
    engine: string;
    version: string;
    checksums: Record<string, string>;
  };
  capabilities: {
    combinationStatus: CapabilityStatus;
  };
  plugins?: {
    name: string;
    version: string;
  }[];
  promptAnswers?: {
    preset?: string;
    framework: string;
    dbTarget: string;
    authTarget: string;
    cachingTarget: string;
    extraPackages: string[];
    frontendFramework?: string;
    backendFramework?: string;
    deploymentTarget?: string;
    learn?: boolean;
  };
  createdAt: string;
}

export interface ProjectPackageJson {
  name: string;
  version: string;
  type: "module";
  scripts: Record<string, string>;
  dependencies: PackageMap;
  devDependencies: PackageMap;
}
