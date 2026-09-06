<div align="center">

# ⚡ qwykz ⚡

**Quick & Ready Boilerplate Builder**

[![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Laravel](https://img.shields.io/badge/laravel-%23FF2D20.svg?style=for-the-badge&logo=laravel&logoColor=white)](https://laravel.com/)
[![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)](https://react.dev/)
[![Vue](https://img.shields.io/badge/Vue.js-%2335495e.svg?style=for-the-badge&logo=vue.js&logoColor=%234FC08D)](https://vuejs.org/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Go](https://img.shields.io/badge/Go-00ADD8?style=for-the-badge&logo=go&logoColor=white)](https://go.dev/)
[![Rust](https://img.shields.io/badge/Rust-000000?style=for-the-badge&logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-%233ECF8E.svg?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

A lightning-fast, inspectable multi-stack project scaffolder built with [Bun](https://bun.sh) for developers, teams, and AI-assisted workflows.

[Installation](#installation) • [Usage](#usage) • [Features](#features) • [Docs Hub](#documentation) • [Contributing](#contributing)

</div>

---

## Why qwykz?

Starting a project shouldn't require an hour of repetitive setup: configuring databases, wiring auth, tuning environment variables, and explaining project structure to AI assistants from scratch.

**qwykz** turns repeated architectural setup into an inspectable, deterministic scaffold. Choose your stack; qwykz builds your project in an isolated staging workspace, generates an exact package audit, records decisions in `.qwykz-manifest.json`, and leaves an `AGENTS.md` context pack for you and your AI coding tools.

---

## Quickstart

Run directly without installing:

```bash
bunx qwykz@latest
# or
npx qwykz@latest
```

Or install globally:

```bash
bun install -g qwykz
```

---

## Features

- **Multi-Stack Scaffolding**: 
  - **Backend APIs**: Express, Hono, Elysia, Python (FastAPI), Go (Fiber), Rust (Axum), Laravel.
  - **Frontends**: React & Vue powered by high-speed Vite + Tailwind CSS v4.
  - **Fullstack**: Next.js App Router.
- **Educational Scaffolding & Hands-On Learning (`--learn`)**:
  - **Standard Mode**: Generates a tailored `LEARN.md` companion guide explaining the entry point, setup steps, request lifecycle flow, framework syntax & methods, and extension guidelines.
  - **Hands-On Mode (`--learn`)**: For developers mastering a new stack. Generates directory structures and configs with zero business boilerplate, providing a feature-based `GUIDE.md` milestone curriculum (pure English concepts, architectural best practices, exact methods to use, and verification commands without spoon-feeding).
- **AI-Native Context (`AGENTS.md`)**: Generates a factual project guide out of the box so LLM assistants (Claude Code, Cursor, Copilot) immediately understand project layout, commands, and routes without wasting tokens.
- **Deterministic & Inspectable**: Uses an isolated temporary staging workspace. Use `--dry-run` to preview exact files and diffs before writing, and `--strict` to audit every dependency justification.
- **Universal API Alignment**: Frontends automatically configure `VITE_API_URL` to match backend ports (3000 for Go/Node, 8000 for Python/Laravel, 8080 for Rust) with matching API routes (`/api/auth/*`, `/api/health`).
- **Database & Cache Orchestration**: Automated configuration for Local PostgreSQL, Docker Compose (with health checks and resource limits), Supabase Cloud, Neon Postgres, and Redis caching.
- **Honest Capability Gating**: Supported combinations are guaranteed; experimental combinations require `--experimental` and cannot fail silently.

---

## Usage

### Curated Presets (Fastest)

Scaffold tested setups in one command:

```bash
# Standalone APIs (Axum, Fiber, FastAPI, Elysia, Hono, Express, Laravel)
bunx qwykz@latest --preset rust --name my-service
bunx qwykz@latest --preset go --name my-service
bunx qwykz@latest --preset python --name my-service

# Fullstack Monorepos (React/Vue frontends + performant backends)
bunx qwykz@latest --preset react-rust --name my-app
bunx qwykz@latest --preset react-elysia --name my-app

# List all available presets
qwykz --list-presets
```

### Interactive Mode

Run `qwykz` and follow the interactive terminal prompts:

```bash
qwykz
```

### Guided Hands-On Mode (`--learn`)

Ideal for learners, students, or developers picking up a new language or framework:

```bash
# Scaffold a hands-on learning skeleton with a feature-based milestone guide (GUIDE.md)
bunx qwykz@latest --preset rust --learn
# or with any custom framework
bunx qwykz@latest --framework hono --learn
```

### Non-Interactive (Custom Flags)

Ideal for CI/CD pipelines, custom configurations, or scripts:

```bash
qwykz --yes \
  --name my-api \
  --framework express \
  --db docker \
  --zod --helmet --cors
```

### Key CLI Flags

| Flag | Description |
| :--- | :--- |
| `--preset <name>` | Scaffold from a curated preset (`rust`, `go`, `python`, `elysia`, `react-rust`, `nextjs`, etc.) |
| `--list-presets` | List all curated stack presets and exit |
| `--learn` | Generate clean project skeleton with zero finished boilerplate + feature milestone guide (`GUIDE.md`) |
| `--yes`, `-y` | Skip prompts and accept defaults/flags |
| `--name <string>` | Project directory name |
| `--framework <name>` | `express`, `hono`, `elysia`, `laravel`, `python`, `go`, `rust`, `nextjs`, `react`, `vue` |
| `--db <target>` | `local`, `docker`, `supabase`, `neon` |
| `--auth <provider>` | `local`, `supabase`, `clerk` |
| `--caching <target>` | `none`, `docker`, `upstash` |
| `--dry-run` | Preview the file tree, packages, and manifest without writing to disk |
| `--show-diff` | Display full unified file diffs during dry run |
| `--strict` | Print package justifications and categories during generation |
| `--experimental` | Explicitly permit combinations marked experimental in the capability matrix |
| `--no-ai-context` | Skip generating `AGENTS.md` |
| `--plugins-dir <path>`| Load custom framework/auth plugins from a directory |

---

## Documentation

For detailed architectural deep dives, guides, and testing references, visit the [Documentation Wiki](docs/home.md):

* ⚡ **[Curated Stack Presets](docs/presets.md)** — Pre-configured stack setups for APIs, fullstack monorepos, and SPAs.
* 🗺️ **[Capability Matrix](docs/capability-matrix.md)** — Verified matrix of framework, database, auth, and cache combinations.
* 🏗️ **[Architecture Overview](docs/architecture.md)** — Staging pipeline, dispatcher, and package policy internals.
* 🐳 **[Docker & Storage Lifecycle](docs/docker.md)** — Container resource limits, volume persistence, and cleanup workflows.
* 🧪 **[Testing & Verification Guide](docs/testing.md)** — Unit suites, template validation CI, and runtime smoke testing.
* 🔌 **[Plugin Authoring](docs/plugins.md)** — How to write custom framework, auth, and deployment plugins.
* 🧭 **[Roadmap](docs/roadmap.md)** — Current status, foundation milestones, and upcoming features.
* 🤝 **[Contributing Guide](docs/contributing.md)** — Setting up local development and submitting pull requests.

---

## Contributing

Contributions are welcome! Please see the [Contributing Guide](docs/contributing.md) for details on setting up the local test environment and submitting pull requests.

---

## License

[MIT](LICENSE)
