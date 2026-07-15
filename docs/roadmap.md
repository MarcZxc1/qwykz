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

## Recommended Implementation Order

1. `--dry-run` and diff output.
2. Scaffold manifest.
3. Strict package policy mode.
4. AI context pack.
5. Public capability matrix.
6. Generated app smoke tests.
7. Managed fullstack auth Phase 0 and Phase 1.
8. Template validation CI.
9. Plugin system.
10. Managed fullstack auth Phases 2 through 4.

## Notes For Contributors

* Keep new features aligned with the prompt contract.
* Prefer explicit package reasons over implicit behavior.
* Treat generated output as a public API.
* Add or update tests whenever a feature changes what gets scaffolded.
* Keep AI-facing generated docs short, factual, and synchronized with the scaffold manifest.
