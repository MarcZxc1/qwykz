# Educational Scaffolding & Hands-On Learning (`--learn`)

`qwykz` is built not only to scaffold production starter code, but also to serve as an **architectural mentor** for developers learning a new language, framework, or paradigm.

When scaffolding a project, `qwykz` provides two distinct paths:

```
                          ┌──▶  Standard Mode (Complete boilerplate + companion LEARN.md guide)
bunx qwykz@latest ────────┤
                          └──▶  --learn Mode (No boilerplate: directory skeleton + step-by-step GUIDE.md)
```

---

## 1. Standard Mode: The `LEARN.md` Companion Guide

When generating a project with standard boilerplate, `qwykz` automatically writes a tailored [`LEARN.md`](file:///home/marc/projects/qwykz/src/learn/learn-guide.ts) directly into your project root.

`LEARN.md` documents:
1. **The Primary Starting Point**: Exactly which file boots the server or mounts the application (e.g. `src/index.ts`, `cmd/api/main.go`, `src/main.rs`, `app/page.tsx`), and how routing is configured.
2. **How to Make It Functional**: Precise commands to install dependencies, configure `.env`, run database migrations, and verify connectivity with `curl`.
3. **Request Lifecycle & Mental Model**: A visual ASCII diagram demonstrating how an incoming HTTP request travels through global middlewares, routers, auth layers, controllers, service logic, and database connection pools.
4. **Syntax & Methods Reference**: Exact framework methods (e.g., `new Hono()`, `c.json()`, `c.req.valid()`, `express.Router()`, `res.status().json()`, `axum::extract::State`, `fiber.New()`, `FastAPI()`), ORM queries, and auth functions implemented in the generated code.
5. **Extending the Codebase**: Step-by-step recipes for adding new routes, database models, and protected endpoints.

---

## 2. Guided Hands-On Mode (`--learn`)

For developers, students, or engineers trying a new language or framework for the first time, jumping into 20+ pre-written files often feels like a black box. You press run, see a green screen, but learn very little because you didn't write the code yourself.

The **`--learn`** flag changes this:

```bash
# Hands-on Rust Axum learning project
bunx qwykz@latest --preset rust --learn

# Hands-on Go Fiber learning project
bunx qwykz@latest --preset go --learn

# Hands-on Hono API learning project
bunx qwykz@latest --framework hono --learn
```

### What gets generated in `--learn` mode:
* **The Directory Skeleton**: Clean, best-practice folder structure (e.g. `src/controllers/`, `src/routes/`, `src/services/`, `src/middlewares/`, `prisma/`) with `.gitkeep` files to preserve directory trees in git.
* **Tooling & Dependencies**: Pre-configured `package.json` (or `Cargo.toml`, `go.mod`, `requirements.txt`), `tsconfig.json`, and `.env.example` with generated cryptographic secrets.
* **Clean Starter Stubs**: Minimal entry points (`src/index.ts`, `src/main.rs`, etc.) with starter comments pointing to `GUIDE.md`.
* **Zero Finished Boilerplate**: No pre-written route handlers or business logic controllers. You write the features yourself!
* **The Milestone Guide (`GUIDE.md`)**: A comprehensive, feature-based curriculum.

---

## 3. The "Not Spoon-Feeding" Philosophy

`GUIDE.md` is structured around hands-on milestones. It does not paste completed files for you to blindly copy-paste. Instead, each milestone provides:

* 🎯 **Goal**: A clear explanation of what you are building in plain English.
* 💡 **Concept & Best Practice**: The architectural reasoning behind why the feature is constructed this way.
* 🛠️ **Key Methods & APIs to Use**: The specific framework functions and methods needed to complete the feature.
* ✅ **Verification Command**: A terminal command (e.g. `curl`, `bun run typecheck`, or test runner) to verify your implementation works before moving forward.

### The 6 Core Milestones

| Milestone | Title | Focus |
| :---: | :--- | :--- |
| **1** | **Tooling & Environment Setup** | Dependencies, script runners, runtime flags, and `.env` isolation. |
| **2** | **Server Entry Point & Health Route** | Server instantiation, routing, and exposing `GET /api/health`. |
| **3** | **Database Connection & Schema Migration** | Connection pooling, relational models, and running migrations. |
| **4** | **Core CRUD Feature (Users / Items)** | Controller-service pattern, parsing request parameters, and database queries. |
| **5** | **Input Validation & Error Boundaries** | Schema boundaries (Zod / TypeBox), centralized error middleware, and HTTP status codes. |
| **6** | **Authentication & Route Protection** | Password hashing (Argon2 / bcrypt), JWT tokens, and Bearer authorization middleware. |

---

## 4. AI Tool Interaction (`AGENTS.md`)

When `--learn` mode is enabled:
- `.qwykz-manifest.json` attributes `scaffold.learn: true`.
- `AGENTS.md` explicitly informs AI tools (Claude Code, Cursor, Copilot) that the project is in guided learning mode:
  > *"This project is in learning mode. Guide the developer through GUIDE.md milestones rather than writing the complete application for them at once."*
