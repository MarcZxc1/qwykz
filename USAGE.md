# qwykz Usage

`qwykz` is a Bun-based CLI that scaffolds an Express + TypeScript backend with Prisma, optional database support, and optional security/validation packages.

## Prerequisites

- Bun installed locally
- A PostgreSQL target chosen before generation:
  - Local PostgreSQL
  - Dockerized PostgreSQL
  - Supabase

## Run The CLI

From the repository root:

```bash
bun install
bun run src/index.ts
```

If you publish or link the package later, the `bin` entry also exposes the command as `qwykz`.

## CLI Flow

The generator will prompt you for:

1. Project name
2. Database target
3. Optional packages

Optional packages are:

- Zod for request validation
- Helmet for security headers
- CORS for cross-origin requests

## What Gets Generated

The generated project includes:

- `src/controllers/`
- `src/services/`
- `src/routes/`
- `src/middlewares/`
- `src/lib/`
- `src/index.ts`
- `prisma/schema.prisma`

Dockerized PostgreSQL also adds a `docker-compose.yml` file.

## After Generation

Change into the generated project and install its dependencies:

```bash
cd <project-name>
bun install
```

Then initialize Prisma and start the server:

```bash
bun run db:generate
bun run db:push
bun dev
```

## Supabase Notes

When Supabase is selected, the generated project includes the Prisma Pg adapter and `pg` so Prisma can use the Supabase pooler connection.
