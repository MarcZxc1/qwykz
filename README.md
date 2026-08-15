<div align="center">

# ⚡ qwykz ⚡

**Quick & Ready Boilerplate Builder**

[![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Laravel](https://img.shields.io/badge/laravel-%23FF2D20.svg?style=for-the-badge&logo=laravel&logoColor=white)](https://laravel.com/)
[![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)](https://react.dev/)
[![Vue](https://img.shields.io/badge/Vue.js-%2335495e.svg?style=for-the-badge&logo=vuedotjs&logoColor=%234FC08D)](https://vuejs.org/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Go](https://img.shields.io/badge/Go-00ADD8?style=for-the-badge&logo=go&logoColor=white)](https://go.dev/)
[![Rust](https://img.shields.io/badge/Rust-000000?style=for-the-badge&logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-%233ECF8E.svg?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

A lightning-fast CLI tool built with [Bun](https://bun.sh) to scaffold organized **Backend**, **Frontend**, and **Fullstack** starter applications for beginners and AI-assisted development.

[Features](#features) • [Installation](#installation) • [Usage](#usage) • [Wiki / Docs](docs/home.md) • [Contributing](#contributing)

</div>

---

## The problem qwykz is trying to solve

Starting a project should feel exciting, but the first hour often disappears into the same chores: creating folders, choosing packages, wiring authentication, configuring a database, fixing environment files, and explaining the structure to an AI assistant all over again. Experienced developers have rebuilt this foundation too many times. New learners can get stuck before they reach the part they actually wanted to learn. And the proudly “lazy” developer—usually the one looking for the simplest repeatable path—should not have to trade speed for clarity.

qwykz turns those repeated decisions into an inspectable scaffold. You choose the stack; qwykz generates the project, explains every package, records the choices in a manifest, and leaves an `AGENTS.md` guide for humans and AI tools. Use `--dry-run` when you want to see the exact files first, `--strict` when you want a package audit, and the public capability matrix when you need an honest answer about what is supported today.

It is for working developers who want momentum, learners who need a reliable example, teams that want consistent starting points, and anyone in tech who would rather spend their energy building the product than rebuilding setup scripts.

## Features

- **Multi-Stack Scaffolding**: Generate exact boilerplate architectures in **Backend** (Express, Hono, Elysia, Laravel, Python FastAPI, Go Fiber, Rust Axum), **Frontend** (React, Vue), or **Fullstack** (Next.js) environments.
- **Enterprise-Inspired Architecture**: Organizes generated projects around clear service, controller, model, middleware, route, database, and configuration layers.
- **Frontend Powerhouses**:
  - React & Vue apps are generated using high-speed Vite.
  - **Zero-config UI**: Tailwind CSS v4 is automatically injected and configured.
  - **Auth choices with honest maturity labels**: Local authentication scaffolds include Login, Register, and Dashboard flows. Supabase and Clerk scaffolds are available behind `--experimental` while their production auth contracts are completed.
  - **Strict Validation**: Zod schemas are automatically wired up to the frontend authentication forms.
  - **Deterministic installs**: framework/runtime packages are always included for the selected stack, while optional packages stay opt-in and visible in the prompts.
  - **Universal Fullstack Alignment**: Frontends automatically map their `VITE_API_URL` exactly to match the chosen backend framework (3000 for Go/Node, 8000 for Python/Laravel, 8080 for Rust). All backends expose identical routing topologies (`/api/auth`, `/api/users`, etc.) for seamless, plug-and-play cross-stack compatibility.
- **Database Orchestration**: Intelligent, automated setup for your PostgreSQL environment:
  - **Local Installation**
  - **Fully Dockerized** (automatically assigns ports, boots containers, and waits for health checks)
  - **Supabase Cloud & Neon Serverless Postgres** (automatically formats connections and skips local migrations)
- **Out-of-the-Box API Security**:
  - Express/Hono/Elysia: Prisma ORM, JWT authentication, Argon2 hashing, Helmet, CORS, and Zod validation with Role-Based Access Control.
  - Laravel: Silent Sanctum installation, automatic User model traits, and built-in Auth endpoints.
  - Python/Go/Rust: Native ORMs (SQLModel, Gorm, SQLx) natively wired with Bcrypt/Argon2 hashing and JWT Role-Based Access Control.
- **Non-Interactive Mode**: Fully scriptable via CLI flags for CI/CD or automated testing setups.
- **Inspectable By Default**: Every scaffold includes a manifest and AI context guide; dry-run and strict policy modes make files and dependencies reviewable before setup.

## Installation

### Run without installing (Recommended)

You can run `qwykz` directly using `bunx`:

```bash
bunx qwykz@latest
# or
bunx qwykz
# or
npx qwykz
# or
npx qwykz@latest
```

### Global Install

If you prefer to install it globally:

```bash
bun install -g qwykz
```

## Usage

### Interactive Mode

Simply run the command and follow the beautiful CLI prompts:

```bash
qwykz
```

You will be prompted to:

1. Name your project
2. Select your Stack (Express, Hono, Elysia, Laravel, Python, Go, Rust, Next.js, React, or Vue)
3. Select your Database Target (Local, Docker, Supabase, Neon) or Frontend Auth (Clerk, Supabase)
4. Opt-in to extra features (Zod, Helmet, CORS) _[JS/TS Backends only]_

### Non-Interactive Mode (Automated)

Perfect for scripts or CI/CD pipelines! Use the `--yes` or `-y` flag combined with options:

```bash
qwykz --yes \
  --name my-awesome-api \
  --framework laravel \
  --db docker
```

Available flags:

- `--yes` or `-y`: Skip all prompts and use defaults/flags
- `--name <string>`: Name of your project directory
- `--framework <express|hono|elysia|laravel|python|go|rust|nextjs|react|vue>`: Choose your stack
- `--db <supabase|neon|local|docker>`: Select database environment
- `--zod`, `--helmet`, `--cors`: Include extra middlewares
- `--dry-run`: Preview the generated tree, packages, manifest, and file diffs without creating the target project
- `--show-diff`: Show every generated file diff during a dry run
- `--strict`: Print the reason and category for every generated dependency
- `--record-prompts`: Store the resolved scaffold answers in `.qwykz-manifest.json`
- `--no-ai-context`: Skip generated `AGENTS.md`
- `--experimental`: Explicitly allow a combination marked experimental
- `--plugins-dir <path>`: Load plugins from an explicit directory
- `--deploy <plugin-target>`: Apply a deployment target registered by a plugin

### Capability matrix

See the generated [public capability matrix](docs/capability-matrix.md) for the current framework, database, authentication, cache, and Dockerfile contract. Unsupported combinations are rejected before project files are written; experimental combinations require `--experimental`.

### Managed credential smoke tests

Managed provider checks are opt-in and read credentials from environment variables only. Do not commit `.env` files or paste real provider tokens into test scripts.

```bash
SUPABASE_URL="..." \
SUPABASE_ANON_KEY="..." \
CLERK_SECRET_KEY="..." \
UPSTASH_REDIS_REST_URL="..." \
UPSTASH_REDIS_REST_TOKEN="..." \
bun run test:managed
```

Laravel uses Laravel-style split database variables and Predis Redis settings, so helper scripts derive `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, and `DB_PASSWORD` from `SUPABASE_DB_URL`. For Laravel + Upstash Redis, provide Redis protocol credentials too:

```bash
UPSTASH_REDIS_HOST="..." \
UPSTASH_REDIS_PASSWORD="..." \
UPSTASH_REDIS_PORT="6379"
```

Missing provider env vars skip only that provider's live check. The default safety checks still verify that generated scaffolds keep managed credentials as placeholders and that helper scripts do not contain committed provider credentials.

### Docker resource and data lifecycle

Generated Docker services use development-sized memory/CPU limits and bounded
log files. PostgreSQL data is stored in a named volume so ordinary
`docker compose down` preserves the database. Redis is generated as an
ephemeral, memory-bounded cache and does not create a data volume.

When a generated project is disposable, remove its containers and PostgreSQL
volume from inside that project directory:

```bash
docker compose down -v
```

`-v` permanently deletes that project's local database. Omit it when the data
must survive. qwykz-managed PostgreSQL volumes carry the
`io.qwykz.managed=true` label so unused generator data can be inventoried and
cleaned deliberately instead of using an unscoped system-wide prune.

## Documentation

Check out the [Wiki Guides](docs/home.md) for deep dives into:

- [Architecture Overview](docs/architecture.md)
- [The Template Engine](docs/template-engine.md)
- [Dependency Resolution](docs/dependency-resolution.md)
- [Adding New Features](docs/contributing.md)
- [Writing Plugins](docs/plugins.md)
- [Roadmap](docs/roadmap.md)

## Roadmap

The trust-and-predictability foundation is now in place:

- `--dry-run`, file diffs, manifests, strict package audits, AI context packs, and capability gating ship as part of normal generation.
- Community plugins can add frameworks, auth providers, and deployment targets through validated manifests and templates.
- Template validation and generated-project smoke workflows guard the scaffold surface in CI.

The largest remaining milestone is [production-ready Supabase Auth and Clerk fullstack support](docs/fullstack-managed-auth-plan.md), delivered through provider/backend contract tests rather than SDK presence alone. See the [detailed roadmap](docs/roadmap.md) for current status and sequencing.

## Contributing

Contributions are welcome and appreciated.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

<div align="center">
</div>
