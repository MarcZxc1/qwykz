# Fullstack Managed Authentication Plan

Status: planned. This document describes future work; it does not mark Supabase Auth or Clerk fullstack support as production-ready.

## Objective

Provide reliable Supabase Auth and Clerk authentication for generated fullstack applications while keeping authentication independent from the selected PostgreSQL environment.

A generated application should follow one consistent flow:

```text
React or Vue provider SDK
        -> provider sign-in/sign-up
        -> short-lived access/session token
        -> Authorization: Bearer <token>
        -> backend token verification
        -> normalized authenticated identity
        -> application profile and role lookup
        -> protected API response
```

Managed providers own credentials, sessions, password recovery, MFA, and social login. The qwykz backend owns API authorization, application roles, and application-specific profile data.

## Current State

qwykz currently exposes Supabase Auth and Clerk choices for React/Vue monorepos when the backend is Express, Hono, or Elysia. It already generates provider SDK dependencies, environment placeholders, frontend components, and backend middleware variants.

This support is not yet considered stable because:

* Provider choices are covered mainly by scaffold assertions rather than signed-token integration tests.
* Managed-provider backends still generate provider-specific registration/login controllers even though the frontend provider SDK should own those flows.
* Express Clerk still needs to migrate from the unsupported Node SDK to the current Express SDK.
* Provider identities are not normalized into one application-user contract.
* Role ownership and provider-to-database profile synchronization are not fully defined.
* FastAPI, Laravel, Go, and Rust currently expose only built-in API auth in the fullstack prompt.

Until the exit criteria in this document pass, documentation and release notes should describe managed fullstack auth as experimental.

## Product Decisions

### Authentication and database choices are independent

These must remain valid combinations:

* Supabase Auth with local PostgreSQL.
* Supabase Auth with containerized PostgreSQL.
* Supabase Auth with Supabase PostgreSQL.
* Clerk with local, containerized, or Supabase PostgreSQL.

Selecting Supabase as a database must not automatically select Supabase Auth, and selecting Supabase Auth must not force Supabase as the database.

### The frontend owns provider authentication

For managed auth, the frontend uses the official provider SDK for sign-in, sign-up, sign-out, session refresh, MFA, and account UI.

The backend must not accept raw passwords or recreate a provider's login flow. Managed-auth scaffolds therefore should not generate custom backend `/api/auth/register` or `/api/auth/login` handlers.

### The backend verifies every API request

Cross-origin Vite monorepos will use bearer tokens as the baseline transport. Protected routes must fail closed when a token is missing, expired, malformed, has the wrong issuer/audience, or comes from an unauthorized frontend origin.

Each backend exposes a normalized authentication context:

```ts
type AuthenticatedIdentity = {
  provider: "supabase" | "clerk";
  providerUserId: string;
  email?: string;
  sessionId?: string;
  organizationId?: string;
};
```

Provider claims establish identity. Application roles come from the application database and are never trusted directly from arbitrary client input.

### Application profiles use provider identities

Managed-auth projects should use an application profile that does not contain a password:

```text
User
  id
  authProvider
  providerUserId
  email
  name
  role
  createdAt
  updatedAt
```

The pair `(authProvider, providerUserId)` must be unique. Built-in JWT projects may keep a password hash, but managed-auth projects must never create, request, return, or log one.

The initial implementation should use just-in-time profile creation after the first verified request. Optional provider webhooks can be added later for deletion, email changes, organizations, and proactive synchronization.

## Supported-Combination Rollout

| Frontend | Backend | Supabase Auth | Clerk | Planned phase |
| --- | --- | --- | --- | --- |
| React + Vite | Express | Stable target | Stable target | Phase 1 |
| React + Vite | Hono | Stable target | Stable target | Phase 1 |
| React + Vite | Elysia | Stable target | Stable target | Phase 1 |
| Vue + Vite | Express | Stable target | Stable target | Phase 1 |
| Vue + Vite | Hono | Stable target | Stable target | Phase 1 |
| Vue + Vite | Elysia | Stable target | Stable target | Phase 1 |
| Next.js | Next.js API | Review existing path | Review existing path | Phase 2 |
| React/Vue | FastAPI | JWT/JWKS verification | JWT/JWKS verification | Phase 3 |
| React/Vue | Laravel | JWT/JWKS verification | JWT/JWKS verification | Phase 3 |
| React/Vue | Go Fiber | JWT/JWKS verification | JWT/JWKS verification | Phase 3 |
| React/Vue | Rust Axum | JWT/JWKS verification | JWT/JWKS verification | Phase 3 |

The CLI must show only combinations that meet the acceptance criteria for the released version. An unsupported combination must be rejected before any files are written.

## Package Contract

The intended package mapping is:

| Target | Supabase | Clerk |
| --- | --- | --- |
| React frontend | `@supabase/supabase-js` | `@clerk/react` |
| Vue frontend | `@supabase/supabase-js` | `@clerk/vue` |
| Express backend | provider verification client | `@clerk/express` |
| Hono backend | provider verification client | `@clerk/backend` |
| Elysia backend | provider verification client | `@clerk/backend` |

Before implementation, the Supabase backend verification path must choose and document one approach: the official JavaScript client's verified-claims API or a maintained JWT/JWKS library. It must support key rotation and must not merely decode an unverified JWT.

Every generated import must have one matching manifest dependency. Provider packages must not appear when another provider or built-in auth is selected.

## Environment Contract

Frontend environment files may contain only public configuration:

```dotenv
VITE_API_URL=http://localhost:3000/
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_CLERK_PUBLISHABLE_KEY=
```

Backend environment files may contain verification configuration and secrets:

```dotenv
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_JWT_KEY=
CLERK_AUTHORIZED_PARTIES=http://localhost:5173
```

Rules:

* Never put a Clerk secret key or Supabase service-role key in a Vite variable.
* Generate placeholders in `.env.example`; never generate real provider credentials.
* Validate required variables during server startup and report the exact missing variable.
* Avoid printing credential values in setup logs or error output.
* Production CORS and authorized-party values must be explicit rather than wildcarded.

## Generated API Contract

Managed-auth backends should generate:

* `GET /api/health` as a public service/database health check.
* `GET /api/auth/me` as an authenticated normalized-identity/profile response.
* `GET /api/users` as an application-role-protected endpoint.
* Authentication middleware that verifies provider tokens and loads the application profile.

Managed-auth backends should not generate:

* Password registration or password login endpoints.
* Password columns in managed-provider-only schemas.
* Provider secret keys in frontend code.
* Responses containing raw tokens, secret keys, password hashes, or unfiltered provider objects.

## Implementation Phases

### Phase 0: Freeze and audit the existing experimental path

- [ ] Mark current managed fullstack auth support as experimental in documentation.
- [ ] Inventory every provider template, import, package, environment variable, route, and test.
- [ ] Remove or quarantine obsolete templates so they cannot be selected accidentally.
- [ ] Define the normalized identity, profile, role, and API error contracts.
- [ ] Record official SDK/version choices and their upgrade policy.

Exit condition: there is one reviewed design and package mapping before implementation begins.

### Phase 1: React/Vue with Express/Hono/Elysia

- [ ] Add a capability matrix used by interactive prompts and non-interactive flags.
- [ ] Keep database selection independent from authentication selection.
- [ ] Migrate Express Clerk generation to the current Express SDK.
- [ ] Implement Clerk token verification for Hono and Elysia with the backend SDK.
- [ ] Implement verified Supabase claims for all three Node backends.
- [ ] Remove managed-provider backend password registration/login routes.
- [ ] Generate `/api/auth/me` and a normalized authenticated identity.
- [ ] Add just-in-time application-profile creation and role lookup.
- [ ] Make React and Vue send the provider token on protected API requests.
- [ ] Generate provider-specific setup instructions without exposing secrets.
- [ ] Verify that `/api/users` never returns a password or raw provider object.

Exit condition: all twelve React/Vue, backend, and provider combinations install, build, authenticate with signed fixtures, and reject invalid tokens.

### Phase 2: Next.js review

- [ ] Audit the upstream Next.js scaffold and current provider templates.
- [ ] Use the provider's framework-specific server integration.
- [ ] Align `/api/auth/me`, profile creation, roles, and error responses with Phase 1.
- [ ] Verify server/client environment-variable boundaries.
- [ ] Add build and route integration tests.

Exit condition: Next.js has the same security contract without duplicating the Vite architecture where framework-native handling is better.

### Phase 3: FastAPI, Laravel, Go, and Rust

- [ ] Add maintained JWT/JWKS verification libraries per language.
- [ ] Validate signature, algorithm, issuer, audience, expiry, not-before time, and authorized party where applicable.
- [ ] Normalize provider claims into the shared identity contract.
- [ ] Add provider-linked profile schemas without managed passwords.
- [ ] Implement consistent 401, 403, and configuration-error responses.
- [ ] Add the combinations to prompts only after their native builds and auth tests pass.

Exit condition: every advertised language backend verifies tokens with provider-compatible signed fixtures and passes its native compiler/test suite.

### Phase 4: Optional synchronization and organizations

- [ ] Add opt-in Clerk/Supabase webhook generation.
- [ ] Verify webhook signatures and replay protection.
- [ ] Synchronize deletion and profile changes safely.
- [ ] Add optional Clerk organization mapping.
- [ ] Document whether provider or application roles are authoritative for each mode.

Exit condition: webhook features are opt-in, idempotent, tested, and do not weaken request-time token verification.

## Generator Work Breakdown

### Types and prompts

Files: `src/types.ts`, `src/prompts.ts`.

- [ ] Represent provider capability by frontend/backend combination.
- [ ] Validate interactive and `--yes` selections identically.
- [ ] Print an explicit summary of provider, database, profile, and package choices.
- [ ] Reject unavailable combinations with an actionable message.

### Dependency generation

Files: `src/package-json.ts`, `src/package-versions.ts`, `src/npm-registry.ts`.

- [ ] Replace obsolete provider packages.
- [ ] Resolve only packages required by the selected provider and framework.
- [ ] Maintain offline fallback versions for every selected package.
- [ ] Add a test proving every generated import has a declared dependency.

### Templates and generator selection

Files: `src/generator.ts`, `templates/react/`, `templates/vue/`, and backend template directories.

- [ ] Separate provider UI, token transport, verification middleware, profile synchronization, and authorization templates.
- [ ] Avoid returning whole SDK user objects; map explicit public fields.
- [ ] Preserve compiled-binary embedding for every new template.
- [ ] Generate `.env.example` and provider setup documentation alongside the project.

### Testing

Files: `tests/cli.test.ts`, `tests/full-matrix.test.ts`, `tests/e2e.test.ts`, plus focused auth-contract tests.

- [ ] Scaffold assertions for files, packages, imports, environment variables, and routes.
- [ ] Token tests for valid, missing, malformed, expired, not-yet-valid, wrong-issuer, wrong-audience, and wrong-authorized-party cases.
- [ ] Authorization tests for authenticated user, administrator, and insufficient-role cases.
- [ ] Response tests proving password hashes, service keys, and raw tokens are absent.
- [ ] Frontend build tests for React and Vue provider variants.
- [ ] Backend native build/typecheck tests for every advertised framework.
- [ ] Compiled-binary generation tests for representative Supabase and Clerk monorepos.
- [ ] Optional provider test-tenant smoke tests outside pull-request CI; never store credentials in the repository.

## Release Gates

Managed fullstack auth is stable only when all of the following are true:

1. The prompt capability matrix matches the implemented and tested matrix.
2. Generated imports and dependencies match exactly.
3. No managed-auth backend accepts or stores a provider password.
4. Token verification fails closed for every negative fixture.
5. Application roles are loaded from a trusted source.
6. Provider secrets cannot enter the frontend bundle.
7. `/api/auth/me` and protected-route responses expose only documented public fields.
8. React and Vue builds pass for both providers.
9. Node backend typechecks and auth-contract tests pass for both providers.
10. The standalone qwykz binary generates the same files as source mode.
11. Setup documentation works from a fresh provider test project.
12. CI prevents an untested combination from being advertised by the prompt.

## Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Provider SDK drift | Pin supported major versions, test generated imports, and schedule dependency review. |
| Token accepted for the wrong app | Validate issuer, audience, and authorized parties. |
| Secret bundled into Vite | Maintain separate public/private environment schemas and scan generated frontend output. |
| Duplicate application profiles | Enforce a unique provider/provider-user identifier pair and use idempotent upserts. |
| Client-controlled roles | Resolve roles from the application database or verified provider policy only. |
| Provider outage | Return a clear 503 where remote verification is required; use safe JWKS caching where supported. |
| Inconsistent framework behavior | Test one shared auth contract against every advertised framework. |
| Open-source contributor confusion | Keep this plan, the capability matrix, and generated setup instructions current. |

## Recommended Delivery Order

1. Phase 0 contract and audit.
2. Supabase Auth on React + Express as the first reference implementation.
3. Supabase Auth on Hono/Elysia and Vue.
4. Clerk on React + Express using current SDKs.
5. Clerk on Hono/Elysia and Vue.
6. Next.js framework-native review.
7. FastAPI, Laravel, Go, and Rust through verified JWT/JWKS adapters.
8. Optional webhooks and organizations.

Each step should be independently reviewable and must not expand the prompt matrix until its release gates pass.
