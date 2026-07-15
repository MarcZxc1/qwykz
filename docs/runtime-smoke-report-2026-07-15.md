# Runtime Smoke Test Report - 2026-07-15

Command:

```bash
bun run test:runtime
```

Expanded command:

```bash
QWYKZ_RUN_RUNTIME_SMOKE=1 bun test --timeout 900000 tests/runtime-smoke.test.ts
```

Environment:

* Bun: `1.3.14`
* Branch: `chore/capability-matrix-docker-hardening-20260715`
* Runtime suite: generated app health and auth smoke tests
* Health endpoint: `/api/health`
* Auth endpoints: `/api/auth/register`, `/api/auth/login`

## Summary

| Result | Count |
| --- | ---: |
| Passed | 77 |
| Skipped | 12 |
| Failed | 0 |
| Runtime cases passed | 76 |
| Matrix definition checks passed | 1 |

The 76 executed runtime cases took about `1,884.21s` total, or `31.40 minutes`, based on the per-test timings printed by Bun.

## Runtime Time By Surface

| Surface | Passed cases | Total time |
| --- | ---: | ---: |
| Backend API | 24 | `611.60s` |
| Fullstack React | 24 | `569.95s` |
| Fullstack Vue | 24 | `640.54s` |
| Next.js | 4 | `62.13s` |

## Runtime Time By Backend

| Backend | Passed cases | Total time |
| --- | ---: | ---: |
| Express | 12 | `166.76s` |
| Hono | 12 | `159.80s` |
| Elysia | 12 | `164.49s` |
| FastAPI / Python | 12 | `231.90s` |
| Go / Fiber | 12 | `105.45s` |
| Rust / Axum | 12 | `993.69s` |
| Next.js | 4 | `62.13s` |

Rust dominated runtime because each generated Rust app does a Cargo build before the server can answer health checks.

## Slowest Cases

| Case | Time |
| --- | ---: |
| `fullstack-vue-rust-docker-redis` | `110.06s` |
| `fullstack-vue-rust-local-redis` | `99.99s` |
| `api-rust-docker-redis` | `96.48s` |
| `api-rust-docker-no-redis` | `89.56s` |
| `api-rust-local-redis` | `88.23s` |
| `fullstack-vue-rust-local-no-redis` | `83.34s` |
| `fullstack-react-rust-docker-redis` | `78.39s` |
| `fullstack-react-rust-local-redis` | `76.80s` |
| `fullstack-vue-rust-docker-no-redis` | `73.55s` |
| `fullstack-react-rust-docker-no-redis` | `70.47s` |

## Skipped Laravel Cases

Laravel runtime cases are marked as external because they require Composer/PHP bootstrapping and are slower/more environment-sensitive than the default matrix. They are intentionally skipped by `bun run test:runtime` unless external runtime smoke is enabled.

Skipped cases:

* `api-laravel-docker-no-redis`
* `api-laravel-docker-redis`
* `api-laravel-local-no-redis`
* `api-laravel-local-redis`
* `fullstack-react-laravel-docker-no-redis`
* `fullstack-react-laravel-docker-redis`
* `fullstack-react-laravel-local-no-redis`
* `fullstack-react-laravel-local-redis`
* `fullstack-vue-laravel-docker-no-redis`
* `fullstack-vue-laravel-docker-redis`
* `fullstack-vue-laravel-local-no-redis`
* `fullstack-vue-laravel-local-redis`

Run the dedicated Laravel runtime suite with:

```bash
bun run test:runtime:laravel
```

Expanded command:

```bash
QWYKZ_RUN_RUNTIME_SMOKE=1 \
QWYKZ_SMOKE_INCLUDE_EXTERNAL=1 \
QWYKZ_SMOKE_FILTER=laravel \
bun test --timeout 900000 tests/runtime-smoke.test.ts
```

## Interpretation

This run proves the default non-Laravel runtime surface can generate apps, install dependencies, start infrastructure where needed, boot servers, pass health checks, and complete register/login requests across backend, fullstack, and Next.js combinations.

Laravel remains covered by the matrix definition and now has a dedicated external runtime command so it can be tested separately without making the default heavy runtime suite depend on Composer/PHP availability.
