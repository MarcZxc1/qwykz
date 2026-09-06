# Roadmap

This page tracks the next features that will make `qwykz` more reliable, more auditable, and easier for the community to extend.

## Priority 1: Trust And Predictability

### 1. Dry-run and diff mode

Goal: let users preview the exact scaffold before anything is written.

Scope:

* Show the target directory tree.
* Show the package additions and script changes.
* Show a unified diff for generated files.
* Support both interactive and `--yes` modes.

Why this matters:

* It removes guesswork.
* It makes prompt choices auditable.
* It helps users catch wrong framework/auth selections before files are created.

### 2. Scaffold manifest

Goal: write a machine-readable manifest into every generated project.

Scope:

* Record selected framework, auth target, db target, and cache target.
* Record added packages and versions.
* Record generator version and template version.
* Optionally include the prompt answers that led to the scaffold.

Why this matters:

* It makes generated projects reproducible.
* It gives contributors a fast way to inspect what qwykz decided.
* It helps debug template drift later.

### 3. Strict package policy mode

Goal: make package installation deterministic and explicit.

Scope:

* Add a mode such as `--strict` or `--policy locked`.
* Install only the framework/runtime packages required by the selected stack.
* Add only explicitly selected optional packages.
* Print the reason for every package that is added.

Why this matters:

* It directly addresses the reliability concern.
* It reduces surprise dependencies.
* It makes generated manifests easier to review in CI and in pull requests.

Current status:

* Implemented one exact `ScaffoldPlan` used by dry-run and real writes.
* Every scaffold now records package reasons, template checksums, capability status, and optional prompt answers in `.qwykz-manifest.json`.
* `--dry-run`, `--show-diff`, `--strict`, and target-write safety are covered by CLI integration tests.

## Priority 2: Managed Fullstack Authentication

### 4. Production-ready Supabase Auth and Clerk

Goal: provide verified, provider-native authentication across generated frontends and APIs without mixing authentication with database selection.

Scope:

* Stabilize React/Vue with Express, Hono, and Elysia first.
* Let provider SDKs own sign-in/sign-up and make backends verify bearer tokens.
* Normalize provider identities into application profiles and roles.
* Add negative token tests, response privacy tests, and compiled-binary coverage.
* Expand to Next.js, FastAPI, Laravel, Go, and Rust only after the Node contract passes.

Why this matters:

* Managed authentication is a high-value fullstack feature.
* A strict security contract prevents superficial SDK-only scaffolding.
* A capability matrix ensures qwykz advertises only combinations that are implemented and tested.

Detailed plan: [Fullstack Managed Authentication Plan](fullstack-managed-auth-plan.md).

## Priority 3: Extensibility

### 5. Plugin system

Goal: let the community add supported stacks without editing the core generator.

Scope:

* Define a plugin manifest format.
* Support plugin registration for frameworks, auth providers, and deployment targets.
* Load plugin metadata into prompts and generation logic.
* Add validation so plugins cannot register invalid package sets or broken templates.

Why this matters:

* It increases the long-term value of the project.
* It lowers the cost of adding new frameworks.
* It keeps core logic smaller and easier to maintain.

Current status:

* Framework plugins support discovery, validation, non-interactive generation, template variables, packages, scripts, hooks, and manifest attribution.
* Auth-provider and deployment capabilities can apply validated template overlays.
* Added plugin CLI commands, an authoring guide, a reference Fastify plugin, and end-to-end plugin generation coverage.

## Priority 4: Reliability Automation

### 6. Template validation CI

Goal: verify that prompts, templates, manifests, and package selection stay aligned.

Scope:

* Check for unresolved placeholders.
* Check that generated imports match installed packages.
* Check that selected prompt options map to valid scaffold output.
* Check that tests cover every supported stack combination.

Why this matters:

* It prevents drift from coming back.
* It makes releases safer.
* It gives open-source contributors a clear quality bar.

Current status:

* CI validates generated outputs for unresolved placeholders, undeclared imports, prompt/capability mapping, syntax, and stack coverage.
* Validation failures return a non-zero exit code and are covered with known-bad test cases.

### 7. Generated app smoke tests

Goal: prove that generated projects do more than contain the expected files.

Scope:

* Maintain an opt-in runtime smoke matrix through `bun run test:runtime`.
* Cover Backend API projects across Express, Hono, Elysia, Laravel, FastAPI, Go, and Rust.
* Cover fullstack React/Vue monorepos across every supported backend.
* Exercise Docker PostgreSQL, local PostgreSQL, no cache, and Docker Redis combinations.
* Install dependencies for each supported generated stack in CI.
* Run framework-level validation such as typecheck, build, `go test`, `cargo check`, or Python import checks.
* Start generated APIs where practical and verify `/api/health` with `curl`.
* Send JSON payloads to `/api/auth/register` and `/api/auth/login` and assert successful HTTP responses.
* Validate generated Docker Compose files with `docker compose config`.
* Keep heavier Laravel and full-matrix runtime runs opt-in locally, but run them in scheduled or release CI.

Why this matters:

* It catches broken setup instructions and missing runtime dependencies.
* It catches route, payload, migration, local database, Docker, and Redis wiring regressions.
* It makes qwykz more trustworthy for beginners who may not know how to debug scaffold failures.
* It turns generated output into a tested product surface, not just copied files.

Current status:

* Added a generated runtime smoke matrix covering 28 Backend API combinations, 56 fullstack combinations, and 4 Next.js combinations.
* Runtime smoke tests are opt-in and filterable with `QWYKZ_RUN_RUNTIME_SMOKE=1` and `QWYKZ_SMOKE_FILTER`.
* Representative Docker, local PostgreSQL, Redis, and fullstack cases have been verified locally.
* Recorded the first runtime report in [Runtime Smoke Test Report - 2026-07-15](runtime-smoke-report-2026-07-15.md): default run 77 passed / 12 Laravel external skipped / 0 failed, dedicated Laravel run 13 passed / 0 failed.
* Combined default plus Laravel runtime evidence covers all 88 generated runtime cases.

## Priority 5: AI-Assisted Developer Experience

### 8. AI context pack

Goal: make every generated project easier for AI tools, skills, and agents to understand without spending tokens rediscovering the scaffold.

Scope:

* Generate an `AGENTS.md` or `AI_CONTEXT.md` file in each scaffold.
* Document the selected stack, folder structure, core commands, routes, auth model, database target, and cache target.
* Include concise instructions for where to add routes, services, models, migrations, and tests.
* Keep the content factual and generated from the same metadata used by the scaffold manifest.

Why this matters:

* It directly supports qwykz's token-saving goal.
* It reduces AI hallucination around database, ORM, auth, and folder conventions.
* It helps beginners work with AI from a known project structure instead of a blank prompt.

### 9. Public capability matrix

Goal: make supported combinations explicit before users generate a project.

Scope:

* Add a README/docs matrix for stack, database target, auth target, Redis support, Dockerfile support, and test coverage.
* Mark combinations as supported, experimental, planned, or unsupported.
* Keep the matrix aligned with prompts and CI coverage.
* Reject unsupported combinations before writing files.

Why this matters:

* It prevents overpromising.
* It helps users choose the right stack quickly.
* It makes qwykz's enterprise-inspired positioning more credible by showing exactly what is verified.

Current status:

* Every scaffold generates a factual `AGENTS.md` by default; `--no-ai-context` opts out.
* The versioned capability matrix generates both Markdown and JSON and gates unsupported or experimental selections before target files are written.

## Priority 6: Curated Stacks & Production Readiness

### 10. Curated stack presets

Goal: provide zero-decision, single-flag scaffolding for popular fullstack and backend architectures.

Scope:

* 17 curated stack presets covering Rust Axum, Go Fiber, Python FastAPI, Elysia, Hono, Express, Laravel, Next.js, React, Vue, and fullstack monorepos.
* Ergonomic short aliases (`rust`, `go`, `fastapi`, `elysia`, `hono`, `express`, `laravel`, `nextjs`, `react`, `vue`, and monorepos).
* Interactive selection menu and CLI flags (`--preset <name-or-alias>`, `--list-presets`).
* Full integration with capability matrix gating and manifest attribution.

Current status:

* Completed. All 17 presets are defined in `src/presets.ts`, documented in `docs/presets.md`, and tested across CLI, unit, and runtime suites.

### 11. Next.js App Router graduation to supported

Goal: graduate Next.js App Router from experimental to fully supported across core database and auth combinations.

Scope:

* Pure in-memory scaffolding without external bootstrap dependencies.
* Support local PostgreSQL, Docker PostgreSQL, and Supabase database configurations via Prisma adapter-pg.
* Activate full test matrix coverage in `tests/full-matrix.test.ts` and `tests/e2e.test.ts`.

Current status:

* Completed. Promoted to `supported` in `capability-matrix.json` and `docs/capability-matrix.md` with active E2E and matrix test coverage.

### 12. Deterministic staging and deduplication

Goal: prevent file collisions and race conditions when upstream tools or templates supply conflicting files.

Scope:

* In-memory deduplication in `ScaffoldPlan` before disk write.
* Graceful override and suppression of upstream files (such as Laravel's default `AGENTS.md`).

Current status:

* Completed. In-memory deduplication implemented in `src/generator/scaffold-plan.ts` and validated in the 15-target E2E laboratory battery.

## Priority 7: Educational Scaffolding & Developer Ownership

### 13. Educational scaffolding, `LEARN.md` codebase guide, and `--learn` hands-on mode

Goal: empower developers of all experience levels to understand, modify, and truly own their scaffolded codebase through two distinct paths: standard companion documentation and guided hands-on construction.

Scope:

* **Standard Companion Guide (`LEARN.md`)**: Automatically generated in every scaffolded project. Covers:
  * Primary entry point and application bootstrapping flow.
  * Exact setup commands to make the project functional (installing dependencies, configuring `.env`, running migrations, and verifying with `curl`).
  * Visual request flow ASCII diagram explaining the path of an HTTP request through middleware, routing, controllers, services, and database pools.
  * Tailored syntax and methods reference for the chosen framework (e.g. `new Hono()`, `c.json()`, `c.req.valid()`, `express.Router()`, `res.status().json()`, `axum::extract::State`, `fiber.New()`, `FastAPI()`).
  * ORM and authentication method breakdown with code snippets.
  * Actionable guide on extending the codebase: adding a new route, adding a database model with migrations, and protecting an endpoint with auth.
* **Guided Hands-On Mode (`--learn` flag & interactive style selection)**:
  * Creates clean directory structures and essential configuration files (`package.json`, `tsconfig.json`, `.env`, schema files) while stripping pre-written business logic boilerplate (`controllers/`, `routes/`, `services/`, `middlewares/`).
  * Employs directory preservation with `.gitkeep` so the intended architectural layout is preserved in version control.
  * Replaces entry points (`src/index.ts`, `src/main.rs`, `cmd/api/main.go`, `app/main.py`, `routes/api.php`, `app/page.tsx`) with clean starter stubs pointing to `GUIDE.md`.
  * Generates **`GUIDE.md`** containing a feature-based curriculum:
    * Philosophy: deliberate practice without spoon-feeding (no copy-pasting completed apps).
    * Milestone 1: Tooling & Environment Setup
    * Milestone 2: Server Entry Point & Health Route
    * Milestone 3: Database Connection & Schema Migration
    * Milestone 4: Core CRUD Feature Implementation
    * Milestone 5: Input Validation & Error Boundaries
    * Milestone 6: Authentication & Protected Routes
    * Each milestone provides the Goal in plain English, the architectural Concept & Best Practice, Key Methods & APIs to Use, and a Verification Command.
* **Inspection & Manifest Attribution**:
  * Manifest records `scaffold.learn: true` and `promptAnswers.learn: true`.
  * `AGENTS.md` notes hands-on learning mode so AI tools respect the developer's learning intent.
* **Interactive Scaffolding Style Selection**: Prompts the user to choose between "Complete Boilerplate" or "Guided Hands-On Skeleton (`--learn`)".

Current status:

* Completed. All 10 stacks and fullstack monorepos have tailored profiles in `src/learn/`, validated with unit and CLI integration tests in `tests/learn.test.ts` and `tests/cli.test.ts`.

### 14. Scaffolded GitHub Actions CI/CD workflows (`--ci github`)

Goal: generate a ready-to-run GitHub Actions CI workflow (`.github/workflows/ci.yml`) tailored to the selected framework and runtime.

Scope:

* Rust Axum: `cargo test`, `cargo clippy -- -D warnings`, `cargo fmt --check`.
* Go Fiber: `go test -v ./...`, `go vet ./...`.
* Python FastAPI: `pytest`, `ruff check`.
* Node / Bun (Express, Hono, Elysia): `bun test`, `bun run build`.
* Next.js / React / Vue: linting, typecheck, production build.
* Fullstack monorepos: parallel matrix jobs for frontend build and backend tests.
* Opt-in via `--ci github` flag, with prompt option in interactive mode.

Why this matters:

* New projects immediately have active CI upon the first push to GitHub.
* Enforces reproducible testing standards across all supported stacks.

### 15. Production multi-stage Dockerfiles (`dockerfile: true`)

Goal: provide production-grade, multi-stage Dockerfiles across all supported frontend and backend stacks.

Scope:

* Next.js: multi-stage build using `output: 'standalone'` and a minimal Node alpine runner.
* React / Vue SPAs: multi-stage build with Vite into an unprivileged Nginx or Caddy alpine container.
* Go Fiber: multi-stage build into scratch or distroless (<20MB image).
* Rust Axum: multi-stage build with `cargo-chef` dependency caching into a slim Debian/Alpine image.
* Update `capability-matrix.json` so `dockerfile` reflects `true` across all supported stacks.

Why this matters:

* Allows developers to deploy directly to container platforms (Fly.io, Render, Railway, AWS ECS, Kubernetes).
* Eliminates boilerplate container setup.

### 16. Interactive OpenAPI and Swagger documentation (`/docs`)

Goal: provide built-in interactive API documentation out-of-the-box for all backend API scaffolds.

Scope:

* FastAPI: native Swagger UI and ReDoc at `/docs`.
* Elysia: `@elysiajs/swagger` mounted at `/docs`.
* Hono: `@scalar/hono-api-reference` or OpenAPI middleware at `/docs`.
* Express: `swagger-ui-express` with typed OpenAPI definitions.
* Go Fiber: `gofiber/swagger` with generated annotations.
* Rust Axum: `utoipa` and `utoipa-swagger-ui` mounted at `/docs`.

Why this matters:

* Developers can visually explore and test API routes without needing Postman or external HTTP clients.
* Documents request/response contracts directly in the scaffold.

### 17. Database seeding and fixtures (`db:seed`)

Goal: provide deterministic database seed scripts for local databases and Docker setups.

Scope:

* Node / Bun / Next.js: `prisma/seed.ts` via `bun run db:seed`.
* Python: `app/db/seed.py` creating sample test records and an admin account.
* Go: `cmd/seed/main.go` using GORM fixtures.
* Rust: SQL migration seed file or CLI seed command.

Why this matters:

* Scaffolded authentication can be exercised immediately with pre-seeded test credentials.
* Eliminates manual database population after `bun dev` or `cargo run`.

### 18. Post-scaffold resource generator (`qwykz add <resource>`)

Goal: scaffold follow-up routes, controllers, services, and tests in an existing `qwykz` project.

Scope:

* Inspect `.qwykz-manifest.json` in the current working directory to identify the stack.
* Generate route handler, business service, model schema, and test file matching the conventions defined in `AGENTS.md`.

Why this matters:

* Keeps code structure consistent as projects grow.
* Extends `qwykz` from an initial scaffolder into an ongoing development assistant.

## Recommended Implementation Order

1. `--dry-run` and diff output. *(Done)*
2. Scaffold manifest. *(Done)*
3. Strict package policy mode. *(Done)*
4. AI context pack. *(Done)*
5. Public capability matrix. *(Done)*
6. Generated app smoke tests. *(Done)*
7. Template validation CI. *(Done)*
8. Plugin system. *(Done)*
9. Curated stack presets (`--preset`). *(Done)*
10. Next.js App Router graduation to supported. *(Done)*
11. Deterministic staging & deduplication. *(Done)*
12. Educational scaffolding & `LEARN.md` / `GUIDE.md` guide. *(Done)*
13. Scaffolded GitHub Actions CI/CD (`--ci github`). *(Next)*
14. Production multi-stage Dockerfiles across all stacks.
15. Interactive OpenAPI & Swagger docs (`/docs`).
16. Database seeding & fixtures (`db:seed`).
17. Post-scaffold resource generator (`qwykz add`).
18. Managed fullstack auth Phases 2 through 4 (Go/Rust/Python JWT verification).

## Notes For Contributors

* Keep new features aligned with the prompt contract.
* Prefer explicit package reasons over implicit behavior.
* Treat generated output as a public API.
* Add or update tests whenever a feature changes what gets scaffolded.
* Keep AI-facing generated docs short, factual, and synchronized with the scaffold manifest.
