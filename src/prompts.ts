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
    const authRaw = getFlagValue("--auth") ?? "local";
    const frameworkRaw = getFlagValue("--framework") ?? "express";
    const dbTarget: DbTarget = (
      ["supabase", "local", "docker", "neon"].includes(dbRaw) ? dbRaw : "local"
    ) as DbTarget;
    const authTarget: AuthTarget = (
      ["supabase", "clerk", "local"].includes(authRaw) ? authRaw : "local"
    ) as AuthTarget;

    const cachingRaw = getFlagValue("--caching") ?? "none";
    const cachingTarget: CachingTarget = (
      ["none", "upstash", "docker"].includes(cachingRaw) ? cachingRaw : "none"
    ) as any;

    // In non-interactive mode, no extra packages unless explicitly requested
    const extraPackages: ExtraPackage[] = [];
    if (hasFlag("--zod")) extraPackages.push("zod");
    if (hasFlag("--helmet")) extraPackages.push("helmet");
    if (hasFlag("--cors") || frameworkRaw === "monorepo") extraPackages.push("cors");

    const frontendFramework = getFlagValue("--frontend") as Framework;
    const backendFramework = getFlagValue("--backend") as Framework;

    return {
      framework: (["express", "laravel", "nextjs", "react", "vue", "hono", "elysia", "python", "go", "rust", "monorepo"].includes(frameworkRaw)
        ? frameworkRaw
        : "express") as Framework,
      projectName: normalizePackageName(name),
      dbTarget,
      authTarget,
      cachingTarget,
      extraPackages,
      frontendFramework,
      backendFramework
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

  const projectType = await select({
    message: "What type of project do you want to generate?",
    options: [
      { value: "backend", label: "Backend API" },
      { value: "frontend", label: "Frontend SPA" },
      { value: "fullstack", label: "Fullstack Application" },
    ],
  });
  stopOnCancel(projectType);

  let framework = "express";
  let frontendFramework: Framework | undefined;
  let backendFramework: Framework | undefined;

  if (projectType === "backend") {
    framework = await select({
      message: "What stack do you want to generate?",
      options: [
        { value: "express", label: "Express.js + Typescript" },
        { value: "hono", label: "Hono - Edge Optimized" },
        { value: "elysia", label: "Elysia - Bun Native" },
        { value: "laravel", label: "Vanilla Laravel" },
        { value: "python", label: "Python FastAPI" },
        { value: "go", label: "Go Fiber" },
        { value: "rust", label: "Rust Axum" },
      ],
    }) as string;
    stopOnCancel(framework);
  } else if (projectType === "frontend") {
    framework = await select({
      message: "What frontend framework do you want to generate?",
      options: [
        { value: "react", label: "React + Vite" },
        { value: "vue", label: "Vue + Vite" },
      ],
    }) as string;
    stopOnCancel(framework);
  } else if (projectType === "fullstack") {
    const fullstackType = await select({
      message: "Choose your fullstack architecture:",
      options: [
        { value: "nextjs", label: "Next.js (App Router)" },
        { value: "monorepo", label: "Custom Monorepo (Frontend + Backend)" },
      ],
    });
    stopOnCancel(fullstackType);

    if (fullstackType === "nextjs") {
      framework = "nextjs";
    } else {
      framework = "monorepo";
      frontendFramework = await select({
        message: "Select your Frontend Framework:",
        options: [
          { value: "react", label: "React + Vite" },
          { value: "vue", label: "Vue + Vite" },
        ],
      }) as Framework;
      stopOnCancel(frontendFramework);

      backendFramework = await select({
        message: "Select your Backend Framework:",
        options: [
          { value: "express", label: "Express.js + Typescript" },
          { value: "hono", label: "Hono - Edge Optimized" },
          { value: "elysia", label: "Elysia - Bun Native" },
          { value: "python", label: "Python FastAPI" },
          { value: "go", label: "Go Fiber" },
          { value: "rust", label: "Rust Axum" },
        ],
      }) as Framework;
      stopOnCancel(backendFramework);
    }
  }

  let dbTarget = "local";
  if (framework !== "react" && framework !== "vue") {
    dbTarget = await select({
      message: "Select your PostgreSQL environment target:",
      options: [
        { value: "supabase", label: "Supabase (remote cloud database)" },
        { value: "local", label: "Local PostgreSQL (installed on host)" },
        { value: "docker", label: "Dockerized PostgreSQL (self-contained)" },
      ],
    }) as string;
    stopOnCancel(dbTarget);
  }

  let authTarget: string | symbol = "local";
  if (["express", "nextjs", "react", "vue", "hono", "elysia", "monorepo"].includes(framework as string)) {
    authTarget = await select({
      message: "Select your Authentication Provider:",
      options: [
        { value: "local", label: "Classic / Codebase Built-in Auth" },
        { value: "supabase", label: "Supabase Auth" },
        { value: "clerk", label: "Clerk Auth" },
      ],
    });
    stopOnCancel(authTarget);
  }

  let cachingTarget: string | symbol = "none";
  if (["express", "laravel", "nextjs", "hono", "elysia", "python", "go", "rust", "monorepo"].includes(framework as string)) {
    cachingTarget = await select({
      message: "Do you want to add a Redis caching layer?",
      options: [
        { value: "none", label: "None" },
        { value: "upstash", label: "Upstash Serverless Redis (Cloud)" },
        { value: "docker", label: "Local Redis (Dockerized)" },
      ],
    });
    stopOnCancel(cachingTarget);
  }

  const extraPackages: ExtraPackage[] = [];

  const targetBackend = framework === "monorepo" ? backendFramework : framework;

  if (["express", "hono", "elysia"].includes(targetBackend as string)) {
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

    if (framework === "monorepo") {
      // Monorepos ALWAYS need CORS to connect frontend (5173) to backend (3000)
      extraPackages.push("cors");
    } else {
      const shouldInstallCors = await confirm({
        message: "Install CORS for cross-origin requests?",
        initialValue: false,
      });
      stopOnCancel(shouldInstallCors);
      if (shouldInstallCors) extraPackages.push("cors");
    }
  }

  return {
    framework: framework as Framework,
    projectName: normalizePackageName(String(projectName)),
    dbTarget: dbTarget as DbTarget,
    authTarget: authTarget as AuthTarget,
    cachingTarget: cachingTarget as any,
    extraPackages,
    frontendFramework,
    backendFramework
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
  
  if (options.framework === "monorepo") {
    let envInstructions = "";
    if (options.dbTarget === "supabase" || options.authTarget !== "local") {
      envInstructions = `⚠️  ACTION REQUIRED:
1. Open "${options.projectName}/backend/.env"
2. Replace the placeholders with your database/auth credentials.
3. Open "${options.projectName}/frontend/.env" (if applicable) and add client keys.
4. Run the following commands to finish setup:
`;
    } else {
      envInstructions = `Next commands:\n`;
    }

    const hasDocker = options.dbTarget === "docker" || options.cachingTarget === "docker";
    const dockerCmd = hasDocker ? "  cd backend && docker compose up -d\n  cd ..\n" : "";
    const dockerOneLiner = hasDocker ? "cd backend && docker compose up -d && cd .. && " : "";
    
    outro(`Your boilerplate "${options.projectName}" is ready.

${envInstructions}
Manual Execution:
  cd ${options.projectName}
${dockerCmd}${installCmd}  bun run db:generate
  bun run db:push
  bun run dev

Automated One-liner:
  cd ${options.projectName} && ${dockerOneLiner}${installCmd.trim()} && bun run db:generate && bun run db:push && bun run dev`);
    return;
  }

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
    const providerName = options.dbTarget === "clerk" ? "Clerk" : "Supabase";
    let envInstructions = "";
    
    if (options.dbTarget !== "local") {
      envInstructions = `⚠️  ACTION REQUIRED:
1. Open "${options.projectName}/.env"
2. Replace the placeholders with your ${providerName} credentials
3. Run the following commands to start your app:`;
    } else {
      envInstructions = `Next commands:`;
    }

    outro(`Your boilerplate "${options.projectName}" is ready.

${envInstructions}

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

  const hasDocker = options.dbTarget === "docker" || options.cachingTarget === "docker";
  const dockerCmd = hasDocker ? "  docker compose up -d\n" : "";
  const dockerOneLiner = hasDocker ? "docker compose up -d && " : "";

  if (options.dbTarget === "supabase" || options.dbTarget === "neon") {
    const providerName = options.dbTarget === "supabase" ? "Supabase" : "Neon Serverless Postgres";
    outro(`Your boilerplate "${options.projectName}" is ready.

⚠️  ACTION REQUIRED:
1. Open "${options.projectName}/.env"
2. Replace the placeholders with your ${providerName} credentials
3. Run the following commands to finish setup:

Manual Execution:
  cd ${options.projectName}
${dockerCmd}${installCmd}  ${generateCmd}
  ${pushCmd}
  ${devCommand}
  
Automated One-liner:
  cd ${options.projectName} && ${dockerOneLiner}${installCmd ? installCmd.trim() + " && " : ""}${generateCmd} && ${pushCmd} && ${devCommand}`);
    return;
  }

  outro(`Your boilerplate "${options.projectName}" is ready.

Next commands:
Manual Execution:
  cd ${options.projectName}
${dockerCmd}${installCmd}  ${generateCmd}
  ${pushCmd}
  ${devCommand}
  
Automated One-liner:
  cd ${options.projectName} && ${dockerOneLiner}${installCmd ? installCmd.trim() + " && " : ""}${generateCmd} && ${pushCmd} && ${devCommand}`);
}
