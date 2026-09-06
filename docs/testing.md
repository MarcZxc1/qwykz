# Testing & Verification Guide

This guide covers running the test suites, template validations, and smoke tests for `qwykz`.

## Test Suites

```bash
# Run core test suite (unit, CLI, E2E, matrix)
bun test

# Validate template syntax, placeholders, and imports
bun run validate:templates

# Check TypeScript types
bunx tsc --noEmit
```

## Runtime Smoke Tests

Runtime smoke tests boot real generated applications, check container health, and issue HTTP requests against `/api/health`, `/api/auth/register`, and `/api/auth/login`.

```bash
# Run all runtime smoke tests
bun run test:runtime

# Run filtered runtime tests (e.g. only express)
QWYKZ_RUN_RUNTIME_SMOKE=1 QWYKZ_SMOKE_FILTER=express bun test tests/runtime-smoke.test.ts

# Run dedicated Laravel runtime checks
bun run test:runtime:laravel
```

## Managed Credential Smoke Tests

Managed provider checks are opt-in and read credentials strictly from environment variables. Do not commit `.env` files or paste real provider tokens into test scripts.

```bash
SUPABASE_URL="..." \
SUPABASE_ANON_KEY="..." \
CLERK_SECRET_KEY="..." \
UPSTASH_REDIS_REST_URL="..." \
UPSTASH_REDIS_REST_TOKEN="..." \
bun run test:managed
```

### Laravel Provider Configuration

Laravel uses Laravel-style split database variables and Predis Redis settings. Helper scripts derive `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, and `DB_PASSWORD` from `SUPABASE_DB_URL`.

For Laravel + Upstash Redis, provide Redis protocol credentials too:

```bash
UPSTASH_REDIS_HOST="..." \
UPSTASH_REDIS_PASSWORD="..." \
UPSTASH_REDIS_PORT="6379"
```

Missing provider env vars skip only that provider's live check. The default safety checks still verify that generated scaffolds keep managed credentials as placeholders and that helper scripts do not contain committed provider credentials.
