/**
 * AI Context Pack — generates AGENTS.md in every scaffolded project.
 * Derived from the same ProjectOptions metadata as the scaffold manifest
 * so that AI tools immediately understand the stack, structure, and conventions.
 */
import type { ProjectOptions, ScaffoldPlan } from "./types";

// ---------------------------------------------------------------------------
// Framework-specific context helpers
// ---------------------------------------------------------------------------

interface FrameworkContext {
  entryPoint: string;
  routePattern: string;
  orm?: string;
  packageManager: string;
  devCommand: string;
  buildCommand?: string;
  extraCommands?: Array<{ command: string; purpose: string }>;
  folderStructure: string;
  addRouteInstruction: string;
  addServiceInstruction: string;
  addMigrationInstruction: string;
  addTestInstruction: string;
}

function getFrameworkContext(
  framework: string,
  dbTarget: string,
  cachingTarget: string,
): FrameworkContext {
  const isDockerDb = dbTarget === "docker";

  switch (framework) {
    case "express":
      return {
        entryPoint: "src/index.ts",
        routePattern: "router.get('/path', handler)",
        orm: "Prisma",
        packageManager: "bun",
        devCommand: "bun run dev",
        buildCommand: "bun run build",
        extraCommands: [
          { command: "bun run db:generate", purpose: "Regenerate Prisma client" },
          { command: "bun run db:push", purpose: "Push Prisma schema to database" },
          { command: "bun run db:studio", purpose: "Open Prisma Studio" },
          { command: "bun run typecheck", purpose: "Run TypeScript type checking" },
          ...(isDockerDb
            ? [{ command: "docker compose up -d", purpose: "Start PostgreSQL + Redis containers" }]
            : []),
        ],
        folderStructure: `src/
├── index.ts              # Entry point (Express app + routes mounted)
├── index.test.ts         # Example test file
├── controllers/
│   ├── auth.controller.ts
│   └── user.controller.ts
├── services/
│   └── user.service.ts
├── middlewares/
│   ├── auth.middleware.ts
│   └── error.middleware.ts
├── routes/
│   ├── auth.routes.ts
│   ├── health.routes.ts
│   └── user.routes.ts
└── lib/
    ├── prisma.ts         # Prisma client singleton
    ${cachingTarget !== "none" ? "└── redis.ts           # Redis client\n" : ""}
prisma/
└── schema.prisma         # Database schema`,
        addRouteInstruction:
          "Create `src/routes/NAME.routes.ts`, add controller import, then mount in `src/index.ts` with `app.use('/api/NAME', NAMERouter)`",
        addServiceInstruction:
          "Create `src/services/NAME.service.ts` with Prisma calls, import in the relevant controller",
        addMigrationInstruction:
          "Edit `prisma/schema.prisma` to add models/fields, then run `bun run db:push`",
        addTestInstruction:
          "Create `src/NAME.test.ts`, run `bun test`",
      };

    case "hono":
      return {
        entryPoint: "src/index.ts",
        routePattern: "app.get('/path', handler)",
        orm: "Prisma",
        packageManager: "bun",
        devCommand: "bun run dev",
        buildCommand: "bun run build",
        extraCommands: [
          { command: "bun run db:generate", purpose: "Regenerate Prisma client" },
          { command: "bun run db:push", purpose: "Push Prisma schema to database" },
          { command: "bun run typecheck", purpose: "Run TypeScript type checking" },
          ...(isDockerDb
            ? [{ command: "docker compose up -d", purpose: "Start PostgreSQL containers" }]
            : []),
        ],
        folderStructure: `src/
├── index.ts              # Entry point (Hono app)
├── controllers/
│   ├── auth.controller.ts
│   └── user.controller.ts
├── services/
│   └── user.service.ts
├── middlewares/
│   ├── auth.middleware.ts
│   └── error.middleware.ts
├── routes/
│   ├── auth.routes.ts
│   ├── health.routes.ts
│   └── user.routes.ts
└── lib/
    └── prisma.ts
prisma/
└── schema.prisma`,
        addRouteInstruction:
          "Create `src/routes/NAME.routes.ts` with a Hono instance, then import and `app.route('/api/NAME', router)` in `src/index.ts`",
        addServiceInstruction:
          "Create `src/services/NAME.service.ts`, import in controller",
        addMigrationInstruction:
          "Edit `prisma/schema.prisma`, then run `bun run db:push`",
        addTestInstruction:
          "Create `src/NAME.test.ts`, run `bun test`",
      };

    case "elysia":
      return {
        entryPoint: "src/index.ts",
        routePattern: "app.get('/path', handler)",
        orm: "Prisma",
        packageManager: "bun",
        devCommand: "bun run dev",
        buildCommand: "bun run build",
        extraCommands: [
          { command: "bun run db:push", purpose: "Push Prisma schema to database" },
          { command: "bun run typecheck", purpose: "Run TypeScript type checking" },
        ],
        folderStructure: `src/
├── index.ts              # Entry point (Elysia app)
├── controllers/
├── services/
├── middlewares/
├── routes/
└── lib/
    └── prisma.ts
prisma/
└── schema.prisma`,
        addRouteInstruction:
          "Create a new Elysia router, import and chain with `.use(router)` in `src/index.ts`",
        addServiceInstruction:
          "Create `src/services/NAME.service.ts`, import in controller",
        addMigrationInstruction:
          "Edit `prisma/schema.prisma`, run `bun run db:push`",
        addTestInstruction:
          "Create `src/NAME.test.ts`, run `bun test`",
      };

    case "python":
      return {
        entryPoint: "app/main.py",
        routePattern: "@app.get('/path')",
        orm: "SQLAlchemy",
        packageManager: "pip (venv)",
        devCommand: "venv/bin/uvicorn app.main:app --reload",
        extraCommands: [
          { command: "source venv/bin/activate", purpose: "Activate virtual environment" },
          { command: "pip install -r requirements.txt", purpose: "Install dependencies" },
        ],
        folderStructure: `app/
├── main.py               # FastAPI app entry point
├── api/                  # Route handlers
├── core/                 # Config, database, auth
└── models/               # SQLAlchemy models
requirements.txt
Dockerfile`,
        addRouteInstruction:
          "Create a new APIRouter in `app/api/NAME.py`, import and include in `app/main.py`",
        addServiceInstruction:
          "Add service functions in `app/api/NAME.py` or a dedicated service module",
        addMigrationInstruction:
          "Add models in `app/models/`, use Alembic or `Base.metadata.create_all()` for schema sync",
        addTestInstruction:
          "Create `tests/test_NAME.py`, run `pytest`",
      };

    case "go":
      return {
        entryPoint: "cmd/api/main.go",
        routePattern: "app.Get('/path', handler)",
        orm: "GORM",
        packageManager: "go mod",
        devCommand: "go run cmd/api/main.go",
        buildCommand: "go build ./...",
        extraCommands: [
          { command: "go mod tidy", purpose: "Install/sync Go dependencies" },
          { command: "go test ./...", purpose: "Run tests" },
        ],
        folderStructure: `cmd/api/
└── main.go               # Entry point
internal/
├── database/             # DB connection
├── handlers/             # Route handlers
├── middleware/           # Auth, logging
└── models/               # Data models
go.mod
Dockerfile`,
        addRouteInstruction:
          "Add handler in `internal/handlers/`, register route in `cmd/api/main.go`",
        addServiceInstruction:
          "Add business logic in `internal/handlers/` or a new `internal/services/` package",
        addMigrationInstruction:
          "Add GORM model in `internal/models/`, add to AutoMigrate in database setup",
        addTestInstruction:
          "Create `internal/NAME_test.go`, run `go test ./...`",
      };

    case "rust":
      return {
        entryPoint: "src/main.rs",
        routePattern: "Router::new().route('/path', get(handler))",
        orm: "SQLx",
        packageManager: "cargo",
        devCommand: "cargo run",
        buildCommand: "cargo build --release",
        extraCommands: [
          { command: "cargo check", purpose: "Type check without building" },
          { command: "sqlx migrate run", purpose: "Run database migrations" },
          { command: "cargo test", purpose: "Run tests" },
        ],
        folderStructure: `src/
├── main.rs               # Entry point
├── api/                  # Axum route handlers
└── db/                   # Database layer
migrations/               # SQL migration files
Cargo.toml`,
        addRouteInstruction:
          "Add handler in `src/api/`, add route to Router in `src/main.rs`",
        addServiceInstruction:
          "Add functions in `src/db/` for database queries",
        addMigrationInstruction:
          "Create a new `.sql` file in `migrations/`, run `sqlx migrate run`",
        addTestInstruction:
          "Add `#[cfg(test)] mod tests` block, run `cargo test`",
      };

    case "laravel":
      return {
        entryPoint: "routes/api.php",
        routePattern: "Route::get('/path', [Controller::class, 'method'])",
        orm: "Eloquent",
        packageManager: "composer",
        devCommand: "php artisan serve",
        extraCommands: [
          { command: "php artisan migrate", purpose: "Run database migrations" },
          { command: "php artisan make:controller NAMEController", purpose: "Create a controller" },
          { command: "php artisan make:model NAME -m", purpose: "Create model + migration" },
          { command: "php artisan test", purpose: "Run tests" },
        ],
        folderStructure: `app/
├── Http/
│   ├── Controllers/      # Route controllers
│   └── Middleware/       # Auth, rate limiting
└── Models/               # Eloquent models
routes/
└── api.php               # API route definitions
database/
└── migrations/`,
        addRouteInstruction:
          "Add route in `routes/api.php`, create controller with `php artisan make:controller`",
        addServiceInstruction:
          "Create a Service class in `app/Services/`",
        addMigrationInstruction:
          "Run `php artisan make:migration create_NAME_table`, then `php artisan migrate`",
        addTestInstruction:
          "Create test with `php artisan make:test NAMETest`, run `php artisan test`",
      };

    case "nextjs":
      return {
        entryPoint: "app/page.tsx",
        routePattern: "export default function Page() { ... }",
        orm: "Prisma",
        packageManager: "bun",
        devCommand: "bun run dev",
        buildCommand: "bun run build",
        extraCommands: [
          { command: "bun run db:push", purpose: "Push Prisma schema" },
          { command: "bun run typecheck", purpose: "TypeScript check" },
        ],
        folderStructure: `app/
├── page.tsx              # Root page
├── layout.tsx            # Root layout
├── api/                  # API route handlers
└── components/           # React components
prisma/
└── schema.prisma`,
        addRouteInstruction:
          "Create `app/api/NAME/route.ts` with exported GET/POST handlers",
        addServiceInstruction:
          "Create a server-side service in `lib/NAME.ts`",
        addMigrationInstruction:
          "Edit `prisma/schema.prisma`, run `bun run db:push`",
        addTestInstruction:
          "Create `__tests__/NAME.test.ts`, run `bun test`",
      };

    case "react":
    case "vue":
      return {
        entryPoint: framework === "react" ? "src/main.tsx" : "src/main.ts",
        routePattern:
          framework === "react"
            ? "<Route path='/path' element={<Component />} />"
            : "<RouterView /> with router config",
        packageManager: "bun",
        devCommand: "bun run dev",
        buildCommand: "bun run build",
        folderStructure: `src/
├── ${framework === "react" ? "main.tsx" : "main.ts"}         # Entry point
├── App.${framework === "react" ? "tsx" : "vue"}             # Root component
├── components/           # Reusable components
└── lib/                  # Utilities, API client
index.html
vite.config.ts`,
        addRouteInstruction:
          framework === "react"
            ? "Add a new component in `src/components/`, add route in the router config"
            : "Add a new `.vue` component in `src/components/`, add route to `src/router/`",
        addServiceInstruction:
          "Add API functions in `src/lib/api.ts`",
        addMigrationInstruction:
          "N/A — this is a frontend-only scaffold. Database is managed by the backend.",
        addTestInstruction:
          "Create component tests with Vitest — `bun run test`",
      };

    default:
      return {
        entryPoint: "src/index.ts",
        routePattern: "framework.get('/path', handler)",
        packageManager: "bun",
        devCommand: "bun run dev",
        folderStructure: "src/\n└── index.ts",
        addRouteInstruction: "Add route in the main router file",
        addServiceInstruction: "Create a service module",
        addMigrationInstruction: "Run database migration command",
        addTestInstruction: "Create test file, run test suite",
      };
  }
}

// ---------------------------------------------------------------------------
// Auth section helper
// ---------------------------------------------------------------------------

function getAuthSection(
  authTarget: string,
  framework: string,
): string {
  if (authTarget === "local") {
    return `## Auth Model
- Registration : POST \`/api/auth/register\` with \`{ email, password }\`
- Login        : POST \`/api/auth/login\` with \`{ email, password }\`
- Token type   : JWT Bearer — include as \`Authorization: Bearer <token>\` on protected routes
- Passwords    : hashed with Argon2
- Tokens       : signed with jsonwebtoken (HS256)
- Protected    : routes use \`auth.middleware.ts\` to verify the Bearer token`;
  }

  if (authTarget === "supabase") {
    return `## Auth Model (Supabase Auth)
- Status: experimental
- Authentication is handled by Supabase — users sign in via the Supabase client SDK
- The frontend obtains a short-lived JWT from Supabase after sign-in
- Include the token as \`Authorization: Bearer <supabase-jwt>\` on API requests
- Node backends verify the token with \`supabase.auth.getUser(token)\`
- Current generated backends expose provider-backed register/login routes; profile synchronization is not implemented
- Required env vars: \`SUPABASE_URL\` and \`SUPABASE_ANON_KEY\``;
  }

  if (authTarget === "clerk") {
    return `## Auth Model (Clerk Auth)
- Status: experimental
- Authentication is handled by Clerk — users sign in via the Clerk React/Vue component
- The frontend obtains a session token from Clerk after sign-in
- Include the token as \`Authorization: Bearer <clerk-session-token>\` on API requests
- Node backends verify the token using the generated Clerk middleware
- Application profile synchronization is not implemented
- Required env vars: \`CLERK_PUBLISHABLE_KEY\` (frontend), \`CLERK_SECRET_KEY\` (backend)`;
  }

  return `## Auth Model
- Auth target: ${authTarget}`;
}

// ---------------------------------------------------------------------------
// Environment section helper
// ---------------------------------------------------------------------------

function getEnvSection(
  dbTarget: string,
  authTarget: string,
  cachingTarget: string,
  framework: string,
): string {
  const vars: Array<{ key: string; description: string }> = [];

  if (dbTarget === "docker" || dbTarget === "local") {
    vars.push({ key: "DATABASE_URL", description: "PostgreSQL connection string" });
  } else if (dbTarget === "supabase") {
    vars.push({ key: "DATABASE_URL", description: "Supabase PostgreSQL connection string" });
    vars.push({ key: "SUPABASE_URL", description: "Supabase project URL" });
    vars.push({ key: "SUPABASE_ANON_KEY", description: "Supabase public anon key" });
  } else if (dbTarget === "neon") {
    vars.push({ key: "DATABASE_URL", description: "Neon serverless PostgreSQL connection string" });
  }

  if (authTarget === "local") {
    vars.push({ key: "JWT_SECRET", description: "Secret key for signing JWT tokens (auto-generated)" });
  } else if (authTarget === "clerk") {
    vars.push({ key: "CLERK_PUBLISHABLE_KEY", description: "Clerk publishable key (safe for frontend)" });
    vars.push({ key: "CLERK_SECRET_KEY", description: "Clerk secret key (backend only — never expose)" });
  } else if (authTarget === "supabase") {
    if (framework === "react" || framework === "vue") {
      vars.push({ key: "VITE_SUPABASE_URL", description: "Supabase project URL (public)" });
      vars.push({ key: "VITE_SUPABASE_ANON_KEY", description: "Supabase anonymous key (public)" });
    }
  }

  if (cachingTarget === "docker") {
    vars.push({ key: "REDIS_URL", description: "Redis connection URL (auto-configured for Docker)" });
  } else if (cachingTarget === "upstash") {
    vars.push({ key: "UPSTASH_REDIS_REST_URL", description: "Upstash Redis REST URL" });
    vars.push({ key: "UPSTASH_REDIS_REST_TOKEN", description: "Upstash Redis REST token" });
  }

  const rows = vars
    .map((v) => `| \`${v.key}\` | ${v.description} |`)
    .join("\n");

  return `## Environment Variables

| Variable | Description |
|----------|-------------|
${rows}

Configure these in \`.env\` before running the project.`;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Generate the content of an AGENTS.md file for the given project options.
 * This file helps AI tools (Claude, Copilot, Cursor, etc.) navigate the
 * generated project without spending tokens rediscovering conventions.
 */
function renderPlanTree(files: ScaffoldPlan["files"]): string {
  const root: Record<string, unknown> = {};
  for (const file of files) {
    let node = root;
    for (const part of file.path.split("/")) {
      node[part] ??= {};
      node = node[part] as Record<string, unknown>;
    }
  }

  const lines: string[] = [];
  function walk(node: Record<string, unknown>, prefix = ""): void {
    const entries = Object.entries(node).sort(([a], [b]) => a.localeCompare(b));
    entries.forEach(([name, value], index) => {
      const children = value as Record<string, unknown>;
      const last = index === entries.length - 1;
      const directory = Object.keys(children).length > 0;
      lines.push(`${prefix}${last ? "└──" : "├──"} ${name}${directory ? "/" : ""}`);
      if (directory) walk(children, `${prefix}${last ? "    " : "│   "}`);
    });
  }
  walk(root);
  return lines.join("\n");
}

export function generateContextPack(input: ProjectOptions | ScaffoldPlan): string {
  const plan: ScaffoldPlan | undefined = "files" in input ? input : undefined;
  const options: ProjectOptions = plan ? plan.options : input as ProjectOptions;
  const framework = options.framework === "monorepo"
    ? (options.backendFramework ?? "express")
    : options.framework;

  const ctx = getFrameworkContext(
    framework,
    options.dbTarget,
    options.cachingTarget,
  );

  const isMonorepo = options.framework === "monorepo";
  const frontendCtx = isMonorepo && options.frontendFramework
    ? getFrameworkContext(options.frontendFramework, options.dbTarget, options.cachingTarget)
    : null;

  const commandRows = [
    ...(ctx.extraCommands ?? []).map((c) => `| \`${c.command}\` | ${c.purpose} |`),
    ...(ctx.buildCommand ? [`| \`${ctx.buildCommand}\` | Build for production |`] : []),
  ].join("\n");

  const authSection = getAuthSection(options.authTarget, framework);
  const envSection = getEnvSection(
    options.dbTarget,
    options.authTarget,
    options.cachingTarget,
    framework,
  );

  const stackSummary = [
    `- **Framework** : ${options.framework}`,
    `- **Database**  : ${options.dbTarget}`,
    `- **Auth**      : ${options.authTarget}`,
    `- **Caching**   : ${options.cachingTarget}`,
    ...(isMonorepo && options.frontendFramework ? [`- **Frontend** : ${options.frontendFramework}`] : []),
    ...(isMonorepo && options.backendFramework ? [`- **Backend**  : ${options.backendFramework}`] : []),
    ...(options.deploymentTarget ? [`- **Deployment**: ${options.deploymentTarget}`] : []),
    ...(ctx.orm ? [`- **ORM**       : ${ctx.orm}`] : []),
    `- **Runtime**   : ${ctx.packageManager}`,
  ].join("\n");

  const howToAdd = [
    `- **Add a route**     : ${ctx.addRouteInstruction}`,
    `- **Add a service**   : ${ctx.addServiceInstruction}`,
    `- **Add a migration** : ${ctx.addMigrationInstruction}`,
    `- **Add a test**      : ${ctx.addTestInstruction}`,
    ...(frontendCtx ? [
      `- **Add a frontend route** : ${frontendCtx.addRouteInstruction}`,
    ] : []),
  ].join("\n");

  const isStandaloneFrontend = options.framework === "react" || options.framework === "vue";
  const apiSection = isStandaloneFrontend
    ? `## API Endpoints

This is a frontend-only scaffold. Configure \`VITE_API_URL\` to call an external API.`
    : `## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | \`/api/health\` | Health check |
| POST | \`/api/auth/register\` | Register through the configured auth implementation |
| POST | \`/api/auth/login\` | Login through the configured auth implementation |
| GET | \`/api/users\` | List users (authenticated) |`;

  return `# AGENTS.md

> This file was generated by [qwykz](https://github.com/MarcZxc1/qwykz).
> It gives AI tools immediate context about this project's stack and conventions.

## Stack

${stackSummary}

## Folder Structure

\`\`\`
${plan
  ? renderPlanTree(plan.files)
  : isMonorepo
  ? `${options.projectName}/
├── backend/              # ${options.backendFramework ?? "backend"} API
├── frontend/             # ${options.frontendFramework ?? "frontend"} SPA
└── package.json          # Monorepo root (bun workspaces)`
  : ctx.folderStructure}
\`\`\`

## Commands

| Command | Purpose |
|---------|---------|
| \`${ctx.devCommand}\` | Start development server |
${commandRows ? commandRows : ""}

## How To Add...

${howToAdd}

${authSection}

${envSection}

${apiSection}

---
*Generated by qwykz — keep this file updated as the project evolves.*
`;
}
