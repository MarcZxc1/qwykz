# Graph Report - qwykz  (2026-09-06)

## Corpus Check
- 193 files · ~56,630 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1132 nodes · 1676 edges · 116 communities (77 shown, 39 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 23 edges (avg confidence: 0.67)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `04cd6b7c`
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
- e2e.old.test.ts
- AGENTS.md
- test-matrix.sh
- run_test
- run-all-maximized.ts
- test-monorepo.ts
- test-rust-endpoints.sh
- managed-credentials.test.ts
- User
- plugin.json
- matrix.ts
- Priority 1: Trust And Predictability — Implementation Plan
- Feature 8: AI Context Pack
- Feature 6: Template Validation CI
- prompts.ts
- Priority 3: Extensibility (Plugin System) — Implementation Plan
- files
- npm-registry.ts
- cli.ts
- dry-run.ts
- context-pack.ts
- scripts
- home.md
- Runtime Smoke Test Report - 2026-07-15
- dependencies
- Plugin Authoring
- devDependencies
- Contributing Guide
- Usage
- README.md
- template-engine.md
- plugin-e2e.test.ts
- roadmap-foundations.test.ts
- peerDependencies
- repository
- generate-smoke-report.ts
- dependency-resolution.md

## God Nodes (most connected - your core abstractions)
1. `readTemplate()` - 28 edges
2. `compilerOptions` - 20 edges
3. `ProjectOptions` - 19 edges
4. `keywords` - 17 edges
5. `buildScaffoldPlan()` - 16 edges
6. `express` - 14 edges
7. `files` - 14 edges
8. `generateExpressProject()` - 14 edges
9. `LoadedPlugin` - 14 edges
10. `runCli()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `main()` --calls--> `generateProject()`  [EXTRACTED]
  tests/scripts/test-monorepo.ts → src/generator/scaffold-plan.ts
- `register()` --indirect_call--> `get_password_hash()`  [INFERRED]
  templates/python/app/api/routes/auth.py → templates/python/app/core/security.py
- `login()` --indirect_call--> `verify_password()`  [INFERRED]
  templates/python/app/api/routes/auth.py → templates/python/app/core/security.py
- `runCli()` --calls--> `buildScaffoldPlan()`  [EXTRACTED]
  src/cli.ts → src/generator/scaffold-plan.ts
- `runCli()` --calls--> `writePlan()`  [EXTRACTED]
  src/cli.ts → src/generator/scaffold-plan.ts

## Import Cycles
- None detected.

## Communities (116 total, 39 thin omitted)

### Community 0 - "User"
Cohesion: 0.08
Nodes (37): BaseModel, DateTime, Enum, FastAPI, SQLModel, str, get_current_user(), get_db() (+29 more)

### Community 1 - "package-json.ts"
Cohesion: 0.18
Nodes (5): AuthRequest, authMiddleware(), AuthRequest, clerkMiddleware, HttpError

### Community 2 - "package.json"
Cohesion: 0.22
Nodes (8): bin, qwykz, description, license, module, name, type, version

### Community 3 - "express"
Cohesion: 0.12
Nodes (5): express, supabase, authRouter, healthRouter, userRouter

### Community 4 - "AppState"
Cohesion: 0.08
Nodes (40): FromRequestParts, Option, Parts, PgPool, Rejection, Role, Self, AuthResponse (+32 more)

### Community 5 - "generator.ts"
Cohesion: 0.18
Nodes (5): argon2, loginSchema, registerSchema, loginSchema, registerSchema

### Community 6 - "compilerOptions"
Cohesion: 0.08
Nodes (25): compilerOptions, allowImportingTsExtensions, allowJs, jsx, lib, module, moduleDetection, moduleResolution (+17 more)

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
Cohesion: 0.13
Nodes (15): bun, keywords, api, authentication, boilerplate, cli, docker, generator (+7 more)

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
Cohesion: 0.18
Nodes (11): Contributing, Documentation, Features, Interactive Mode, Key CLI Flags, License, Non-Interactive (Automated), Quickstart (+3 more)

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
Cohesion: 0.21
Nodes (15): ScaffoldPlan, validateCoverage(), packageName(), validateImports(), runValidation(), validatePlaceholders(), getValidationPlans(), REPRESENTATIVE_OPTIONS (+7 more)

### Community 75 - "Security Policy"
Cohesion: 0.40
Nodes (4): Reporting a Vulnerability, Security Policy, Supported Versions, What to expect:

### Community 76 - "Deep analysis"
Cohesion: 0.40
Nodes (4): Deep analysis, Default output shape, Reporting rules, Workflow

### Community 77 - "cli.test.ts"
Cohesion: 0.50
Nodes (3): BUN_TMPDIR, CLI_PATH, TMP_BASE

### Community 79 - "e2e.old.test.ts"
Cohesion: 0.09
Nodes (29): initPlugin(), listPlugins(), runPluginCli(), validatePlugin(), discoverPluginDirectories(), getPluginSearchPaths(), PluginRegistry, registry (+21 more)

### Community 81 - "test-matrix.sh"
Cohesion: 0.43
Nodes (4): inject_credentials(), run_matrix_test(), test-matrix.sh script, test_endpoints()

### Community 82 - "run_test"
Cohesion: 0.38
Nodes (3): inject_credentials(), run_test(), test-qwykz.sh script

### Community 84 - "test-monorepo.ts"
Cohesion: 0.07
Nodes (27): Acceptance Criteria, Acceptance Criteria, Acceptance Criteria, Acceptance Criteria, Architecture, `AuthenticatedIdentity` Contract, Capability Matrix After Phase 1, Estimated Effort (+19 more)

### Community 86 - "managed-credentials.test.ts"
Cohesion: 0.19
Nodes (9): BUN_TMPDIR, childEnv(), CLI_PATH, expectOk(), MANAGED_ENV_KEYS, redact(), ROOT, runCommand() (+1 more)

### Community 87 - "User"
Cohesion: 0.09
Nodes (26): FrameworkContext, generateContextPack(), getAuthSection(), getEnvSection(), getFrameworkContext(), renderPlanTree(), generateProjectFiles(), AUTH_PACKAGES (+18 more)

### Community 88 - "plugin.json"
Cohesion: 0.09
Nodes (22): author, capabilities, authProviders, deploymentTargets, frameworks, fastify, description, @types/node (+14 more)

### Community 89 - "matrix.ts"
Cohesion: 0.06
Nodes (50): ICON, rows, CAPABILITY_MATRIX, combineStatuses(), frontendCapabilities(), getCapability(), getFrameworkCapabilities(), getProjectCapability() (+42 more)

### Community 90 - "Priority 1: Trust And Predictability — Implementation Plan"
Cohesion: 0.11
Nodes (18): 1. Dry-Run And Diff Mode (`--dry-run`), 2. Scaffold Manifest, 3. Strict Package Policy Mode (`--strict`), Acceptance Criteria, Acceptance Criteria, Acceptance Criteria, Design, Design (+10 more)

### Community 91 - "Feature 8: AI Context Pack"
Cohesion: 0.11
Nodes (18): Acceptance Criteria, Acceptance Criteria, Cross-cutting: Sync Between Features, Estimated Effort, Feature 8: AI Context Pack, Feature 9: Public Capability Matrix, Generated Content Template, Human-readable (README/docs) (+10 more)

### Community 92 - "Feature 6: Template Validation CI"
Cohesion: 0.11
Nodes (17): Acceptance Criteria, Acceptance Criteria, CI Matrix Strategy, Current Baseline, Current State, Estimated Effort, Expansion Tasks, Feature 6: Template Validation CI (+9 more)

### Community 93 - "prompts.ts"
Cohesion: 0.29
Nodes (6): Execution Sequence, Generator Modularization Plan, Invariants, Non-goals, Objective, Target Layout

### Community 94 - "Priority 3: Extensibility (Plugin System) — Implementation Plan"
Cohesion: 0.13
Nodes (14): Estimated Effort, Implementation Steps, Objective, Phase A — Plugin Infrastructure, Phase B — Integration With Core, Phase C — Plugin Lifecycle, Phase D — Developer Experience, Phase E — Tests (+6 more)

### Community 95 - "files"
Cohesion: 0.14
Nodes (14): files, src/, templates/, bun.lock, capability-matrix.json, CODE_OF_CONDUCT.md, docs/, examples/ (+6 more)

### Community 96 - "npm-registry.ts"
Cohesion: 0.08
Nodes (72): FrameworkGenerator, BUILT_IN_GENERATORS, generateMonorepo(), getBackendCommand(), generateLaravelProject(), generateGoProject(), generatePythonProject(), generateRustProject() (+64 more)

### Community 100 - "scripts"
Cohesion: 0.22
Nodes (9): scripts, build:bin, capabilities:generate, report:runtime, test, test:managed, test:runtime, test:runtime:laravel (+1 more)

### Community 101 - "home.md"
Cohesion: 0.26
Nodes (4): Architecture Overview, qwykz Capability Matrix, qwykz Wiki, Table of Contents

### Community 102 - "Runtime Smoke Test Report - 2026-07-15"
Cohesion: 0.20
Nodes (7): Interpretation, Laravel External Runtime Run, Runtime Smoke Test Report - 2026-07-15, Runtime Time By Backend, Runtime Time By Surface, Slowest Cases, Summary

### Community 103 - "dependencies"
Cohesion: 0.29
Nodes (7): @clack/prompts, cors, dependencies, @clack/prompts, cors, picocolors, picocolors

### Community 104 - "Plugin Authoring"
Cohesion: 0.33
Nodes (6): Authentication and deployment overlays, Directory contract, Hooks, Plugin Authoring, Template variables, Validate and use

### Community 105 - "devDependencies"
Cohesion: 0.29
Nodes (7): devDependencies, @types/bun, @types/cors, @types/node, @types/node, @types/bun, @types/cors

### Community 106 - "Contributing Guide"
Cohesion: 0.40
Nodes (5): Adding a New Template Feature, Contributing Guide, Getting Started, Submitting a PR, Testing Your Changes

### Community 107 - "Usage"
Cohesion: 0.40
Nodes (5): Laravel Provider Configuration, Managed Credential Smoke Tests, Runtime Smoke Tests, Test Suites, Testing & Verification Guide

### Community 108 - "README.md"
Cohesion: 0.50
Nodes (4): Docker Resource and Data Lifecycle, Managed Volume Inventory, PostgreSQL Volume Lifecycle, Resetting Data

### Community 109 - "template-engine.md"
Cohesion: 0.50
Nodes (3): Compiled Mode vs Development Mode, The Template Engine, Variable Injection

### Community 110 - "plugin-e2e.test.ts"
Cohesion: 0.50
Nodes (3): CLI_PATH, ROOT, TMP_ROOT

### Community 112 - "peerDependencies"
Cohesion: 0.67
Nodes (3): typescript, peerDependencies, typescript

### Community 113 - "repository"
Cohesion: 0.67
Nodes (3): repository, type, url

## Knowledge Gaps
- **451 isolated node(s):** `$schema`, `name`, `version`, `description`, `author` (+446 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **39 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `keywords` connect `keywords` to `package.json`, `express`, `generator.ts`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Why does `express` connect `express` to `cli.ts`, `dry-run.ts`, `context-pack.ts`, `package-json.ts`, `keywords`, `roadmap-foundations.test.ts`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Why does `buildScaffoldPlan()` connect `User` to `npm-registry.ts`, `matrix.ts`, `full-matrix.test.ts`, `e2e.old.test.ts`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **What connects `$schema`, `name`, `version` to the rest of the system?**
  _452 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `User` be split into smaller, more focused modules?**
  _Cohesion score 0.07801418439716312 - nodes in this community are weakly interconnected._
- **Should `express` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._
- **Should `AppState` be split into smaller, more focused modules?**
  _Cohesion score 0.08233117483811286 - nodes in this community are weakly interconnected._