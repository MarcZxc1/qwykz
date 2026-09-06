import type { FrameworkLearnProfile, LearnMilestone } from "./types";
import type { ProjectOptions } from "../types";

export function getFrameworkLearnProfile(options: ProjectOptions): FrameworkLearnProfile {
  const fw = options.framework;

  if (fw === "hono") {
    return {
      name: "Hono",
      category: "node",
      entryPoint: "src/index.ts",
      bootstrapExplanation:
        "Hono is instantiated via `new Hono()`. Middlewares are mounted with `app.use()`, sub-routers are mounted using `app.route()`, and the Bun runtime listens on the configured port using `export default { fetch: app.fetch, port }`.",
      keyFiles: [
        { path: "src/index.ts", role: "Main server instantiation, global middlewares, router mounting, and server export" },
        { path: "src/routes/health.routes.ts", role: "Health check route returning application uptime and server status" },
        { path: "src/routes/user.routes.ts", role: "User resource routes mapping HTTP verbs to user controller actions" },
        { path: "src/controllers/user.controller.ts", role: "HTTP request handlers: parsing parameters, executing services, and formatting responses" },
        { path: "src/services/user.service.ts", role: "Business logic and database persistence via Prisma ORM" },
        { path: "src/middlewares/auth.middleware.ts", role: "JWT Bearer token verification and request context injection" },
        { path: "src/middlewares/error.middleware.ts", role: "Centralized error handling and standard RFC 7807 error responses" },
        { path: "src/lib/prisma.ts", role: "Singleton Prisma Client instance maintaining a connection pool" },
        { path: "prisma/schema.prisma", role: "Declarative database schema models and relational definitions" },
      ],
      requestFlowAscii: `
[Client Request]
       │
       ▼
[Global Middlewares]   ── CORS, Logger, Centralized Error Handling
       │
       ▼
[Hono Router]          ── Path matching (e.g. GET /api/users, POST /api/auth/login)
       │
       ▼
[Auth Middleware]      ── Extracts 'Authorization: Bearer <token>', verifies JWT, sets c.set('user', payload)
       │
       ▼
[Controller Handler]   ── Extracts typed params/body, invokes business service
       │
       ▼
[Service Layer]        ── Executes domain rules, calls Prisma ORM
       │
       ▼
[Database / Pool]      ── PostgreSQL query execution
       │
       ▼
[c.json(data, status)] ── Serializes typed JSON response with HTTP status code
`,
      frameworkMethods: [
        {
          name: "new Hono()",
          signature: "const app = new Hono()",
          purpose: "Creates a lightweight Hono application router instance with zero external dependencies.",
        },
        {
          name: "app.route(prefix, subApp)",
          signature: "app.route('/api/users', userRoutes)",
          purpose: "Mounts a sub-router at a specified URL prefix for modular code separation.",
        },
        {
          name: "c.json(data, status)",
          signature: "return c.json({ success: true, user }, 200)",
          purpose: "Formats a JavaScript object into a JSON Response with the specified HTTP status code and application/json header.",
        },
        {
          name: "c.req.json()",
          signature: "const body = await c.req.json()",
          purpose: "Asynchronously reads and parses the incoming HTTP request body as JSON.",
        },
        {
          name: "c.req.valid('json')",
          signature: "const data = c.req.valid('json')",
          purpose: "Extracts validated and typed payload data validated by schema middleware (e.g., Zod validator).",
        },
        {
          name: "c.set() / c.get()",
          signature: "c.set('user', decoded); const user = c.get('user');",
          purpose: "Safely stores and retrieves request-scoped state across middlewares and handlers.",
        },
        {
          name: "app.use(middleware)",
          signature: "app.use('*', logger())",
          purpose: "Applies middleware functions across matched routes or the entire application.",
        },
      ],
      ormMethods: [
        {
          name: "prisma.user.findMany()",
          signature: "await prisma.user.findMany({ where: { active: true } })",
          purpose: "Queries database records matching criteria with type-safe returned models.",
        },
        {
          name: "prisma.user.create()",
          signature: "await prisma.user.create({ data: { email, passwordHash } })",
          purpose: "Inserts a new record into the database and returns the generated model.",
        },
        {
          name: "prisma.user.findUnique()",
          signature: "await prisma.user.findUnique({ where: { id } })",
          purpose: "Queries a unique record by primary key or unique constraint.",
        },
      ],
      authMethods: [
        {
          name: "jwt.sign()",
          signature: "jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' })",
          purpose: "Creates a signed JSON Web Token holding claims for authenticated sessions.",
        },
        {
          name: "jwt.verify()",
          signature: "const claims = jwt.verify(token, JWT_SECRET)",
          purpose: "Cryptographically verifies the authenticity and expiration of an incoming Bearer token.",
        },
        {
          name: "argon2.hash() / argon2.verify()",
          signature: "await argon2.hash(password); await argon2.verify(hash, password);",
          purpose: "Securely hashes user passwords using memory-hard Argon2id to resist brute-force attacks.",
        },
      ],
      extensionGuide: {
        addRoute: "Create `src/routes/<feature>.routes.ts`, instantiate `const router = new Hono()`, define handlers, and mount it in `src/index.ts` using `app.route('/api/<feature>', router)`.",
        addModel: "Add the model definition in `prisma/schema.prisma`, then run `bun run db:push` to synchronize the database schema.",
        protectRoute: "Import `authMiddleware` from `src/middlewares/auth.middleware.ts` and attach it to your route or sub-router: `router.use('*', authMiddleware)`.",
      },
      milestones: getStandardNodeMilestones("Hono"),
    };
  }

  if (fw === "express") {
    return {
      name: "Express",
      category: "node",
      entryPoint: "src/index.ts",
      bootstrapExplanation:
        "Express boots by initializing `const app = express()`, configuring body parsers (`express.json()`), registering route routers (`app.use('/api', router)`), and binding to a port using `app.listen(port)`.",
      keyFiles: [
        { path: "src/index.ts", role: "Application entry point, global middleware stack, router mounts, and HTTP listener" },
        { path: "src/routes/health.routes.ts", role: "Liveness and readiness health probe route" },
        { path: "src/routes/user.routes.ts", role: "Express Router declaring user resource endpoints" },
        { path: "src/controllers/user.controller.ts", role: "Route controller functions mapping HTTP requests to service calls" },
        { path: "src/services/user.service.ts", role: "Database interactions via Prisma Client" },
        { path: "src/middlewares/auth.middleware.ts", role: "Express middleware inspecting Authorization header for JWT tokens" },
        { path: "src/middlewares/error.middleware.ts", role: "Four-parameter Express error-handling middleware (err, req, res, next)" },
        { path: "src/lib/prisma.ts", role: "Prisma Client singleton instance" },
        { path: "prisma/schema.prisma", role: "Database schema and Prisma models" },
      ],
      requestFlowAscii: `
[Client Request]
       │
       ▼
[express.json()]      ── Parses incoming JSON body onto req.body
       │
       ▼
[express.Router()]    ── Matches path & HTTP method (GET, POST, PUT, DELETE)
       │
       ▼
[auth.middleware]     ── Checks Bearer token: attaches req.user or calls next(new HttpError(401))
       │
       ▼
[Controller]          ── Extracts req.params, req.query, req.body; calls service
       │
       ▼
[Service Layer]       ── Executes business logic using prisma client
       │
       ▼
[res.status().json()] ── Writes response headers, status code, and serialized JSON payload
`,
      frameworkMethods: [
        {
          name: "express.Router()",
          signature: "const router = express.Router()",
          purpose: "Creates an isolated instance of middleware and routes for modular application structure.",
        },
        {
          name: "app.use(path, router)",
          signature: "app.use('/api/users', userRouter)",
          purpose: "Mounts middleware or a sub-router at the specified URL mount point.",
        },
        {
          name: "res.status(code).json(body)",
          signature: "res.status(200).json({ success: true, data })",
          purpose: "Sets the HTTP response status code and sends a JSON payload to the client.",
        },
        {
          name: "next(err)",
          signature: "next(error)",
          purpose: "Passes control to the next middleware in the stack, or routes to the global error handler if an error argument is provided.",
        },
        {
          name: "app.listen(port, callback)",
          signature: "app.listen(PORT, () => console.log('Listening'))",
          purpose: "Binds and listens for connections on the specified host and port.",
        },
      ],
      ormMethods: [
        {
          name: "prisma.user.findMany()",
          signature: "await prisma.user.findMany()",
          purpose: "Retrieves records from PostgreSQL via Prisma.",
        },
        {
          name: "prisma.user.create()",
          signature: "await prisma.user.create({ data })",
          purpose: "Creates a new user record in the database.",
        },
      ],
      extensionGuide: {
        addRoute: "Create `src/routes/<feature>.routes.ts`, export an `express.Router()`, and mount it in `src/index.ts` with `app.use('/api/<feature>', router)`.",
        addModel: "Update `prisma/schema.prisma` with your model and run `bun run db:push`.",
        protectRoute: "Add `authMiddleware` to the route: `router.get('/profile', authMiddleware, controller.getProfile)`.",
      },
      milestones: getStandardNodeMilestones("Express"),
    };
  }

  if (fw === "elysia") {
    return {
      name: "Elysia",
      category: "node",
      entryPoint: "src/index.ts",
      bootstrapExplanation:
        "Elysia is a Bun-native framework built on web standards with TypeBox compile-time type validation. It initializes via `new Elysia()`, chains routes with `.get()` and `.post()`, and binds with `.listen(port)`.",
      keyFiles: [
        { path: "src/index.ts", role: "Elysia instance, plugin registration, and server listener" },
        { path: "src/routes/health.routes.ts", role: "Health check endpoint" },
        { path: "src/routes/user.routes.ts", role: "Type-safe user routing" },
        { path: "src/controllers/user.controller.ts", role: "Controller actions" },
        { path: "src/services/user.service.ts", role: "Prisma data access service" },
        { path: "src/middlewares/auth.middleware.ts", role: "Elysia derive/guard middleware for JWT tokens" },
        { path: "src/lib/prisma.ts", role: "Prisma client instance" },
      ],
      requestFlowAscii: `
[Client Request]
       │
       ▼
[Elysia Router]      ── Fast Bun route resolution
       │
       ▼
[.guard() Schema]    ── TypeBox validation for params, query, and request body
       │
       ▼
[.derive() Auth]     ── Resolves Authorization header and attaches user to context
       │
       ▼
[Handler]            ── Executes service and returns typed result object
       │
       ▼
[JSON Response]      ── Elysia serializes response directly with HTTP status code
`,
      frameworkMethods: [
        {
          name: "new Elysia()",
          signature: "const app = new Elysia()",
          purpose: "Creates an Elysia application instance with fluent chainable routing.",
        },
        {
          name: "app.group(prefix, app => ...)",
          signature: "app.group('/api/users', (app) => app.get('/', ...))",
          purpose: "Creates grouped route scopes with shared prefixes and middlewares.",
        },
        {
          name: "app.guard({ body, query })",
          signature: "app.guard({ body: t.Object({ email: t.String() }) }, ...)",
          purpose: "Enforces TypeBox runtime validation and TypeScript static type inference on incoming requests.",
        },
        {
          name: "app.onError(({ code, error }) => ...)",
          signature: "app.onError(({ code, error }) => { ... })",
          purpose: "Handles unhandled exceptions and validation errors uniformly.",
        },
      ],
      extensionGuide: {
        addRoute: "Create a new Elysia instance in `src/routes/<feature>.routes.ts`, then import and mount it using `.use(featureRoutes)` in `src/index.ts`.",
        addModel: "Add the model in `prisma/schema.prisma` and execute `bun run db:push`.",
        protectRoute: "Use `.derive()` or `.guard()` to verify the token and provide the user object to downstream handlers.",
      },
      milestones: getStandardNodeMilestones("Elysia"),
    };
  }

  if (fw === "rust") {
    return {
      name: "Rust (Axum)",
      category: "native",
      entryPoint: "src/main.rs",
      bootstrapExplanation:
        "The application initializes Tokio runtime via `#[tokio::main]`, configures SQLx database pool, constructs the Axum `Router::new()`, attaches state via `.with_state()`, and binds to `tokio::net::TcpListener`.",
      keyFiles: [
        { path: "src/main.rs", role: "Application entry point, Tokio runtime bootstrap, Axum router assembly, and TCP listener" },
        { path: "src/api/health.rs", role: "Health check route returning JSON status" },
        { path: "src/api/mod.rs", role: "Route registration and handler definitions" },
        { path: "src/db/mod.rs", role: "SQLx connection pool initialization and query helpers" },
        { path: "migrations/", role: "SQL migration scripts managed by sqlx-cli" },
        { path: "Cargo.toml", role: "Rust package manifest declaring dependencies and compiler profiles" },
      ],
      requestFlowAscii: `
[Client Request]
       │
       ▼
[Axum Router]        ── Matched by HTTP method and URI path
       │
       ▼
[State Extractor]    ── State(state): Arc<AppState> provides thread-safe access to SQLx pool
       │
       ▼
[Json Extractor]     ── Json(payload): Deserializes request body via Serde
       │
       ▼
[Handler Function]   ── Async Rust function returning impl IntoResponse
       │
       ▼
[SQLx Pool]          ── Executes asynchronous queries against PostgreSQL
       │
       ▼
[Json(response)]     ── Serializes Rust struct into JSON response
`,
      frameworkMethods: [
        {
          name: "Router::new().route()",
          signature: "Router::new().route('/health', get(health_handler))",
          purpose: "Builds a composable, type-safe routing tree.",
        },
        {
          name: "axum::extract::State",
          signature: "State(state): State<Arc<AppState>>",
          purpose: "Extracts shared application state (e.g. database pool, configs) across Tokio worker threads.",
        },
        {
          name: "axum::Json",
          signature: "Json(payload): Json<CreateUserRequest>",
          purpose: "Serde-powered extractor that deserializes JSON request bodies and serializes responses.",
        },
        {
          name: "axum::response::IntoResponse",
          signature: "impl IntoResponse",
          purpose: "Trait allowing Rust types (tuples, StatusCode, Json) to convert into valid HTTP responses.",
        },
      ],
      ormMethods: [
        {
          name: "sqlx::query_as!",
          signature: "sqlx::query_as!(User, 'SELECT id, email FROM users WHERE id = $1', id)",
          purpose: "Executes compile-time verified SQL queries and maps rows into Rust structs.",
        },
      ],
      extensionGuide: {
        addRoute: "Create a new handler in `src/api/`, declare it in `src/api/mod.rs`, and attach the `.route('/path', get(handler))` in `src/main.rs`.",
        addModel: "Add a new migration in `migrations/`, define the Rust struct with `#[derive(serde::Serialize, sqlx::FromRow)]`, and run `sqlx migrate run`.",
        protectRoute: "Implement Axum middleware using `tower_http` or extractors that validate Authorization headers before handler invocation.",
      },
      milestones: getNativeMilestones("Rust Axum", "cargo run", "cargo test"),
    };
  }

  if (fw === "go") {
    return {
      name: "Go (Fiber)",
      category: "native",
      entryPoint: "cmd/api/main.go",
      bootstrapExplanation:
        "Go Fiber boots in `main.go` by establishing a GORM database connection, initializing `app := fiber.New()`, mounting middlewares (logger, recover, CORS), registering route groups, and listening on a TCP port via `app.Listen(port)`.",
      keyFiles: [
        { path: "cmd/api/main.go", role: "Application entry point and server startup" },
        { path: "internal/handlers/health.go", role: "Health check route handler" },
        { path: "internal/handlers/user.go", role: "User CRUD HTTP handlers" },
        { path: "internal/database/db.go", role: "GORM database connection and connection pool setup" },
        { path: "internal/models/user.go", role: "GORM model struct definitions" },
        { path: "internal/middleware/auth.go", role: "JWT Bearer authentication middleware" },
        { path: "go.mod", role: "Go module definitions and dependency management" },
      ],
      requestFlowAscii: `
[Client Request]
       │
       ▼
[Fiber Fasthttp Engine] ── High-performance zero-allocation HTTP engine
       │
       ▼
[Middlewares]           ── Logger, Recover, CORS
       │
       ▼
[Route Group]           ── app.Group('/api/v1')
       │
       ▼
[Auth Middleware]       ── Verifies JWT, sets c.Locals('user_id', claims.UserID)
       │
       ▼
[Handler Function]      ── Parses input with c.BodyParser(), executes GORM queries
       │
       ▼
[GORM Database]         ── PostgreSQL connection pool query execution
       │
       ▼
[c.Status().JSON()]     ── Formats and writes JSON response
`,
      frameworkMethods: [
        {
          name: "fiber.New()",
          signature: "app := fiber.New()",
          purpose: "Initializes a high-speed Fiber web framework instance.",
        },
        {
          name: "c.Status(code).JSON(data)",
          signature: "return c.Status(fiber.StatusOK).JSON(fiber.Map{'status': 'ok'})",
          purpose: "Sets the HTTP response code and writes a JSON payload.",
        },
        {
          name: "c.BodyParser(&dto)",
          signature: "if err := c.BodyParser(&req); err != nil { return err }",
          purpose: "Parses request body into a Go struct based on Content-Type header.",
        },
        {
          name: "c.Locals(key, value)",
          signature: "c.Locals('user', user); user := c.Locals('user')",
          purpose: "Stores and retrieves request-scoped context between middlewares and handlers.",
        },
      ],
      ormMethods: [
        {
          name: "db.AutoMigrate()",
          signature: "db.AutoMigrate(&models.User{})",
          purpose: "Automatically migrates the database schema based on Go struct tags.",
        },
        {
          name: "db.Where().First()",
          signature: "db.Where('email = ?', email).First(&user)",
          purpose: "Queries a single record matching given parameters.",
        },
      ],
      extensionGuide: {
        addRoute: "Add a handler function in `internal/handlers/`, and register the route in `cmd/api/main.go` using `app.Get('/api/<path>', handlers.YourHandler)`.",
        addModel: "Define a struct in `internal/models/` with `gorm:\"...\"` tags and register it in `db.AutoMigrate()`.",
        protectRoute: "Apply `middleware.Protected()` to the route or route group.",
      },
      milestones: getNativeMilestones("Go Fiber", "go run cmd/api/main.go", "go test ./..."),
    };
  }

  if (fw === "python") {
    return {
      name: "FastAPI",
      category: "native",
      entryPoint: "app/main.py",
      bootstrapExplanation:
        "FastAPI initializes `app = FastAPI()`, configures CORS middleware, includes modular routers from `app/api/`, and runs under Uvicorn ASGI server with automatic OpenAPI Swagger generation.",
      keyFiles: [
        { path: "app/main.py", role: "FastAPI application initialization and router assembly" },
        { path: "app/api/health.py", role: "Health check route" },
        { path: "app/api/users.py", role: "User management API routes" },
        { path: "app/core/database.py", role: "SQLAlchemy engine and session maker" },
        { path: "app/models/user.py", role: "SQLAlchemy ORM models" },
        { path: "requirements.txt", role: "Python dependency manifest" },
      ],
      requestFlowAscii: `
[Client Request]
       │
       ▼
[Uvicorn ASGI Server]  ── Asynchronous Python web gateway
       │
       ▼
[FastAPI Router]       ── URL routing and OpenAPI schema matching
       │
       ▼
[Pydantic Validation]  ── Validates request body and query params automatically
       │
       ▼
[Depends(get_db)]      ── Dependency injection providing scoped SQLAlchemy session
       │
       ▼
[SQLAlchemy ORM]       ── Database transaction and query execution
       │
       ▼
[Response Model]       ── Pydantic model serializes return value to JSON
`,
      frameworkMethods: [
        {
          name: "FastAPI()",
          signature: "app = FastAPI(title='API')",
          purpose: "Creates the main application instance with OpenAPI documentation generated automatically at `/docs`.",
        },
        {
          name: "APIRouter()",
          signature: "router = APIRouter(prefix='/users', tags=['users'])",
          purpose: "Creates modular route groups with path prefixes and tags.",
        },
        {
          name: "Depends(dependency)",
          signature: "db: Session = Depends(get_db)",
          purpose: "FastAPI dependency injection system for managing database sessions and security checks.",
        },
        {
          name: "raise HTTPException",
          signature: "raise HTTPException(status_code=404, detail='Item not found')",
          purpose: "Halts request processing and returns standard JSON error responses with status codes.",
        },
      ],
      extensionGuide: {
        addRoute: "Create `app/api/<feature>.py`, create an `APIRouter`, and include it in `app/main.py` via `app.include_router(feature_router)`.",
        addModel: "Define a class extending `Base` in `app/models/`, and synchronize using Alembic or `Base.metadata.create_all()`.",
        protectRoute: "Add `Depends(get_current_user)` to the route parameters.",
      },
      milestones: getNativeMilestones("FastAPI", "uvicorn app.main:app --reload", "pytest"),
    };
  }

  if (fw === "laravel") {
    return {
      name: "Laravel",
      category: "native",
      entryPoint: "routes/api.php",
      bootstrapExplanation:
        "Laravel boots via `public/index.php`, loading Composer autoloaders, initializing the IoC Service Container, processing global HTTP middleware, and dispatching API routes defined in `routes/api.php`.",
      keyFiles: [
        { path: "routes/api.php", role: "API route definitions" },
        { path: "app/Http/Controllers/UserController.php", role: "User resource controller" },
        { path: "app/Models/User.php", role: "Eloquent ORM model" },
        { path: "database/migrations/", role: "Database schema migration files" },
        { path: "composer.json", role: "PHP dependencies and autoloading definitions" },
      ],
      requestFlowAscii: `
[Client Request]
       │
       ▼
[HTTP Kernel & Middleware] ── EncryptCookies, SubstituteBindings, ThrottleRequests
       │
       ▼
[routes/api.php]            ── Route::apiResource('users', UserController::class)
       │
       ▼
[Sanctum Auth Middleware]  ── auth:sanctum validates personal access token
       │
       ▼
[Controller Action]        ── FormRequest validates input; Eloquent model queried
       │
       ▼
[Eloquent ORM]             ── Database query executed with connection pooling
       │
       ▼
[response()->json()]       ── Formats and outputs serialized JSON response
`,
      frameworkMethods: [
        {
          name: "Route::apiResource()",
          signature: "Route::apiResource('users', UserController::class)",
          purpose: "Registers standard RESTful API routes (index, store, show, update, destroy).",
        },
        {
          name: "response()->json()",
          signature: "return response()->json(['data' => $user], 200)",
          purpose: "Returns a typed JSON response with HTTP status code.",
        },
      ],
      extensionGuide: {
        addRoute: "Add route definitions in `routes/api.php` and create controllers via `php artisan make:controller <Name>Controller`.",
        addModel: "Generate model and migration with `php artisan make:model <Name> -m`, then run `php artisan migrate`.",
        protectRoute: "Apply middleware: `Route::middleware('auth:sanctum')->group(...)`.",
      },
      milestones: getNativeMilestones("Laravel", "php artisan serve", "php artisan test"),
    };
  }

  if (fw === "nextjs") {
    return {
      name: "Next.js",
      category: "fullstack",
      entryPoint: "app/page.tsx",
      bootstrapExplanation:
        "Next.js App Router uses file-system based routing under `app/`. `app/layout.tsx` provides the persistent root UI shell, `app/page.tsx` renders the home page as a React Server Component, and `app/api/**/route.ts` files expose web-standard API Route Handlers.",
      keyFiles: [
        { path: "app/layout.tsx", role: "Root layout wrapping all pages with HTML, body, and global styles" },
        { path: "app/page.tsx", role: "Root landing page rendered as a React Server Component" },
        { path: "app/api/health/route.ts", role: "API route handler returning server health status" },
        { path: "prisma/schema.prisma", role: "Database schema" },
        { path: "package.json", role: "Next.js scripts and dependencies" },
      ],
      requestFlowAscii: `
[Client Request]
       │
       ├──▶ [Page Route (/)]           ── React Server Component renders server-side HTML
       │
       └──▶ [API Route (/api/health)]  ── Web-standard Request/Response Route Handler
                   │
                   ▼
       [Prisma Database Query]        ── Direct database query execution
                   │
                   ▼
       [NextResponse.json(data)]       ── Serialized JSON response
`,
      frameworkMethods: [
        {
          name: "export async function GET(request: Request)",
          signature: "export async function GET(req: Request) { return NextResponse.json({ ok: true }); }",
          purpose: "Defines an HTTP GET route handler compliant with Web Fetch standards.",
        },
        {
          name: "NextResponse.json()",
          signature: "return NextResponse.json(data, { status: 200 })",
          purpose: "Returns a typed Web Response with JSON body and status code.",
        },
        {
          name: "export default async function Page()",
          signature: "export default async function Page() { return <div>Hello</div>; }",
          purpose: "Defines a React Server Component that fetches data directly on the server without shipping JavaScript to the client.",
        },
      ],
      extensionGuide: {
        addRoute: "Create `app/api/<feature>/route.ts` with exported `GET` and `POST` async functions.",
        addModel: "Update `prisma/schema.prisma` and run `bun run db:push`.",
        protectRoute: "Inspect headers/cookies inside your route handler or use middleware in `middleware.ts`.",
      },
      milestones: getStandardNodeMilestones("Next.js"),
    };
  }

  // Frontend SPA (React / Vue)
  return {
    name: fw === "vue" ? "Vue 3" : "React",
    category: "web",
    entryPoint: fw === "vue" ? "src/main.ts" : "src/main.tsx",
    bootstrapExplanation:
      "A fast Vite SPA. The entry point mounts the root component into `#root` in `index.html`. API calls communicate with external backends using `fetch()`.",
    keyFiles: [
      { path: fw === "vue" ? "src/main.ts" : "src/main.tsx", role: "Vite SPA entry point mounting the root application" },
      { path: fw === "vue" ? "src/App.vue" : "src/App.tsx", role: "Root visual component" },
      { path: "src/lib/api.ts", role: "HTTP client utilities for backend API communication" },
      { path: "vite.config.ts", role: "Vite build and dev server configuration" },
      { path: "index.html", role: "HTML shell hosting the mounted application" },
    ],
    requestFlowAscii: `
[User Browser]
       │
       ▼
[index.html]           ── Loads root div and bundled JavaScript
       │
       ▼
[main.tsx / main.ts]   ── Mounts application into the DOM
       │
       ▼
[App Component]        ── Renders UI and manages local/reactive state
       │
       ▼
[api.ts client]        ── Issues async fetch() requests to backend API
`,
    frameworkMethods: [
      {
        name: "fetch(url, options)",
        signature: "const res = await fetch('/api/health'); const data = await res.json();",
        purpose: "Standard Web API for asynchronous HTTP requests to backend services.",
      },
    ],
    extensionGuide: {
      addRoute: "Create a new page component and register it in your router.",
      addModel: "N/A — This is a frontend SPA. Models are managed by your backend API.",
      protectRoute: "Create an auth guard wrapper component that checks user session state.",
    },
    milestones: getFrontendMilestones(fw === "vue" ? "Vue" : "React"),
  };
}

function getStandardNodeMilestones(frameworkName: string): LearnMilestone[] {
  return [
    {
      number: 1,
      title: "Project Initialization & Tooling",
      goal: "Inspect dependencies, verify package scripts, and understand environment configuration.",
      concept: "Modern applications maintain strict separation between runtime code and configuration. Environment variables protect credentials from source control.",
      bestPractice: "Never hardcode connection strings or secrets. Validate that required environment variables exist at application boot.",
      keyMethods: [
        { name: "bun install", purpose: "Installs locked dependencies specified in package.json." },
        { name: "process.env", purpose: "Reads runtime environment variables injected by .env." },
      ],
      verificationCommand: "bun run typecheck",
    },
    {
      number: 2,
      title: "Server Entry Point & Health Route",
      goal: `Construct the ${frameworkName} server instance and expose a health probe at GET /api/health.`,
      concept: "A health check route serves as a liveness probe for load balancers and container orchestrators (like Docker and Kubernetes) to ensure the service is responsive.",
      bestPractice: "Keep the entry point minimal. Delegate route definitions and business logic into dedicated modular files.",
      keyMethods: [
        { name: "new Framework()", purpose: "Instantiates the HTTP application router." },
        { name: "app.get('/api/health')", purpose: "Binds an HTTP GET handler returning server status and uptime." },
      ],
      verificationCommand: "curl -i http://localhost:3000/api/health",
    },
    {
      number: 3,
      title: "Database Connection & Schema Definition",
      goal: "Connect the application to PostgreSQL using Prisma ORM and define a declarative schema.",
      concept: "Connection pooling maintains a reusable set of active database connections, eliminating the performance cost of establishing new TCP handshakes per HTTP request.",
      bestPractice: "Maintain a singleton database client across the application lifecycle to prevent connection pool exhaustion.",
      keyMethods: [
        { name: "new PrismaClient()", purpose: "Instantiates the connection pool client." },
        { name: "bun run db:push", purpose: "Pushes the declarative Prisma schema directly to the database." },
      ],
      verificationCommand: "bun run db:push",
    },
    {
      number: 4,
      title: "Core CRUD Feature (Users / Items)",
      goal: "Implement endpoints to create, retrieve, and list records using the controller-service pattern.",
      concept: "The controller-service pattern decouples HTTP transport concerns (parsing query parameters and formulating status codes) from core business logic and database queries.",
      bestPractice: "Never execute raw database queries directly inside route definitions. Encapsulate data access inside service functions.",
      keyMethods: [
        { name: "prisma.user.findMany()", purpose: "Queries a collection of records." },
        { name: "prisma.user.create()", purpose: "Inserts a new record into the database." },
      ],
      verificationCommand: "curl -i http://localhost:3000/api/users",
    },
    {
      number: 5,
      title: "Input Validation & Error Boundaries",
      goal: "Validate incoming request payloads at system boundaries and handle exceptions gracefully.",
      concept: "Untrusted client data must be validated against a strict schema before reaching domain logic to prevent injection attacks and runtime crashes.",
      bestPractice: "Return consistent, RFC-compliant error payloads with appropriate HTTP status codes (400 Bad Request, 404 Not Found, 500 Internal Server Error).",
      keyMethods: [
        { name: "z.object() / TypeBox", purpose: "Declares strict runtime validation schemas." },
        { name: "centralized error handler", purpose: "Catches uncaught errors and prevents process termination." },
      ],
      verificationCommand: "curl -i -X POST http://localhost:3000/api/users -H 'Content-Type: application/json' -d '{}'",
    },
    {
      number: 6,
      title: "Authentication & Protected Routes",
      goal: "Implement secure user registration, password hashing, JWT token signing, and route protection.",
      concept: "Stateless authentication relies on digitally signed JSON Web Tokens (JWT) passed in the HTTP Authorization header, allowing horizontal scaling without server-side session stores.",
      bestPractice: "Hash passwords using modern memory-hard algorithms (Argon2id or bcrypt with appropriate work factors). Never store plaintext passwords.",
      keyMethods: [
        { name: "argon2.hash()", purpose: "Hashes passwords securely before saving to the database." },
        { name: "jwt.sign()", purpose: "Generates signed tokens with expiry and user claims." },
        { name: "jwt.verify()", purpose: "Validates token authenticity in middleware before permitting route execution." },
      ],
      verificationCommand: "curl -i -H 'Authorization: Bearer invalid-token' http://localhost:3000/api/users",
    },
  ];
}

function getNativeMilestones(stackName: string, devCmd: string, testCmd: string): LearnMilestone[] {
  return [
    {
      number: 1,
      title: "Tooling & Environment Setup",
      goal: `Set up the compiler/runtime environment for ${stackName} and verify project dependencies.`,
      concept: "Compiled and native runtimes leverage static typing and native binaries for high throughput and predictable memory usage.",
      bestPractice: "Isolate external configuration in `.env` and verify compiler flags before building.",
      keyMethods: [
        { name: devCmd, purpose: "Starts the development server with live compilation or execution." },
      ],
      verificationCommand: testCmd,
    },
    {
      number: 2,
      title: "Server Entry Point & Health Route",
      goal: "Initialize the web application and register the GET /api/health endpoint.",
      concept: "The entry point configures the network listener and organizes routing hierarchies.",
      bestPractice: "Structure routes into modules to prevent monolithic entry files.",
      keyMethods: [
        { name: "Router setup", purpose: "Registers HTTP methods and path routes." },
      ],
      verificationCommand: "curl -i http://localhost:8080/api/health",
    },
    {
      number: 3,
      title: "Database Connection & Migrations",
      goal: "Configure database connection pooling and establish migration tooling.",
      concept: "Database migrations provide version-controlled, reproducible transformations of database schemas.",
      bestPractice: "Always use migrations for schema changes rather than manual database mutations.",
      keyMethods: [
        { name: "Connection Pool", purpose: "Manages persistent database sockets." },
      ],
      verificationCommand: testCmd,
    },
    {
      number: 4,
      title: "Core CRUD Feature Implementation",
      goal: "Implement resource endpoints using idiomatic data models and query builders.",
      concept: "Separating data access from HTTP transport ensures maintainable, testable software.",
      bestPractice: "Handle database errors explicitly without exposing internal database errors to clients.",
      keyMethods: [
        { name: "Query Execution", purpose: "Executes typed queries against PostgreSQL." },
      ],
      verificationCommand: "curl -i http://localhost:8080/api/users",
    },
    {
      number: 5,
      title: "Validation, Middleware & Error Handling",
      goal: "Implement request validation and structured error responses.",
      concept: "Defensive input validation prevents malformed requests from corrupting database state.",
      bestPractice: "Return standardized JSON error objects with accurate HTTP status codes.",
      keyMethods: [
        { name: "Middleware Handler", purpose: "Intercepts requests for logging, CORS, and panic recovery." },
      ],
      verificationCommand: testCmd,
    },
    {
      number: 6,
      title: "Authentication & Route Protection",
      goal: "Implement cryptographic password hashing and JWT token verification.",
      concept: "Protecting sensitive routes requires validating cryptographic signatures on incoming request headers.",
      bestPractice: "Reject unauthenticated or expired requests with HTTP 401 Unauthorized before business logic runs.",
      keyMethods: [
        { name: "Token Verification", purpose: "Validates Bearer token signatures and extracts claims." },
      ],
      verificationCommand: "curl -i -H 'Authorization: Bearer bad-token' http://localhost:8080/api/users",
    },
  ];
}

function getFrontendMilestones(frameworkName: string): LearnMilestone[] {
  return [
    {
      number: 1,
      title: "Vite Tooling & Project Structure",
      goal: `Understand the ${frameworkName} Vite project layout, development server, and build pipeline.`,
      concept: "Modern frontend tooling uses ES modules for instant hot module replacement during development and optimized rollups for production.",
      bestPractice: "Keep visual components small, reusable, and single-purpose.",
      keyMethods: [
        { name: "bun run dev", purpose: "Starts Vite hot-reload development server." },
        { name: "bun run build", purpose: "Produces minified, production-ready static assets in dist/." },
      ],
      verificationCommand: "bun run build",
    },
    {
      number: 2,
      title: "Component Hierarchy & UI Layout",
      goal: "Design the visual layout using clean modular components.",
      concept: "Component-based architecture decomposes interfaces into composable, isolated building blocks.",
      bestPractice: "Separate presentational components from stateful container components.",
      keyMethods: [
        { name: "Root Component", purpose: "Houses navigation, layout containers, and view routers." },
      ],
      verificationCommand: "bun run dev",
    },
    {
      number: 3,
      title: "API Client & Async Data Fetching",
      goal: "Connect the frontend application to an external API backend.",
      concept: "Client-side applications query backend APIs asynchronously over HTTP and manage loading, success, and error states.",
      bestPractice: "Encapsulate HTTP queries in a dedicated `src/lib/api.ts` module with unified error handling.",
      keyMethods: [
        { name: "fetch()", purpose: "Dispatches HTTP requests to backend endpoints." },
      ],
      verificationCommand: "bun run build",
    },
  ];
}
