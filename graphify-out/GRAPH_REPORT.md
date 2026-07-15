# Graph Report - qwykz  (2026-07-15)

## Corpus Check
- 140 files · ~36,900 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 801 nodes · 1039 edges · 88 communities (55 shown, 33 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 23 edges (avg confidence: 0.67)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4f1c3e8a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- User
- package-json.ts
- package.json
- express
- AppState
- generator.ts
- compilerOptions
- AuthController
- compilerOptions
- compilerOptions
- compilerOptions
- keywords
- User
- error.middleware.ts
- error.middleware.ts
- build-bin.ts
- auth.go
- README.md
- config.py
- auth.controller.clerk.ts
- auth.controller.supabase.ts
- prisma-client.default.ts
- prisma-client.supabase.ts
- server.ts
- user.controller.zod.ts
- prisma-client.default.ts
- prisma-client.supabase.ts
- auth.controller.clerk.ts
- auth.controller.supabase.ts
- prisma-client.default.ts
- prisma-client.supabase.ts
- server.ts
- user.controller.zod.ts
- health_check
- HealthCheck
- GetUsers
- auth.route.ts
- login.route.ts
- auth.controller.ts
- auth.routes.ts
- health.routes.ts
- user.routes.ts
- user.service.ts
- wait-for-postgres.ts
- redis.docker.ts
- redis.upstash.ts
- user.service.ts
- wait-for-postgres.ts
- auth.routes.ts
- health.routes.ts
- user.routes.ts
- user.service.ts
- wait-for-postgres.ts
- next.config.mjs
- qwykz-app
- Fullstack Managed Authentication Plan
- Contributor Covenant Code of Conduct
- Roadmap
- full-matrix.test.ts
- Security Policy
- Deep analysis
- cli.test.ts
- e2e.test.ts
- AGENTS.md
- test-matrix.sh
- run_test
- run-all-maximized.ts
- test-rust-endpoints.sh
- managed-credentials.test.ts
- User

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 20 edges
2. `readTemplate()` - 19 edges
3. `keywords` - 17 edges
4. `express` - 14 edges
5. `generateExpressProject()` - 13 edges
6. `generateProject()` - 13 edges
7. `AppState` - 13 edges
8. `Fullstack Managed Authentication Plan` - 13 edges
9. `generateHonoProject()` - 12 edges
10. `generateElysiaProject()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `register()` --indirect_call--> `get_password_hash()`  [INFERRED]
  templates/python/app/api/routes/auth.py → templates/python/app/core/security.py
- `login()` --indirect_call--> `verify_password()`  [INFERRED]
  templates/python/app/api/routes/auth.py → templates/python/app/core/security.py
- `runCli()` --calls--> `generateProject()`  [EXTRACTED]
  src/cli.ts → src/generator.ts
- `resolveViteVersions()` --calls--> `resolveLatestVersions()`  [EXTRACTED]
  src/generator.ts → src/npm-registry.ts
- `main()` --calls--> `Connect()`  [INFERRED]
  templates/go/cmd/api/main.go → templates/go/internal/database/database.go

## Import Cycles
- None detected.

## Communities (88 total, 33 thin omitted)

### Community 0 - "User"
Cohesion: 0.08
Nodes (37): BaseModel, DateTime, Enum, FastAPI, SQLModel, str, get_current_user(), get_db() (+29 more)

### Community 1 - "package-json.ts"
Cohesion: 0.08
Nodes (43): ensureBunTmpDir(), ensureLocalPostgresDatabase(), formatCommandFailure(), isVerbose, outputFrom(), projectDatabaseName(), runCli(), runCommand() (+35 more)

### Community 2 - "package.json"
Cohesion: 0.06
Nodes (34): @clack/prompts, cors, bin, qwykz, dependencies, @clack/prompts, cors, picocolors (+26 more)

### Community 3 - "express"
Cohesion: 0.05
Nodes (15): express, supabase, AuthRequest, authMiddleware(), AuthRequest, clerkMiddleware, AuthRequest, supabase (+7 more)

### Community 4 - "AppState"
Cohesion: 0.10
Nodes (34): FromRequestParts, Option, Parts, PgPool, Rejection, Role, Self, AuthResponse (+26 more)

### Community 5 - "generator.ts"
Cohesion: 0.16
Nodes (39): copyDirectoryRecursive(), createVitePackageJson(), generateDbPassword(), generateElysiaProject(), generateExpressProject(), generateGoProject(), generateHonoProject(), generateJwtSecret() (+31 more)

### Community 6 - "compilerOptions"
Cohesion: 0.08
Nodes (25): templates, compilerOptions, allowImportingTsExtensions, allowJs, jsx, lib, module, moduleDetection (+17 more)

### Community 7 - "AuthController"
Cohesion: 0.13
Nodes (7): Controller, AuthController, Request, Request, UserController, AuthService, UserService

### Community 8 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, lib, module, moduleDetection, moduleResolution, noEmit, skipLibCheck (+10 more)

### Community 9 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, lib, module, moduleDetection, moduleResolution, noEmit, skipLibCheck (+10 more)

### Community 10 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, lib, module, moduleDetection, moduleResolution, noEmit, skipLibCheck (+10 more)

### Community 11 - "keywords"
Cohesion: 0.06
Nodes (22): bun, keywords, api, argon2, authentication, boilerplate, cli, docker (+14 more)

### Community 12 - "User"
Cohesion: 0.14
Nodes (10): DB, DeletedAt, Handler, Role, User, main(), Connect(), RequireRole() (+2 more)

### Community 13 - "error.middleware.ts"
Cohesion: 0.16
Nodes (5): authMiddleware, authMiddleware, authMiddleware, supabase, HttpError

### Community 15 - "build-bin.ts"
Cohesion: 0.17
Nodes (9): ENGINE_BUILD, ENGINE_SRC, engineSource, entries, originalEngine, patched, ROOT, templateFiles (+1 more)

### Community 16 - "auth.go"
Cohesion: 0.40
Nodes (5): LoginRequest, RegisterRequest, Ctx, Login(), Register()

### Community 17 - "README.md"
Cohesion: 0.05
Nodes (34): Architecture Overview, Adding a New Template Feature, Contributing Guide, Getting Started, Submitting a PR, Testing Your Changes, Dependency Resolution, The 3-Tier Fallback Strategy (+26 more)

### Community 18 - "config.py"
Cohesion: 0.50
Nodes (3): BaseSettings, Config, Settings

### Community 21 - "prisma-client.default.ts"
Cohesion: 0.50
Nodes (3): adapter, globalPrisma, pool

### Community 22 - "prisma-client.supabase.ts"
Cohesion: 0.50
Nodes (3): adapter, globalPrisma, pool

### Community 25 - "prisma-client.default.ts"
Cohesion: 0.50
Nodes (3): adapter, globalPrisma, pool

### Community 26 - "prisma-client.supabase.ts"
Cohesion: 0.50
Nodes (3): adapter, globalPrisma, pool

### Community 29 - "prisma-client.default.ts"
Cohesion: 0.50
Nodes (3): adapter, globalPrisma, pool

### Community 30 - "prisma-client.supabase.ts"
Cohesion: 0.50
Nodes (3): adapter, globalPrisma, pool

### Community 33 - "health_check"
Cohesion: 0.67
Nodes (3): health_check(), Json, Value

### Community 40 - "auth.controller.ts"
Cohesion: 0.08
Nodes (41): assertAuthFlow(), BackendFramework, BACKENDS, buildSmokeSpecs(), BUN_TMPDIR, CACHE_TARGETS, CacheTarget, childEnv() (+33 more)

### Community 71 - "Fullstack Managed Authentication Plan"
Cohesion: 0.08
Nodes (26): Application profiles use provider identities, Authentication and database choices are independent, Current State, Dependency generation, Environment Contract, Fullstack Managed Authentication Plan, Generated API Contract, Generator Work Breakdown (+18 more)

### Community 72 - "Contributor Covenant Code of Conduct"
Cohesion: 0.15
Nodes (12): 1. Correction, 2. Warning, 3. Temporary Ban, 4. Permanent Ban, Attribution, Contributor Covenant Code of Conduct, Enforcement, Enforcement Guidelines (+4 more)

### Community 73 - "Roadmap"
Cohesion: 0.12
Nodes (17): 1. Dry-run and diff mode, 2. Scaffold manifest, 3. Strict package policy mode, 4. Production-ready Supabase Auth and Clerk, 5. Plugin system, 6. Template validation CI, 7. Generated app smoke tests, 8. AI context pack (+9 more)

### Community 74 - "full-matrix.test.ts"
Cohesion: 0.29
Nodes (5): allProjects, BUN_TMPDIR, fileContains(), fileExists(), ROOT

### Community 75 - "Security Policy"
Cohesion: 0.40
Nodes (4): Reporting a Vulnerability, Security Policy, Supported Versions, What to expect:

### Community 76 - "Deep analysis"
Cohesion: 0.40
Nodes (4): Deep analysis, Default output shape, Reporting rules, Workflow

### Community 77 - "cli.test.ts"
Cohesion: 0.50
Nodes (3): BUN_TMPDIR, CLI_PATH, TMP_BASE

### Community 81 - "test-matrix.sh"
Cohesion: 0.43
Nodes (4): inject_credentials(), run_matrix_test(), test-matrix.sh script, test_endpoints()

### Community 82 - "run_test"
Cohesion: 0.38
Nodes (3): inject_credentials(), run_test(), test-qwykz.sh script

### Community 86 - "managed-credentials.test.ts"
Cohesion: 0.19
Nodes (9): BUN_TMPDIR, childEnv(), CLI_PATH, expectOk(), MANAGED_ENV_KEYS, redact(), ROOT, runCommand() (+1 more)

### Community 87 - "User"
Cohesion: 0.47
Nodes (5): Role, String, Uuid, User, Utc

## Knowledge Gaps
- **304 isolated node(s):** `name`, `version`, `description`, `type`, `url` (+299 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **33 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `keywords` connect `keywords` to `package.json`, `express`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Why does `express` connect `express` to `keywords`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _305 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `User` be split into smaller, more focused modules?**
  _Cohesion score 0.08048103607770583 - nodes in this community are weakly interconnected._
- **Should `package-json.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07673469387755102 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._
- **Should `express` be split into smaller, more focused modules?**
  _Cohesion score 0.052854122621564484 - nodes in this community are weakly interconnected._