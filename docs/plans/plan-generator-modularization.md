# Generator Modularization Plan

## Objective

Turn `src/generator.ts` from a multi-purpose implementation file into a small,
stable public facade backed by focused generator modules. Scaffolded output,
CLI behavior, exported functions, package policy, and plugin behavior must not
change as a side effect of this refactor.

## Invariants

- `buildScaffoldPlan()`, `writePlan()`, `generateProject()`,
  `generateExpressProject()`, and `resolveFrontendApiUrl()` remain available
  from `src/generator.ts`.
- Dry-run and real generation continue to consume the same `ScaffoldPlan`.
- Secret generation happens once per planned scaffold and secrets remain out
  of terminal output.
- Framework selection never mutates the caller's `ProjectOptions`.
- Plugin capability validation and overlays happen before the manifest is
  finalized.
- Generated file contents are protected by the existing matrix, validator,
  manifest, context-pack, plugin, and CLI tests.

## Target Layout

```text
src/generator.ts                    Public compatibility facade
src/generator/
├── contracts.ts                    Shared generator function contract
├── dispatcher.ts                   Framework registry and monorepo orchestration
├── scaffold-plan.ts                Staging, manifest, context, and final writes
├── package-policy.ts               Dependency classification and audit
├── plugin-generation.ts            Framework generation and capability overlays
├── shared/
│   ├── files.ts                    Template copying and JSON writing
│   ├── runtime.ts                  Secrets, environment, Docker, Prisma helpers
│   └── frontend.ts                 Vite scaffolding and API URL mapping
└── frameworks/
    ├── node-api.ts                 Express, Hono, and Elysia
    ├── vite.ts                     React and Vue
    ├── nextjs.ts                   Next.js
    ├── laravel.ts                  Laravel
    └── native.ts                   FastAPI, Go Fiber, and Rust Axum
```

## Execution Sequence

1. Extract scaffold planning, writing, dependency auditing, and plugin logic.
2. Extract shared file/runtime/frontend helpers.
3. Move framework implementations by family without rewriting their behavior.
4. Replace the long conditional dispatcher with a typed framework registry.
5. Rebuild monorepo child options with immutable copies.
6. Preserve facade exports and update internal imports.
7. Run TypeScript, static validators, curated tests, repository-wide tests,
   binary compilation, and representative dry-run checks.
8. Refresh Graphify after the final source layout is stable.

## Non-goals

- Redesigning generated architectures or templates.
- Making all frameworks conform to one oversized abstraction.
- Completing managed authentication roadmap phases during this refactor.
- Changing CLI flags or interactive prompt wording.
