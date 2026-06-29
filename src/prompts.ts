import {
  cancel,
  confirm,
  intro,
  isCancel,
  outro,
  select,
  text,
} from "@clack/prompts";
import pc from "picocolors";
import pkg from "../package.json";
import type {
  DbTarget,
  ExtraPackage,
  ProjectOptions,
  Framework,
} from "./types";

function stopOnCancel(value: unknown): asserts value {
  if (isCancel(value)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }
}

function normalizePackageName(name: string): string {
  const normalized = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-");
  // Strip leading digits/dashes (invalid npm name start) and trailing dashes
  const clean = normalized.replace(/^[-0-9]+/, "").replace(/-+$/, "");
  if (!clean) return "qwykz-app";
  return clean.slice(0, 64); // npm name length limit
}

// ---------------------------------------------------------------------------
// CLI flag parsing helpers
// ---------------------------------------------------------------------------

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function getFlagValue(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx === -1 || idx + 1 >= process.argv.length) return undefined;
  return process.argv[idx + 1];
}

/** Non-interactive mode: --yes or -y */
export const isNonInteractive = hasFlag("--yes") || hasFlag("-y");

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

export async function promptForProjectOptions(): Promise<ProjectOptions> {
  // Non-interactive mode: use flags or sensible default
  if (isNonInteractive) {
    const name = getFlagValue("--name") ?? "qwykz-app";
    const dbRaw = getFlagValue("--db") ?? "local";
    const frameworkRaw = getFlagValue("--framework") ?? "express";
    const dbTarget: DbTarget = (
      ["supabase", "local", "docker"].includes(dbRaw) ? dbRaw : "local"
    ) as DbTarget;

    // In non-interactive mode, no extra packages unless explicitly requested
    const extraPackages: ExtraPackage[] = [];
    if (hasFlag("--zod")) extraPackages.push("zod");
    if (hasFlag("--helmet")) extraPackages.push("helmet");
    if (hasFlag("--cors")) extraPackages.push("cors");

    return {
      framework: (["express", "laravel", "nextjs", "react", "vue", "hono", "elysia", "python", "go", "rust"].includes(frameworkRaw)
        ? frameworkRaw
        : "express") as Framework,
      projectName: normalizePackageName(name),
      dbTarget,
      extraPackages,
    };
  }

  console.log(
    pc.bold(
      pc.cyan(`
                       _         
   __ ___      ___   _| | __ ____
  / _\` \\ \\ /\\ / / | | | |/ /|_  /
 | (_| |\\ V  V /| |_| |   <  / / 
  \\__, | \\_/\\_/  \\__, |_|\\_\\/___|
     |_|         |___/           
  `),
    ),
  );
  intro(`Quick & Ready Boilerplate Builder v${pkg.version}`);

  const projectName = await text({
    message: "What is the name of your project?",
    placeholder: "qwykz-app",
    validate(value) {
      if (!value || value.trim().length === 0)
        return "Project name cannot be empty.";
      if (!/^[a-zA-Z0-9-_ ]+$/.test(value)) {
        return "Use letters, numbers, spaces, hyphens, or underscores only.";
      }
    },
  });
  stopOnCancel(projectName);

  const framework = await select({
    message: "What stack do you want to generate?",
    options: [
      { value: "express", label: "Express.js + Typescript (Backend)" },
      { value: "hono", label: "Hono - Edge Optimized (Backend)" },
      { value: "elysia", label: "Elysia - Bun Native (Backend)" },
      { value: "laravel", label: "Vanilla Laravel (Backend)" },
      { value: "python", label: "Python FastAPI (Backend)" },
      { value: "go", label: "Go Fiber (Backend)" },
      { value: "rust", label: "Rust Axum (Backend)" },
      { value: "nextjs", label: "Next.js (Fullstack)" },
      { value: "react", label: "React + Vite (Frontend)" },
      { value: "vue", label: "Vue + Vite (Frontend)" },
    ],
  });
  stopOnCancel(framework);

  let dbTarget: string | symbol = "local";
  if (["express", "laravel", "nextjs", "hono", "elysia"].includes(framework as string)) {
    dbTarget = await select({
      message: "Select your PostgreSQL environment target:",
      options: [
        { value: "supabase", label: "Supabase (remote cloud database)" },
        { value: "neon", label: "Neon Serverless Postgres (remote cloud)" },
        { value: "local", label: "Local PostgreSQL (installed on host)" },
        { value: "docker", label: "Dockerized PostgreSQL (self-contained)" },
      ],
    });
    stopOnCancel(dbTarget);
  }

  const extraPackages: ExtraPackage[] = [];

  if (framework === "express") {
    const shouldInstallZod = await confirm({
      message: "Install Zod for request validation?",
      initialValue: false,
    });
    stopOnCancel(shouldInstallZod);
    if (shouldInstallZod) extraPackages.push("zod");

    const shouldInstallHelmet = await confirm({
      message: "Install Helmet for security headers?",
      initialValue: false,
    });
    stopOnCancel(shouldInstallHelmet);
    if (shouldInstallHelmet) extraPackages.push("helmet");

    const shouldInstallCors = await confirm({
      message: "Install CORS for cross-origin requests?",
      initialValue: false,
    });
    stopOnCancel(shouldInstallCors);
    if (shouldInstallCors) extraPackages.push("cors");
  }

  return {
    framework: framework as Framework,
    projectName: normalizePackageName(String(projectName)),
    dbTarget: dbTarget as DbTarget,
    extraPackages,
  };
}

export async function promptForAutomaticSetup(options: ProjectOptions) {
  // In non-interactive mode, skip setup commands (user can run them manually)
  if (isNonInteractive) return false;

  if (options.dbTarget === "supabase" || options.dbTarget === "neon") {
    return false;
  }

  const shouldRunSetup = await confirm({
    message: "Run the setup commands now?",
    initialValue: false,
  });
  stopOnCancel(shouldRunSetup);
  return shouldRunSetup;
}

export function showSuccess(options: ProjectOptions, setupRan = false) {
  const devCommand =
    options.framework === "laravel" ? "php artisan serve" : "bun dev";

  const installCmd = options.framework === "laravel" ? "" : "  bun install\n";

  if (["python", "go", "rust"].includes(options.framework)) {
    let langCmds = "";
    let langOneLiner = "";
    if (options.framework === "python") {
      langCmds = "  pip install -r requirements.txt\n  uvicorn main:app --reload";
      langOneLiner = "pip install -r requirements.txt && uvicorn main:app --reload";
    } else if (options.framework === "go") {
      langCmds = "  go mod tidy\n  go run main.go";
      langOneLiner = "go mod tidy && go run main.go";
    } else if (options.framework === "rust") {
      langCmds = "  cargo build\n  cargo run";
      langOneLiner = "cargo build && cargo run";
    }
    
    outro(`Your boilerplate "${options.projectName}" is ready.

Next commands:
Manual Execution:
  cd ${options.projectName}
${langCmds}

Automated One-liner:
  cd ${options.projectName} && ${langOneLiner}`);
    return;
  }

  if (options.framework === "react" || options.framework === "vue") {
    outro(`Your boilerplate "${options.projectName}" is ready.

⚠️  ACTION REQUIRED:
1. Open "${options.projectName}/.env"
2. Replace the placeholders with your Supabase credentials
3. Run the following commands to start your app:

Manual Execution:
  cd ${options.projectName}
${setupRan ? "" : installCmd}  ${devCommand}

Automated One-liner:
  cd ${options.projectName}${setupRan ? "" : " && " + installCmd.trim()} && ${devCommand}`);
    return;
  }

  const generateCmd =
    options.framework === "laravel"
      ? "php artisan key:generate"
      : "bun run db:generate";

  const pushCmd =
    options.framework === "laravel" ? "php artisan migrate" : "bun run db:push";

  if (setupRan) {
    outro(
      `Your boilerplate "${options.projectName}" is ready.\n\nSetup commands completed automatically.`,
    );
    return;
  }

  if (options.dbTarget === "supabase" || options.dbTarget === "neon") {
    const providerName = options.dbTarget === "supabase" ? "Supabase" : "Neon Serverless Postgres";
    outro(`Your boilerplate "${options.projectName}" is ready.

⚠️  ACTION REQUIRED:
1. Open "${options.projectName}/.env"
2. Replace the placeholders with your ${providerName} credentials
3. Run the following commands to finish setup:

Manual Execution:
  cd ${options.projectName}
${installCmd}  ${generateCmd}
  ${pushCmd}
  ${devCommand}
  
Automated One-liner:
  cd ${options.projectName}${installCmd ? " && " + installCmd.trim() : ""} && ${generateCmd} && ${pushCmd} && ${devCommand}`);
    return;
  }

  outro(`Your boilerplate "${options.projectName}" is ready.

Next commands:
Manual Execution:
  cd ${options.projectName}
${installCmd}  ${options.dbTarget === "docker" ? "docker compose up -d\n  " : ""}${generateCmd}
  ${pushCmd}
  ${devCommand}
  
Automated One-liner:
  cd ${options.projectName}${installCmd ? " && " + installCmd.trim() : ""}${options.dbTarget === "docker" ? " && docker compose up -d" : ""} && ${generateCmd} && ${pushCmd} && ${devCommand}`);
}
