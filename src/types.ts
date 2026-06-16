export type DbTarget = "supabase" | "local" | "docker";

export type ExtraPackage = "cors" | "helmet" | "zod";

export type PackageMap = Record<string, string>;

export interface ProjectOptions {
  projectName: string;
  dbTarget: DbTarget;
  extraPackages: ExtraPackage[];
}

export interface ProjectPackageJson {
  name: string;
  version: string;
  type: "module";
  scripts: Record<string, string>;
  dependencies: PackageMap;
  devDependencies: PackageMap;
}
