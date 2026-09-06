import type { ProjectOptions } from "./types";

export type PresetCategory = "api" | "fullstack" | "web";

export interface PresetDefinition {
  name: string;
  aliases: string[];
  description: string;
  category: PresetCategory;
  options: Omit<ProjectOptions, "projectName">;
}

export const PRESETS: PresetDefinition[] = [
  // -------------------------------------------------------------------------
  // Backend APIs
  // -------------------------------------------------------------------------
  {
    name: "api-rust",
    aliases: ["rust"],
    description: "Rust (Axum) API with Docker PostgreSQL and Redis",
    category: "api",
    options: {
      framework: "rust",
      dbTarget: "docker",
      authTarget: "local",
      cachingTarget: "docker",
      extraPackages: [],
    },
  },
  {
    name: "api-go",
    aliases: ["go"],
    description: "Go (Fiber) API with Docker PostgreSQL and Redis",
    category: "api",
    options: {
      framework: "go",
      dbTarget: "docker",
      authTarget: "local",
      cachingTarget: "docker",
      extraPackages: [],
    },
  },
  {
    name: "api-python",
    aliases: ["python", "fastapi"],
    description: "Python (FastAPI) API with Docker PostgreSQL and Redis",
    category: "api",
    options: {
      framework: "python",
      dbTarget: "docker",
      authTarget: "local",
      cachingTarget: "docker",
      extraPackages: [],
    },
  },
  {
    name: "api-elysia",
    aliases: ["elysia", "bun"],
    description: "Elysia + Bun API with Docker PostgreSQL and Redis",
    category: "api",
    options: {
      framework: "elysia",
      dbTarget: "docker",
      authTarget: "local",
      cachingTarget: "docker",
      extraPackages: [],
    },
  },
  {
    name: "api-hono",
    aliases: ["hono"],
    description: "Hono + Bun API with Docker PostgreSQL and Redis",
    category: "api",
    options: {
      framework: "hono",
      dbTarget: "docker",
      authTarget: "local",
      cachingTarget: "docker",
      extraPackages: [],
    },
  },
  {
    name: "api-express",
    aliases: ["express", "node"],
    description: "Express + TypeScript API with Docker PostgreSQL, Zod, Helmet, CORS",
    category: "api",
    options: {
      framework: "express",
      dbTarget: "docker",
      authTarget: "local",
      cachingTarget: "none",
      extraPackages: ["zod", "helmet", "cors"],
    },
  },
  {
    name: "api-laravel",
    aliases: ["laravel"],
    description: "Laravel 11/12 API with Docker PostgreSQL and Redis",
    category: "api",
    options: {
      framework: "laravel",
      dbTarget: "docker",
      authTarget: "local",
      cachingTarget: "docker",
      extraPackages: [],
      experimental: true,
    },
  },

  // -------------------------------------------------------------------------
  // Web & Fullstack Frontends
  // -------------------------------------------------------------------------
  {
    name: "web-nextjs",
    aliases: ["nextjs", "saas"],
    description: "Next.js App Router with Docker PostgreSQL and Redis",
    category: "web",
    options: {
      framework: "nextjs",
      dbTarget: "docker",
      authTarget: "local",
      cachingTarget: "docker",
      extraPackages: [],
    },
  },
  {
    name: "web-react",
    aliases: ["react"],
    description: "React 19 SPA with Vite and Tailwind CSS v4",
    category: "web",
    options: {
      framework: "react",
      dbTarget: "local",
      authTarget: "supabase",
      cachingTarget: "none",
      extraPackages: [],
    },
  },
  {
    name: "web-vue",
    aliases: ["vue"],
    description: "Vue 3 SPA with Vite and Tailwind CSS v4",
    category: "web",
    options: {
      framework: "vue",
      dbTarget: "local",
      authTarget: "supabase",
      cachingTarget: "none",
      extraPackages: [],
    },
  },

  // -------------------------------------------------------------------------
  // Fullstack Monorepos
  // -------------------------------------------------------------------------
  {
    name: "fullstack-react-rust",
    aliases: ["react-rust"],
    description: "Fullstack monorepo: React Vite + Rust Axum API with Docker PostgreSQL & Redis",
    category: "fullstack",
    options: {
      framework: "monorepo",
      frontendFramework: "react",
      backendFramework: "rust",
      dbTarget: "docker",
      authTarget: "local",
      cachingTarget: "docker",
      extraPackages: ["cors"],
    },
  },
  {
    name: "fullstack-react-go",
    aliases: ["react-go"],
    description: "Fullstack monorepo: React Vite + Go Fiber API with Docker PostgreSQL & Redis",
    category: "fullstack",
    options: {
      framework: "monorepo",
      frontendFramework: "react",
      backendFramework: "go",
      dbTarget: "docker",
      authTarget: "local",
      cachingTarget: "docker",
      extraPackages: ["cors"],
    },
  },
  {
    name: "fullstack-react-elysia",
    aliases: ["react-elysia"],
    description: "Fullstack monorepo: React Vite + Elysia Bun API with Docker PostgreSQL & Redis",
    category: "fullstack",
    options: {
      framework: "monorepo",
      frontendFramework: "react",
      backendFramework: "elysia",
      dbTarget: "docker",
      authTarget: "local",
      cachingTarget: "docker",
      extraPackages: ["cors"],
    },
  },
  {
    name: "fullstack-react-hono",
    aliases: ["react-hono"],
    description: "Fullstack monorepo: React Vite + Hono Bun API with Docker PostgreSQL & Redis",
    category: "fullstack",
    options: {
      framework: "monorepo",
      frontendFramework: "react",
      backendFramework: "hono",
      dbTarget: "docker",
      authTarget: "local",
      cachingTarget: "docker",
      extraPackages: ["cors"],
    },
  },
  {
    name: "fullstack-react-express",
    aliases: ["react-express"],
    description: "Fullstack monorepo: React Vite + Express API with Docker PostgreSQL",
    category: "fullstack",
    options: {
      framework: "monorepo",
      frontendFramework: "react",
      backendFramework: "express",
      dbTarget: "docker",
      authTarget: "local",
      cachingTarget: "none",
      extraPackages: ["cors", "zod", "helmet"],
    },
  },
  {
    name: "fullstack-react-fastapi",
    aliases: ["react-python", "react-fastapi"],
    description: "Fullstack monorepo: React Vite + Python FastAPI with Docker PostgreSQL & Redis",
    category: "fullstack",
    options: {
      framework: "monorepo",
      frontendFramework: "react",
      backendFramework: "python",
      dbTarget: "docker",
      authTarget: "local",
      cachingTarget: "docker",
      extraPackages: ["cors"],
    },
  },
  {
    name: "fullstack-vue-hono",
    aliases: ["vue-hono"],
    description: "Fullstack monorepo: Vue Vite + Hono Bun API with Docker PostgreSQL & Redis",
    category: "fullstack",
    options: {
      framework: "monorepo",
      frontendFramework: "vue",
      backendFramework: "hono",
      dbTarget: "docker",
      authTarget: "local",
      cachingTarget: "docker",
      extraPackages: ["cors"],
    },
  },
];

/** Return all available presets. */
export function listPresets(): PresetDefinition[] {
  return [...PRESETS];
}

/** Find a preset by its canonical name or one of its aliases. */
export function findPreset(nameOrAlias: string): PresetDefinition | undefined {
  const query = nameOrAlias.trim().toLowerCase();
  if (!query) return undefined;

  return PRESETS.find(
    (p) => p.name.toLowerCase() === query || p.aliases.some((a) => a.toLowerCase() === query),
  );
}

/**
 * Resolve project options for a given preset, applying optional overrides.
 */
export function resolvePresetOptions(
  nameOrAlias: string,
  overrides?: Partial<ProjectOptions>,
): ProjectOptions | undefined {
  const preset = findPreset(nameOrAlias);
  if (!preset) return undefined;

  const defaultProjectName = overrides?.projectName || `qwykz-${preset.name.replace(/^(api-|web-|fullstack-)/, "")}`;

  return {
    projectName: defaultProjectName,
    ...preset.options,
    preset: preset.name,
    dbPort: Math.floor(Math.random() * 1000) + 54000,
    redisPort: Math.floor(Math.random() * 1000) + 63000,
    ...overrides,
    experimental: overrides?.experimental ?? preset.options.experimental ?? false,
  };
}

/**
 * Format the presets catalog into a clean terminal table.
 */
export function formatPresetsTable(): string {
  const lines: string[] = [
    "Available Curated Presets",
    "========================",
    "",
    "Usage: qwykz --preset <name-or-alias> [--name <project-name>]",
    "",
    "  Preset Name              Alias(es)               Description",
    "  -----------------------  ----------------------  --------------------------------------------------",
  ];

  for (const preset of PRESETS) {
    const nameCol = preset.name.padEnd(23, " ");
    const aliasCol = (preset.aliases.join(", ") || "-").padEnd(22, " ");
    lines.push(`  ${nameCol}  ${aliasCol}  ${preset.description}`);
  }

  lines.push("");
  lines.push("Categories:");
  lines.push("  • api-*       : Standalone backend service (Axum, Fiber, FastAPI, Elysia, Hono, Express, Laravel)");
  lines.push("  • fullstack-* : Monorepo with React/Vue frontend wired to a performant backend");
  lines.push("  • web-*       : Modern web apps (Next.js App Router, Vite SPAs)");
  lines.push("");

  return lines.join("\n");
}
