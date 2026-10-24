# Architecture Overview

The `qwykz` CLI is designed around a modular pipeline:

1. **Prompts (`src/prompts.ts`)**: Uses `@clack/prompts` to gather user input. If `--yes` is passed, it bypasses interactive prompts and uses CLI flags/defaults.
2. **Template Resolution (`src/template-engine.ts`)**: Reads template strings. In development, it reads directly from `templates/express/`, `templates/python/`, `templates/react/`, etc. In the compiled standalone binary, it reads from an embedded JSON map.
3. **Planning (`src/generator/scaffold-plan.ts`)**: The public `src/generator.ts` facade delegates to framework generators under `src/generator/`. Each generator receives an explicit output root and writes into a temporary workspace without changing the process working directory. Files are collected into a `ScaffoldPlan`, then enriched with learning guides, AI context, package audits, and the manifest. Independent plans can be built concurrently.
4. **Dependencies (`src/package-json.ts` & `src/package-versions.ts`)**: Built-in npm scaffolds use bundled, exact direct dependency versions without registry lookups. Plugin declarations and other package managers retain their own constraints. See [Dependency Resolution](dependency-resolution.md) for the reproducibility boundary.
5. **Execution (`src/cli.ts`)**: The entry point. Manages the lifecycle, handles errors gracefully, and can automatically execute `bun install`, `go mod tidy`, `cargo build`, and `docker compose up` depending on the user's choices.

`writePlan()` validates project names and relative file paths, rejects duplicate destinations, and writes the completed plan into a sibling publication workspace. An exclusive per-target directory lock prevents concurrent qwykz publishers from merging their files. Existing targets, including empty directories and dangling symlinks, are rejected. Once all files are written, a same-filesystem directory rename publishes the project atomically; write failures remove the workspace and leave the target absent.

Plugin post-generation hooks and automatic setup run after publication and can modify the generated project. They are outside the file-publication transaction. If the process is forcibly terminated during publication, a `.<project>.qwykz-lock` directory may remain beside the destination. After confirming no generator is running for that target, remove that directory before retrying.

The shared Prisma user model allows profiles without local credentials. Registration writes a password hash; local login rejects profiles without one. User-list and profile-creation responses select public fields only.
