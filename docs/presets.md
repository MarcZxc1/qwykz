# Curated Stack Presets

Presets provide tested, pre-configured stack setups so you can scaffold a complete project in a single command without stepping through interactive prompts.

## Quick Usage

Run any preset by its canonical name or shorthand alias:

```bash
# Using canonical name
bunx qwykz@latest --preset api-rust --name my-service

# Using shorthand alias
bunx qwykz@latest --preset rust --name my-service
bunx qwykz@latest --preset react-elysia --name my-app
```

To list all available presets in your terminal:

```bash
qwykz --list-presets
```

## Naming Conventions

Presets follow a category-first naming convention:

* **`api-*`**: Standalone backend APIs with containerized PostgreSQL and Redis.
* **`fullstack-*`**: Monorepos that connect a modern frontend (React or Vue) to a backend service.
* **`web-*`**: Standalone web apps and frontends (Next.js App Router, Vite SPAs).

Each preset also provides short aliases (e.g., `rust` for `api-rust`, `fastapi` for `api-python`, `react-go` for `fullstack-react-go`).

## Preset Catalog

### Backend APIs (`api-*`)

| Preset Name | Aliases | Framework | Database | Cache | Auth | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `api-rust` | `rust` | Rust (Axum) | Docker Postgres | Docker Redis | Local JWT | SQLx + Argon2 |
| `api-go` | `go` | Go (Fiber) | Docker Postgres | Docker Redis | Local JWT | GORM + Bcrypt |
| `api-python` | `python`, `fastapi` | Python (FastAPI) | Docker Postgres | Docker Redis | Local JWT | SQLModel + Pydantic |
| `api-elysia` | `elysia`, `bun` | Elysia (Bun) | Docker Postgres | Docker Redis | Local JWT | Prisma + Argon2 |
| `api-hono` | `hono` | Hono (Bun) | Docker Postgres | Docker Redis | Local JWT | Prisma + Argon2 |
| `api-express` | `express`, `node` | Express + TypeScript | Docker Postgres | None | Local JWT | Zod + Helmet + CORS |
| `api-laravel` | `laravel` | Laravel 11/12 | Docker Postgres | Docker Redis | Local Auth | Split DB variables |

### Fullstack Monorepos (`fullstack-*`)

| Preset Name | Aliases | Frontend | Backend | Database | Cache | Auth |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `fullstack-react-rust` | `react-rust` | React 19 + Vite | Rust (Axum) | Docker Postgres | Docker Redis | Local JWT |
| `fullstack-react-go` | `react-go` | React 19 + Vite | Go (Fiber) | Docker Postgres | Docker Redis | Local JWT |
| `fullstack-react-elysia` | `react-elysia` | React 19 + Vite | Elysia (Bun) | Docker Postgres | Docker Redis | Local JWT |
| `fullstack-react-hono` | `react-hono` | React 19 + Vite | Hono (Bun) | Docker Postgres | Docker Redis | Local JWT |
| `fullstack-react-express`| `react-express`| React 19 + Vite | Express + TS | Docker Postgres | None | Local JWT |
| `fullstack-react-fastapi`| `react-python`, `react-fastapi` | React 19 + Vite | Python (FastAPI)| Docker Postgres | Docker Redis | Local JWT |
| `fullstack-vue-hono` | `vue-hono` | Vue 3 + Vite | Hono (Bun) | Docker Postgres | Docker Redis | Local JWT |

### Web & Frontends (`web-*`)

| Preset Name | Aliases | Framework | Database | Cache | Auth | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `web-nextjs` | `nextjs`, `saas` | Next.js App Router | Docker Postgres | Docker Redis | Local Auth | Fullstack SSR |
| `web-react` | `react` | React 19 + Vite | Local | None | Supabase | Tailwind CSS v4 |
| `web-vue` | `vue` | Vue 3 + Vite | Local | None | Supabase | Tailwind CSS v4 |

## Overriding Preset Settings

You can combine `--preset` with other flags to override specific parts of the configuration:

```bash
# Use the Rust API preset, but target local PostgreSQL instead of Docker
qwykz --preset rust --db local --name rust-local-api

# Preview what will be created without writing files
qwykz --preset fullstack-react-elysia --dry-run

# Audit all packages and reasons for a preset
qwykz --preset api-express --strict --dry-run
```

## Manifest & Context Tracking

When a project is created from a preset:
- The preset name is recorded in `.qwykz-manifest.json` under `scaffold.preset`.
- The generated `AGENTS.md` context pack includes the preset name under the `Stack` summary.
