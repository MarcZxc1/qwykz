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
  AuthTarget,
  CachingTarget,
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
    // A standalone Vite SPA has no qwykz backend to serve local JWT auth.
    // Default it to a managed auth provider instead.
    const authRaw = getFlagValue("--auth") ?? (
      ["react", "vue"].includes(frameworkRaw) ? "supabase" : "local"
    );
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
      backendFramework,
      dbPort: Math.floor(Math.random() * 1000) + 54000,
      redisPort: Math.floor(Math.random() * 1000) + 63000
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
      { value: "backend", label: "Backend API (database-backed REST API)" },
      { value: "frontend", label: "Frontend app (React/Vue SPA or Next.js app)" },
      { value: "fullstack", label: "Fullstack monorepo (frontend + API)" },
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
        { value: "express", label: "Express + TypeScript (Prisma + PostgreSQL)" },
        { value: "hono", label: "Hono + TypeScript (Prisma + PostgreSQL)" },
        { value: "elysia", label: "Elysia + Bun (Prisma + PostgreSQL)" },
        { value: "laravel", label: "Laravel + PHP (PostgreSQL API)" },
        { value: "python", label: "FastAPI + Python (SQLModel + PostgreSQL)" },
        { value: "go", label: "Fiber + Go (GORM + PostgreSQL)" },
        { value: "rust", label: "Axum + Rust (SQLx + PostgreSQL)" },
      ],
    }) as string;
    stopOnCancel(framework);
  } else if (projectType === "frontend") {
    framework = await select({
      message: "What frontend framework do you want to generate?",
      options: [
        { value: "nextjs", label: "Next.js App Router (full-stack web app)" },
        { value: "react", label: "React + Vite (SPA)" },
        { value: "vue", label: "Vue + Vite (SPA)" },
      ],
    }) as string;
    stopOnCancel(framework);
  } else if (projectType === "fullstack") {
    framework = "monorepo";
    frontendFramework = await select({
        message: "Select your Frontend Framework:",
        options: [
          { value: "react", label: "React + Vite (SPA)" },
          { value: "vue", label: "Vue + Vite (SPA)" },
        ],
      }) as Framework;
      stopOnCancel(frontendFramework);

      backendFramework = await select({
        message: "Select your Backend Framework:",
        options: [
          { value: "express", label: "Express + TypeScript (Prisma + PostgreSQL)" },
          { value: "hono", label: "Hono + TypeScript (Prisma + PostgreSQL)" },
          { value: "elysia", label: "Elysia + Bun (Prisma + PostgreSQL)" },
          { value: "laravel", label: "Laravel + PHP (PostgreSQL API)" },
          { value: "python", label: "FastAPI + Python (SQLModel + PostgreSQL)" },
          { value: "go", label: "Fiber + Go (GORM + PostgreSQL)" },
          { value: "rust", label: "Axum + Rust (SQLx + PostgreSQL)" },
        ],
      }) as Framework;
      stopOnCancel(backendFramework);
  }

  let dbTarget = "local";
  if (framework !== "react" && framework !== "vue") {
    dbTarget = await select({
      message: "Select your PostgreSQL environment target:",
      options: [
        { value: "supabase", label: "Supabase (remote cloud database)" },
        { value: "local", label: "Local PostgreSQL (installed on host)" },
        { value: "docker", label: "Containerized PostgreSQL" },
      ],
    }) as string;
    stopOnCancel(dbTarget);
  }

  const targetBackend = framework === "monorepo" ? backendFramework : framework;
  const supportsProviderAuth = ["express", "hono", "elysia", "nextjs"].includes(targetBackend as string);
  const isStandaloneSpa = projectType === "frontend" && ["react", "vue"].includes(framework);

  let authTarget: string | symbol = "local";
  if (["express", "nextjs", "react", "vue", "hono", "elysia", "monorepo"].includes(framework as string)) {
    authTarget = await select({
      message: "Select your Authentication Provider:",
      options: isStandaloneSpa
        ? [
            { value: "supabase", label: "Supabase Auth (managed; required by SPA-only auth)" },
            { value: "clerk", label: "Clerk Auth (managed; required by SPA-only auth)" },
          ]
        : supportsProviderAuth
          ? [
              { value: "local", label: "Built-in JWT auth (backend only)" },
              { value: "supabase", label: "Supabase Auth (managed)" },
              { value: "clerk", label: "Clerk Auth (managed)" },
            ]
          : [
              { value: "local", label: "Built-in API auth (only compatible option)" },
            ],
      initialValue: projectType === "frontend" ? "supabase" : "local",
    });
    stopOnCancel(authTarget);
  }

  const supportsUpstash = ["express", "hono", "elysia"].includes(targetBackend as string);
  let cachingTarget: string | symbol = "none";
  if (["express", "laravel", "nextjs", "hono", "elysia", "python", "go", "rust", "monorepo"].includes(framework as string)) {
    cachingTarget = await select({
      message: "Add Redis client configuration for caching?",
      options: [
        { value: "none", label: "None" },
        ...(supportsUpstash ? [{ value: "upstash", label: "Upstash Redis (managed REST client)" }] : []),
        { value: "docker", label: "Docker Redis (local service)" },
      ],
    });
    stopOnCancel(cachingTarget);
  }

  const extraPackages: ExtraPackage[] = [];

  if (["express", "hono", "elysia"].includes(targetBackend as string)) {
    const zodMessage = authTarget === "local"
      ? "Use Zod for additional user-route validation? (It is already used for local auth validation.)"
      : "Add Zod validation to the generated user route?";
    const shouldInstallZod = await confirm({
      message: zodMessage,
      initialValue: false,
    });
    stopOnCancel(shouldInstallZod);
    if (shouldInstallZod) extraPackages.push("zod");

    const shouldInstallHelmet = await confirm({
      message: "Enable security headers?",
      initialValue: false,
    });
    stopOnCancel(shouldInstallHelmet);
    if (shouldInstallHelmet) extraPackages.push("helmet");

    if (framework === "monorepo") {
      // Monorepos ALWAYS need CORS to connect frontend (5173) to backend (3000)
      extraPackages.push("cors");
    } else {
      const shouldInstallCors = await confirm({
        message: "Enable CORS for cross-origin requests?",
        initialValue: false,
      });
      stopOnCancel(shouldInstallCors);
      if (shouldInstallCors) extraPackages.push("cors");
    }
  }

  const selectedStack = framework === "monorepo"
    ? `${frontendFramework} frontend + ${backendFramework} backend`
    : framework;
  console.log(
    pc.dim(
      `Base framework/runtime dependencies are installed automatically for ${selectedStack}; optional packages are only added when you select them.`,
    ),
  );

  return {
    framework: framework as Framework,
    projectName: normalizePackageName(String(projectName)),
    dbTarget: dbTarget as DbTarget,
    authTarget: authTarget as AuthTarget,
    cachingTarget: cachingTarget as any,
    extraPackages,
    frontendFramework,
    backendFramework,
    dbPort: Math.floor(Math.random() * 1000) + 54000,
    redisPort: Math.floor(Math.random() * 1000) + 63000
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
    const backendFramework = options.backendFramework!;
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
    const dockerCmd = hasDocker ? "  docker compose up -d\n" : "";
    const dockerOneLiner = hasDocker ? "docker compose up -d && " : "";
    let backendSetup = "";
    let backendSetupOneLiner = "";

    if (["express", "hono", "elysia"].includes(backendFramework)) {
      backendSetup = `  cd backend\n${dockerCmd}  bun run db:generate\n  bun run db:push\n  cd ..\n`;
      backendSetupOneLiner = `cd backend && ${dockerOneLiner}bun run db:generate && bun run db:push && cd ..`;
    } else if (backendFramework === "laravel") {
      backendSetup = `  cd backend\n${dockerCmd}  php artisan key:generate\n  php artisan migrate\n  cd ..\n`;
      backendSetupOneLiner = `cd backend && ${dockerOneLiner}php artisan key:generate && php artisan migrate && cd ..`;
    } else if (backendFramework === "python") {
      const pipCmd = process.platform === "win32" ? "venv\\Scripts\\pip" : "venv/bin/pip";
      backendSetup = `  cd backend\n${dockerCmd}  python3 -m venv venv\n  ${pipCmd} install -r requirements.txt\n  cd ..\n`;
      backendSetupOneLiner = `cd backend && ${dockerOneLiner}python3 -m venv venv && ${pipCmd} install -r requirements.txt && cd ..`;
    } else if (backendFramework === "go") {
      backendSetup = `  cd backend\n${dockerCmd}  go mod tidy\n  cd ..\n`;
      backendSetupOneLiner = `cd backend && ${dockerOneLiner}go mod tidy && cd ..`;
    } else if (backendFramework === "rust") {
      backendSetup = `  cd backend\n${dockerCmd}  cargo install sqlx-cli\n  sqlx database create\n  sqlx migrate run\n  cd ..\n`;
      backendSetupOneLiner = `cd backend && ${dockerOneLiner}cargo install sqlx-cli && sqlx database create && sqlx migrate run && cd ..`;
    }
    
    outro(`Your boilerplate "${options.projectName}" is ready.

${envInstructions}
Manual Execution:
  cd ${options.projectName}
${installCmd}${backendSetup}  bun run dev

Automated One-liner:
  cd ${options.projectName} && ${installCmd.trim()} && ${backendSetupOneLiner} && bun run dev`);
    return;
  }

  if (["python", "go", "rust"].includes(options.framework)) {
    let langCmds = "";
    let langOneLiner = "";
    if (options.framework === "python") {
      const isWin = process.platform === "win32";
      const activateCmd = isWin ? "venv\\\\Scripts\\\\activate" : "source venv/bin/activate";
      langCmds = `  python -m venv venv\n  ${activateCmd}\n  pip install -r requirements.txt\n  uvicorn app.main:app --reload`;
      langOneLiner = `python -m venv venv && ${activateCmd} && pip install -r requirements.txt && uvicorn app.main:app --reload`;
    } else if (options.framework === "go") {
      langCmds = "  go mod tidy\n  go run cmd/api/main.go";
      langOneLiner = "go mod tidy && go run cmd/api/main.go";
    } else if (options.framework === "rust") {
      langCmds = "  cargo install sqlx-cli\n  sqlx database create\n  sqlx migrate run\n  cargo build\n  cargo run";
      langOneLiner = "cargo install sqlx-cli && sqlx database create && sqlx migrate run && cargo build && cargo run";
    }
    let providers: string[] = [];
    if (options.dbTarget === "supabase") providers.push("Supabase");
    if (options.dbTarget === "neon") providers.push("Neon Serverless Postgres");
    if (options.cachingTarget === "upstash") providers.push("Upstash Redis");
    
    let envInstructions = "Next commands:";
    if (providers.length > 0) {
      const providerString = providers.join(" and ");
      envInstructions = `⚠️  ACTION REQUIRED:\n1. Open "${options.projectName}/.env"\n2. Replace the placeholders with your ${providerString} credentials\n3. Run the following commands to finish setup:`;
    }

    outro(`Your boilerplate "${options.projectName}" is ready.

${envInstructions}
Manual Execution:
  cd ${options.projectName}
${langCmds}

Automated One-liner:
  cd ${options.projectName} && ${langOneLiner}`);
    return;
  }

  if (options.framework === "react" || options.framework === "vue") {
    const providerName = options.authTarget === "clerk" ? "Clerk" : "Supabase";
    let envInstructions = "";
    
    if (options.authTarget !== "local") {
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

  let nodeProviders: string[] = [];
  if (options.dbTarget === "supabase") nodeProviders.push("Supabase");
  if (options.dbTarget === "neon") nodeProviders.push("Neon Serverless Postgres");
  if (options.cachingTarget === "upstash") nodeProviders.push("Upstash Redis");

  if (nodeProviders.length > 0) {
    const providerString = nodeProviders.join(" and ");
    outro(`Your boilerplate "${options.projectName}" is ready.

⚠️  ACTION REQUIRED:
1. Open "${options.projectName}/.env"
2. Replace the placeholders with your ${providerString} credentials
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
