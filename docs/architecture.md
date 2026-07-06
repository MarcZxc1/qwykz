# Architecture Overview

The `qwykz` CLI is designed around a modular pipeline:

1. **Prompts (`src/prompts.ts`)**: Uses `@clack/prompts` to gather user input. If `--yes` is passed, it bypasses interactive prompts and uses CLI flags/defaults.
2. **Template Resolution (`src/template-engine.ts`)**: Reads template strings. In development, it reads directly from `templates/express/`, `templates/python/`, `templates/react/`, etc. In the compiled standalone binary, it reads from an embedded JSON map.
3. **Generation (`src/generator.ts`)**: The core generator. It utilizes `copyDirectoryRecursive` to dynamically clone entire enterprise module structures for languages like Go, Rust, and Python, while precisely injecting variables (like `PROJECT_NAME`). It then writes the final structure to the target directory.
4. **Dependencies (`src/package-json.ts` & `src/npm-registry.ts`)**: Constructs the `package.json` (or `Cargo.toml`, `go.mod`, `requirements.txt`) file by querying package managers for the latest version of every requested dependency.
5. **Execution (`src/cli.ts`)**: The entry point. Manages the lifecycle, handles errors gracefully, and can automatically execute `bun install`, `go mod tidy`, `cargo build`, and `docker compose up` depending on the user's choices.
