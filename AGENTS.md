# AGENTS.md

Guidance and ground rules for AI agents and coding tools working on `qwykz`.

---

## 1. Project Overview & Philosophy

`qwykz` is an inspectable multi-stack project scaffolder built with Bun and TypeScript. It generates backends (Express, Hono, Elysia, Laravel, FastAPI, Go Fiber, Rust Axum), frontends (React, Vue), fullstack setups (Next.js, monorepos), database configurations, authentication, and Docker Compose environments.

Core principles:
- **Deterministic & Inspectable**: Output is planned completely in-memory before writing (`ScaffoldPlan`). Staging prevents partial or corrupted writes.
- **Honest Capability Gating**: Combinations are defined in `capability-matrix.json`. If a combination isn't supported, fail fast before touching disk.
- **No AI Slop**: Keep code lean, types precise, and documentation direct and human. Avoid vague marketing buzzwords.

---

## 2. Codebase Map

| Directory / File | Role |
| :--- | :--- |
| `src/cli.ts` | CLI entry point, execution coordinator, command runners |
| `src/prompts.ts` | Interactive prompt flows, non-interactive flag parsing |
| `src/presets.ts` | Curated stack presets (`api-rust`, `api-go`, `web-nextjs`, etc.) |
| `src/generator.ts` | Template resolution, overlay application, and staging pipeline |
| `src/plan.ts` | In-memory `ScaffoldPlan` builder and file list aggregator |
| `src/dispatcher.ts` | Target framework dispatchers (Node, Go, Python, Rust, etc.) |
| `src/manifest.ts` | `.qwykz-manifest.json` generation and audit serializer |
| `src/capability/` | Capability matrix definitions and validation logic |
| `src/plugins/` | Extensible plugin manifest and lifecycle management |
| `src/context-pack.ts` | Generates `AGENTS.md` for scaffolded projects |
| `templates/` | Embedded templates for every supported stack |
| `scripts/` | Validation scripts (`validate-templates.ts`, `generate-capability-matrix.ts`) |
| `tests/` | Unit, CLI, E2E, matrix, and validation tests |

---

## 3. Outer-Loop Engineering Protocol

When executing tasks on `qwykz`, follow this explicit verification loop:

### Step 1: Locate Truth
- Read `src/types.ts` for option and plan shapes.
- Check `capability-matrix.json` before altering framework/database/auth combinations.
- Inspect relevant existing tests in `tests/` to see expected behavior.

### Step 2: Test-Driven Changes (TDD)
- When adding features or fixing bugs, write or update test cases in `tests/` first.
- Keep tests focused: unit tests for logic, CLI tests for flag parsing, E2E tests for scaffold output.

### Step 3: Fast Feedback & Verification Gates
Always run this triad before declaring a task complete or staging commits:

```bash
# 1. Type check
bunx tsc --noEmit

# 2. Template syntax & placeholder validation
bun run validate:templates

# 3. Core test suites
bun run test
```

### Step 4: Git Hygiene
- Commit with conventional commit messages (`feat:`, `fix:`, `docs:`, `chore:`).
- Keep diffs minimal and clean.
- Never commit secret keys, credentials, or untracked cache artifacts.

---

## 4. graphify

This project has a knowledge graph at `graphify-out/` with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when `graphify-out/graph.json` exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty `graphify-out/` files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If `graphify-out/wiki/index.md` exists, use it for broad navigation instead of raw source browsing.
- Read `graphify-out/GRAPH_REPORT.md` only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost). Note: `graphify-out/` is gitignored to avoid repository bloat.

---

## 5. Web Documentation Sync Protocol (`qwykz-web`)

The official documentation and interactive showcase lives at `/home/marc/projects/qwykz-web`.

Whenever you modify any of the following in `qwykz`:
1. **`capability-matrix.json`**: Adding new frameworks, graduating databases/auth, or altering support tiers.
2. **`src/presets.ts`**: Adding new curated presets, modifying options, or adding ergonomic aliases.
3. **`package.json`**: Bumping version or altering core dependencies.
4. **CLI Flags**: Adding or changing flags (`--version`, `--help`, `--preset`, `--learn`, etc.).

### Automatic Sync Command
Run this command from `qwykz` before concluding your task:

```bash
bun run sync:web
```

This triggers the upstream synchronization pipeline in `../qwykz-web`, updating:
- `qwykz-web/src/data/version.ts` (current version and release metadata)
- `qwykz-web/src/data/matrix.ts` (full capability matrix dataset)
- `qwykz-web/.qwykz-sync-state.json` (recorded sync commit and timestamp)

Always verify that `qwykz-web` passes its build triad (`bun run lint && bun run build`) after syncing.
