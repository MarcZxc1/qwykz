export type Framework = "express" | "laravel" | "nextjs" | "react" | "vue" | "hono" | "elysia" | "python" | "go" | "rust" | "monorepo";

export type DbTarget = "supabase" | "local" | "docker" | "neon";

export type AuthTarget = "supabase" | "clerk" | "local";

export type CachingTarget = "none" | "upstash" | "docker";

export type ExtraPackage = "cors" | "helmet" | "zod";

export type PackageMap = Record<string, string>;

export interface ProjectOptions {
  framework: Framework;
  projectName: string;
  dbTarget: DbTarget;
  authTarget: AuthTarget;
  cachingTarget: CachingTarget;
  extraPackages: ExtraPackage[];
  frontendFramework?: Framework;
  backendFramework?: Framework;
  supabaseDbUrl?: string;
}

export interface ProjectPackageJson {
  name: string;
  version: string;
  type: "module";
  scripts: Record<string, string>;
  dependencies: PackageMap;
  devDependencies: PackageMap;
}
