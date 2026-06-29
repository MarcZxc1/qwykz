export type Framework = "express" | "laravel" | "nextjs" | "react" | "vue" | "hono" | "elysia" | "python" | "go" | "rust";

export type DbTarget = "supabase" | "local" | "docker" | "neon";

export type ExtraPackage = "cors" | "helmet" | "zod";

export type PackageMap = Record<string, string>;

export interface ProjectOptions {
  framework: Framework;
  projectName: string;
  dbTarget: DbTarget;
  extraPackages: ExtraPackage[];
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
