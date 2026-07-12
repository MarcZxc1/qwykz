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

## Recommended Implementation Order

1. `--dry-run` and diff output.
2. Scaffold manifest.
3. Strict package policy mode.
4. Managed fullstack auth Phase 0 and Phase 1.
5. Template validation CI.
6. Plugin system.
7. Managed fullstack auth Phases 2 through 4.

## Notes For Contributors

* Keep new features aligned with the prompt contract.
* Prefer explicit package reasons over implicit behavior.
* Treat generated output as a public API.
* Add or update tests whenever a feature changes what gets scaffolded.
