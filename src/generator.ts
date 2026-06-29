import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { createPackageJson } from "./package-json";
import { readTemplate, injectVariables } from "./template-engine";
import type { DbTarget, ExtraPackage, ProjectOptions } from "./types";
import console from "node:console";
import { inherits } from "node:util";
import { cwd, env } from "node:process";

// ---------------------------------------------------------------------------
// Cryptographic secret helpers
// ---------------------------------------------------------------------------

/** Generate a 48-byte (96-char hex) secret suitable for JWT_SECRET. */
function generateJwtSecret(): string {
  return randomBytes(48).toString("hex");
}

/** Generate a 16-byte (32-char hex) password for the Docker PostgreSQL user. */
function generateDbPassword(): string {
  return "qwykz_local_password";
}

const PROJECT_FOLDERS = [
  "src/controllers",
  "src/services",
  "src/middlewares",
  "src/lib",
  "src/routes",
  "prisma",
];

async function writeJson(path: string, value: unknown) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

// ---------------------------------------------------------------------------
// Template resolvers — pick the right variant and inject variables
// ---------------------------------------------------------------------------

async function resolveEnvFile(
  dbTarget: DbTarget,
  projectName: string,
  jwtSecret: string,
  dbPassword: string,
): Promise<string> {
  const variantMap: Record<DbTarget, string> = {
    supabase: "express/env.supabase.txt",
    docker: "express/env.docker.txt",
    local: "express/env.local.txt",
    neon: "express/env.neon.txt",
  };

  const raw = await readTemplate(variantMap[dbTarget]);

  if (dbTarget === "supabase" || dbTarget === "neon") {
    return injectVariables(raw, { JWT_SECRET: jwtSecret });
  }

  if (dbTarget === "docker") {
    return injectVariables(raw, {
      PROJECT_NAME: projectName,
      JWT_SECRET: jwtSecret,
      DB_PASSWORD: dbPassword,
    });
  }

  // local
  return injectVariables(raw, {
    PROJECT_NAME: projectName,
    JWT_SECRET: jwtSecret,
  });
}

async function resolveDockerCompose(
  projectName: string,
  dbPassword: string,
): Promise<string> {
  const raw = await readTemplate("express/docker-compose.yml");
  return injectVariables(raw, {
    PROJECT_NAME: projectName,
    DB_PASSWORD: dbPassword,
  });
}

async function resolvePrismaClient(dbTarget: DbTarget): Promise<string> {
  const variant =
    dbTarget === "supabase"
      ? "express/prisma-client.supabase.ts"
      : "express/prisma-client.default.ts";
  return readTemplate(variant);
}

async function resolveServerSource(
  extraPackages: ExtraPackage[],
): Promise<string> {
  const hasCors = extraPackages.includes("cors");
  const hasHelmet = extraPackages.includes("helmet");

  let extraImports = "";
  if (hasCors) extraImports += 'import cors from "cors";\n';
  if (hasHelmet) extraImports += 'import helmet from "helmet";\n';

  let extraMiddleware = "";
  if (hasHelmet) extraMiddleware += "app.use(helmet());\n";
  if (hasCors) extraMiddleware += "app.use(cors());\n";

  const raw = await readTemplate("express/server.ts");
  return injectVariables(raw, {
    EXTRA_IMPORTS: extraImports,
    EXTRA_MIDDLEWARE: extraMiddleware,
  });
}

async function resolveUserController(
  extraPackages: ExtraPackage[],
): Promise<string> {
  const variant = extraPackages.includes("zod")
    ? "express/user.controller.zod.ts"
    : "express/user.controller.default.ts";
  return readTemplate(variant);
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------

export async function generateExpressProject(options: ProjectOptions) {
  const targetDir = join(process.cwd(), options.projectName);

  // Generate cryptographically secure secrets once per scaffold run.
  // These are never printed to the terminal.
  const jwtSecret = generateJwtSecret();
  const dbPassword = generateDbPassword();

  // Create directory structure
  await Promise.all(
    PROJECT_FOLDERS.map((folder) =>
      mkdir(join(targetDir, folder), { recursive: true }),
    ),
  );

  // Resolve all template contents in parallel
  const [
    prismaSchema,
    prismaConfig,
    tsconfig,
    envFile,
    prismaClient,
    serverSource,
    errorMiddleware,
    healthRoutes,
    userRoutes,
    userController,
    userService,
    authController,
    authMiddleware,
    authRoutes,
    waitForPostgres,
    dockerCompose,
    exampleTest,
  ] = await Promise.all([
    readTemplate("express/schema.prisma"),
    readTemplate("express/prisma.config.ts"),
    readTemplate("express/tsconfig.json"),
    resolveEnvFile(
      options.dbTarget,
      options.projectName,
      jwtSecret,
      dbPassword,
    ),
    resolvePrismaClient(options.dbTarget),
    resolveServerSource(options.extraPackages),
    readTemplate("express/error.middleware.ts"),
    readTemplate("express/health.routes.ts"),
    readTemplate("express/user.routes.ts"),
    resolveUserController(options.extraPackages),
    readTemplate("express/user.service.ts"),
    readTemplate("express/auth.controller.ts"),
    readTemplate("express/auth.middleware.ts"),
    readTemplate("express/auth.routes.ts"),
    options.dbTarget === "docker"
      ? readTemplate("express/wait-for-postgres.ts")
      : Promise.resolve(null),
    options.dbTarget === "docker"
      ? resolveDockerCompose(options.projectName, dbPassword)
      : Promise.resolve(null),
    readTemplate("express/example.test.ts"),
  ]);

  // Assemble file list
  const files: Array<[string, string]> = [
    ["prisma/schema.prisma", prismaSchema],
    ["prisma.config.ts", prismaConfig],
    ["tsconfig.json", tsconfig],
    [".env", envFile],
    ["src/lib/prisma.ts", prismaClient],
    ["src/index.ts", serverSource],
    ["src/index.test.ts", exampleTest],
    ["src/middlewares/error.middleware.ts", errorMiddleware],
    ["src/middlewares/auth.middleware.ts", authMiddleware],
    ["src/routes/health.routes.ts", healthRoutes],
    ["src/routes/user.routes.ts", userRoutes],
    ["src/routes/auth.routes.ts", authRoutes],
    ["src/controllers/user.controller.ts", userController],
    ["src/controllers/auth.controller.ts", authController],
    ["src/services/user.service.ts", userService],
  ];

  if (options.dbTarget === "docker") {
    files.splice(5, 0, ["src/lib/wait-for-postgres.ts", waitForPostgres!]);
    files.push(["docker-compose.yml", dockerCompose!]);
  }

  // Write all files + package.json in parallel
  await Promise.all([
    ...files.map(([path, content]) =>
      writeFile(join(targetDir, path), content),
    ),
    createPackageJson(
      options.projectName,
      options.dbTarget,
      options.extraPackages,
    ).then((pkgJson) => writeJson(join(targetDir, "package.json"), pkgJson)),
  ]);
}

async function generateLaravelProject(options: ProjectOptions) {
  const targetDir = join(process.cwd(), options.projectName);
  const dbPassword = generateDbPassword();

  console.log(`\n🚀Fetching the latest Laravel framework via Composer`);

  const proc = Bun.spawn({
    cmd: [
      "composer",
      "create-project",
      "laravel/laravel",
      options.projectName,
      "--no-scripts",
    ],
    cwd: process.cwd(),
    stdout: "ignore",
    stderr: "ignore",
  });

  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    throw new Error(
      "Composer failed to install Laravel. Do you have PHP/Composer installed?",
    );
  }

  console.log(`✅ Laravel installation complete!`);

  console.log(`\n🏗️  Installing API Routes & Sanctum...`);
  const apiProc = Bun.spawn(
    ["php", "artisan", "install:api", "--without-migration-prompt"],
    {
      cwd: targetDir,
      stdout: "ignore",
      stderr: "ignore",
    },
  );
  await apiProc.exited;

  const apiRoutePath = join(targetDir, "routes/api.php");
  const stub = await readTemplate("laravel/routes/api.stub");
  const existing = await Bun.file(apiRoutePath).text();
  await Bun.write(apiRoutePath, existing + "\n" + stub);

  console.log(`\n🔑 Enabling API Tokens on User Model...`);
  const userModelPath = join(targetDir, "app/Models/User.php");
  let userModelContent = await Bun.file(userModelPath).text();
  userModelContent = userModelContent.replace(
    "use HasFactory, Notifiable;",
    "use \\Laravel\\Sanctum\\HasApiTokens, HasFactory, Notifiable;",
  );
  await Bun.write(userModelPath, userModelContent);

  console.log(`\n💉 Injecting PostgreSQL configuration.
  ..`);

  const envExamplePath = join(targetDir, ".env.example");
  const envPath = join(targetDir, ".env");

  let envContent = await Bun.file(envExamplePath).text();

  envContent = envContent.replace(
    "DB_CONNECTION=sqlite",
    "DB_CONNECTION=pgsql",
  );

  if (options.dbTarget === "supabase") {
    const parsed = new URL(
      options.supabaseDbUrl ||
        "postgresql://postgres:postgres@aws-0-eu-central-1.pooler.supabase.com:5432/postgres",
    );
    envContent = envContent.replace(
      "# DB_HOST=127.0.0.1",
      `DB_HOST=${parsed.hostname}`,
    );
    envContent = envContent.replace(
      "# DB_PORT=3306",
      `DB_PORT=${parsed.port || "5432"}`,
    );
    envContent = envContent.replace(
      "# DB_DATABASE=laravel",
      `DB_DATABASE=postgres`,
    );
    envContent = envContent.replace(
      "# DB_USERNAME=root",
      `DB_USERNAME=${parsed.username}`,
    );
    envContent = envContent.replace(
      "# DB_PASSWORD=",
      `DB_PASSWORD=${parsed.password}`,
    );
  } else {
    envContent = envContent.replace("# DB_HOST=127.0.0.1", "DB_HOST=127.0.0.1");
    envContent = envContent.replace(
      "# DB_PORT=3306",
      `DB_PORT=${options.dbTarget === "docker" ? "54320" : "5432"}`,
    );
    envContent = envContent.replace(
      "# DB_DATABASE=laravel",
      `DB_DATABASE=${options.projectName}`,
    );
    envContent = envContent.replace(
      "# DB_USERNAME=root",
      "DB_USERNAME=postgres",
    );
    envContent = envContent.replace(
      "# DB_PASSWORD=",
      `DB_PASSWORD=${options.dbTarget === "docker" ? dbPassword : "postgres"}`,
    );
  }

  await writeFile(envPath, envContent);

  if (options.dbTarget === "docker") {
    console.log(`\n🐳 Generating docker-compose.yml...
  `);

    const dockerCompose = await resolveDockerCompose(
      options.projectName,
      dbPassword,
    );

    await writeFile(join(targetDir, "docker-compose.yml"), dockerCompose);
  } else if (options.dbTarget === "local") {
  } else if (options.dbTarget === "supabase") {
  }

  // Create advanced Service structure
  console.log(`\n🏗️  Scaffolding Pro Architecture (Services & Controllers)...`);

  await mkdir(join(targetDir, "app/Services"), { recursive: true });
  await mkdir(join(targetDir, "app/Http/Controllers/Api"), { recursive: true });

  const [authService, userService, authController, userController] =
    await Promise.all([
      readTemplate("laravel/app/Services/AuthService.php"),
      readTemplate("laravel/app/Services/UserService.php"),
      readTemplate("laravel/app/Http/Controllers/Api/AuthController.php"),
      readTemplate("laravel/app/Http/Controllers/Api/UserController.php"),
    ]);

  await Promise.all([
    writeFile(join(targetDir, "app/Services/AuthService.php"), authService),
    writeFile(join(targetDir, "app/Services/UserService.php"), userService),
    writeFile(
      join(targetDir, "app/Http/Controllers/Api/AuthController.php"),
      authController,
    ),
    writeFile(
      join(targetDir, "app/Http/Controllers/Api/UserController.php"),
      userController,
    ),
  ]);
}

async function generateNextJsProject(options: ProjectOptions) {
  const targetDir = join(process.cwd(), options.projectName);
  const dbPassword = generateDbPassword();

  console.log(`\n🚀 Scaffolding Next.js App Router...`);

  const nextProc = Bun.spawn(
    [
      "bunx",
      "create-next-app@latest",
      options.projectName,
      "--typescript",
      "--tailwind",
      "--eslint",
      "--app",
      "--import-alias",
      "@/*",
      "--use-bun",
      "--yes",
    ],
    {
      cwd: process.cwd(),
      stdout: "ignore",
      stderr: "inherit",
    },
  );

  const nextProcCode = await nextProc.exited;
  if (nextProcCode !== 0) {
    throw new Error("Failed to scaffold Next.js. Ensure you have network connectivity.");
  }

  console.log(`\n📦 Installing Dependencies (Prisma, Zod, Argon2, pg)...`);
  await Bun.spawn(["bun", "add", "@prisma/client", "zod", "argon2", "pg", "@prisma/adapter-pg", "jsonwebtoken"], { cwd: targetDir }).exited;
  await Bun.spawn(["bun", "add", "-d", "prisma", "@types/node", "@types/pg", "@types/jsonwebtoken"], { cwd: targetDir }).exited;

  console.log(
    `\n🔒 Configuring Security Headers (Helmet & CORS) & Database...`,
  );

  const envPath = join(targetDir, ".env");
  let envContent = "";
  if (options.dbTarget === "supabase") {
    const parsed = new URL(options.supabaseDbUrl || "postgresql://postgres:postgres@aws-0-eu-central-1.pooler.supabase.com:5432/postgres");
    envContent = `DATABASE_URL="${options.supabaseDbUrl}"\nDIRECT_URL="postgresql://${parsed.username}:${parsed.password}@${parsed.hostname}:5432/postgres"\nJWT_SECRET="${generateJwtSecret()}"\n`;
  } else {
    const port = options.dbTarget === "docker" ? "54320" : "5432";
    const pass = options.dbTarget === "docker" ? dbPassword : "postgres";
    envContent = `DATABASE_URL="postgresql://postgres:${pass}@localhost:${port}/${options.projectName}?schema=public"\nJWT_SECRET="${generateJwtSecret()}"\n`;
  }
  await Bun.write(envPath, envContent);

  const prismaClientStub = options.dbTarget === "supabase" 
    ? await readTemplate("express/prisma-client.supabase.ts") 
    : await readTemplate("express/prisma-client.default.ts");

  const files: Array<[string, string | undefined]> = [
    ["next.config.mjs", await readTemplate("nextjs/next.config.mjs")],
    ["prisma/schema.prisma", await readTemplate("express/schema.prisma")],
    ["prisma.config.ts", await readTemplate("express/prisma.config.ts")],
    ["lib/prisma.ts", prismaClientStub],
    ["app/api/auth/register/route.ts", await readTemplate("nextjs/auth.route.ts")],
    ["app/api/auth/login/route.ts", await readTemplate("nextjs/login.route.ts")],
    ["app/api/health/route.ts", await readTemplate("nextjs/health.route.ts")],
    ["__tests__/example.test.ts", await readTemplate("nextjs/example.test.ts")],
  ];

  if (options.dbTarget === "docker") {
    files.push(["docker-compose.yml", await resolveDockerCompose(options.projectName, dbPassword)]);
  }

  await Promise.all(
    files.map(async ([path, content]) => {
      const fullPath = join(targetDir, path);
      await Bun.spawn(["mkdir", "-p", fullPath.split('/').slice(0, -1).join('/')]).exited;
      await Bun.write(fullPath, content || "");
    })
  );

  // Inject Prisma and Test scripts into Next.js package.json
  const pkgPath = join(targetDir, "package.json");
  const pkgContent = await Bun.file(pkgPath).text();
  const pkgJson = JSON.parse(pkgContent);
  pkgJson.scripts = {
    ...pkgJson.scripts,
    "test": "bun test",
    "db:generate": "bunx --bun prisma generate",
    "db:push": "bunx --bun prisma db push",
    "db:studio": "bunx --bun prisma studio",
  };
  await Bun.write(pkgPath, JSON.stringify(pkgJson, null, 2));
}

async function generateReactProject(options: ProjectOptions) {
  console.log(`\n🚀 Scaffolding React + Vite...`);
  const proc = Bun.spawn(
    ["bunx", "create-vite", options.projectName, "--template", "react-ts"],
    { cwd: process.cwd(), stdout: "ignore", stderr: "ignore" },
  );
  if (await proc.exited !== 0) throw new Error("Failed to scaffold React.");

  const targetDir = join(process.cwd(), options.projectName);
  await mkdir(join(targetDir, "src", "lib"), { recursive: true });

  const supabaseTs = await readTemplate("react/supabase.ts.stub");
  const authContextTsx = await readTemplate("react/AuthContext.tsx.stub");
  const appTsx = await readTemplate("react/App.tsx.stub");
  const viteConfig = await readTemplate("react/vite.config.ts.stub");
  const indexCss = await readTemplate("react/index.css.stub");

  await Bun.write(join(targetDir, "src", "lib", "supabase.ts"), supabaseTs);
  await Bun.write(join(targetDir, "src", "lib", "AuthContext.tsx"), authContextTsx);
  await Bun.write(join(targetDir, "src", "App.tsx"), appTsx);
  await Bun.write(join(targetDir, "vite.config.ts"), viteConfig);
  await Bun.write(join(targetDir, "src", "index.css"), indexCss);

  const pkgPath = join(targetDir, "package.json");
  const pkgJson = await Bun.file(pkgPath).json();
  pkgJson.dependencies = pkgJson.dependencies || {};
  pkgJson.devDependencies = pkgJson.devDependencies || {};
  
  pkgJson.dependencies["@supabase/supabase-js"] = "^2.43.0";
  pkgJson.dependencies["zod"] = "^3.23.0";
  pkgJson.dependencies["tailwindcss"] = "^4.0.0";
  pkgJson.devDependencies["@tailwindcss/vite"] = "^4.0.0";
  
  await Bun.write(pkgPath, JSON.stringify(pkgJson, null, 2));

  const envContent = `VITE_SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"\nVITE_SUPABASE_ANON_KEY="YOUR_ANON_KEY"\n`;
  await Bun.write(join(targetDir, ".env"), envContent);
  await Bun.write(join(targetDir, ".env.example"), envContent);
}

async function generateVueProject(options: ProjectOptions) {
  console.log(`\n🚀 Scaffolding Vue + Vite...`);
  const proc = Bun.spawn(
    ["bunx", "create-vite", options.projectName, "--template", "vue-ts"],
    { cwd: process.cwd(), stdout: "ignore", stderr: "ignore" },
  );
  if (await proc.exited !== 0) throw new Error("Failed to scaffold Vue.");

  const targetDir = join(process.cwd(), options.projectName);
  await mkdir(join(targetDir, "src", "lib"), { recursive: true });

  const supabaseTs = await readTemplate("vue/supabase.ts.stub");
  const authTs = await readTemplate("vue/auth.ts.stub");
  const appVue = await readTemplate("vue/App.vue.stub");
  const viteConfig = await readTemplate("vue/vite.config.ts.stub");
  const styleCss = await readTemplate("vue/style.css.stub");

  await Bun.write(join(targetDir, "src", "lib", "supabase.ts"), supabaseTs);
  await Bun.write(join(targetDir, "src", "lib", "auth.ts"), authTs);
  await Bun.write(join(targetDir, "src", "App.vue"), appVue);
  await Bun.write(join(targetDir, "vite.config.ts"), viteConfig);
  await Bun.write(join(targetDir, "src", "style.css"), styleCss);

  const pkgPath = join(targetDir, "package.json");
  const pkgJson = await Bun.file(pkgPath).json();
  pkgJson.dependencies = pkgJson.dependencies || {};
  pkgJson.devDependencies = pkgJson.devDependencies || {};
  
  pkgJson.dependencies["@supabase/supabase-js"] = "^2.43.0";
  pkgJson.dependencies["zod"] = "^3.23.0";
  pkgJson.dependencies["tailwindcss"] = "^4.0.0";
  pkgJson.devDependencies["@tailwindcss/vite"] = "^4.0.0";
  
  await Bun.write(pkgPath, JSON.stringify(pkgJson, null, 2));

  const envContent = `VITE_SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"\nVITE_SUPABASE_ANON_KEY="YOUR_ANON_KEY"\n`;
  await Bun.write(join(targetDir, ".env"), envContent);
  await Bun.write(join(targetDir, ".env.example"), envContent);
}

export async function generateProject(options: ProjectOptions) {
  if (options.framework === "express") {
    await generateExpressProject(options);
  } else if (options.framework === "laravel") {
    await generateLaravelProject(options);
  } else if (options.framework === "nextjs") {
    await generateNextJsProject(options);
  } else if (options.framework === "react") {
    await generateReactProject(options);
  } else if (options.framework === "vue") {
    await generateVueProject(options);
  }
}
