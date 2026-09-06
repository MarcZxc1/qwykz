import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { readTemplate } from "../../template-engine";
import type { ProjectOptions } from "../../types";
import { generateDbPassword } from "../shared/files";
import { resolveDockerCompose } from "../shared/runtime";

export async function generateLaravelProject(options: ProjectOptions) {
  if (!Bun.which("composer") || !Bun.which("php")) {
    throw new Error(
      "Laravel scaffolding requires 'composer' and 'php' (>= 8.2) to be installed and available in your PATH.",
    );
  }

  const targetDir = join(process.cwd(), options.projectName);
  const dbPassword = generateDbPassword();

  console.log(`\n🚀Fetching the latest Laravel framework via Composer`);
  await rm(targetDir, { recursive: true, force: true }).catch(() => {});

  const proc = Bun.spawn({
    cmd: [
      "composer",
      "create-project",
      "laravel/laravel",
      options.projectName,
      "--no-scripts",
    ],
    cwd: process.cwd(),
    stdout: "pipe",
    stderr: "pipe",
    env: { ...process.env },
  });

  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    const errText = await new Response(proc.stderr).text();
    throw new Error(
      `Composer failed to install Laravel. Error: ${errText}`
    );
  }

  if (options.cachingTarget === "upstash" || options.cachingTarget === "docker") {
    console.log(`\n📦 Installing predis for Redis caching...`);
    const procRedis = Bun.spawn({
      cmd: ["composer", "require", "predis/predis"],
      cwd: targetDir,
      stdout: "ignore",
      stderr: "ignore",
      env: { ...process.env },
    });
    await procRedis.exited;
  }

  console.log(`◑  Scaffolding qwykz architecture..✅ Laravel installation complete!\n`);

  console.log(`\n🏗️  Installing API Routes & Sanctum...`);
  const apiProc = Bun.spawn(
    ["php", "artisan", "install:api", "--without-migration-prompt"],
    {
      cwd: targetDir,
      stdout: "ignore",
      stderr: "ignore",
      env: { ...process.env },
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

  envContent += "\n# CORS / Frontend\nFRONTEND_URL=http://localhost:5173\nSANCTUM_STATEFUL_DOMAINS=localhost:5173,localhost:3000\n";

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
      `DB_PORT=${options.dbTarget === "docker" ? options.dbPort : "5432"}`,
    );
    const dbName = options.projectName.replace(/[\\/]/g, "-");
    envContent = envContent.replace(
      "# DB_DATABASE=laravel",
      `DB_DATABASE=${dbName}`,
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

  if (options.cachingTarget === "upstash") {
    envContent = envContent.replace("CACHE_STORE=database", "CACHE_STORE=redis");
    envContent = envContent.replace("SESSION_DRIVER=database", "SESSION_DRIVER=redis");
    envContent += "\n# Upstash Redis\nREDIS_CLIENT=predis\nREDIS_HOST=your-upstash-endpoint\nREDIS_PASSWORD=your-upstash-password\nREDIS_PORT=6379\n";
  } else if (options.cachingTarget === "docker") {
    envContent = envContent.replace("CACHE_STORE=database", "CACHE_STORE=redis");
    envContent = envContent.replace("SESSION_DRIVER=database", "SESSION_DRIVER=redis");
    envContent += "\nREDIS_CLIENT=predis";
    envContent = envContent.replace("REDIS_HOST=127.0.0.1", "REDIS_HOST=127.0.0.1");
    envContent = envContent.replace("REDIS_PORT=6379", `REDIS_PORT=${options.redisPort}`);
  }

  await writeFile(envPath, envContent);

  if (options.dbTarget === "docker" || options.cachingTarget === "docker") {
    console.log(`\n🐳 Generating docker-compose.yml...
  `);

    const dockerCompose = await resolveDockerCompose(
      options.projectName,
      dbPassword,
      options.dbTarget,
      options.cachingTarget,
      options.dbPort,
      options.redisPort
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

  const pkgPath = join(targetDir, "package.json");
  if (await Bun.file(pkgPath).exists()) {
    const pkg = await Bun.file(pkgPath).json();
    pkg.name = options.projectName.split("/").pop() || "backend";
    await Bun.write(pkgPath, JSON.stringify(pkg, null, 2));
  }
}
