import { spinner } from "@clack/prompts";
import pc from "picocolors";
import { join } from "node:path";
import { mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { buildScaffoldPlan, writePlan } from "./generator";
import { renderDryRun, renderPackageAudit } from "./dry-run";
import { getProjectCapability } from "./capability/matrix";
import {
  promptForAutomaticSetup,
  promptForProjectOptions,
  showSuccess,
  isDryRun,
  isShowDiff,
} from "./prompts";

/** Check if --verbose flag is present in process.argv */
const isVerbose = process.argv.includes("--verbose");

function outputFrom(stream: ReadableStream<Uint8Array> | number | null | undefined): Promise<string> {
  if (!stream || typeof stream === "number") return Promise.resolve("");
  return new Response(stream).text();
}

function formatCommandFailure(command: string[], exitCode: number, output: string) {
  const cmdStr = command.join(" ");
  const details = output.trim();
  const truncatedDetails = details.length > 16_000
    ? `…output truncated…\n${details.slice(-16_000)}`
    : details;

  const suggestions = [
    "  Suggestions:",
    "    • Re-run with --verbose to stream command output live",
  ];

  if (cmdStr.startsWith("bun ") || cmdStr.startsWith("bunx ")) {
    suggestions.push(
      "    • Check your internet connection and npm registry access",
      "    • Ensure Bun is installed and up-to-date (https://bun.sh)",
    );
  }
  if (cmdStr.includes("docker")) {
    suggestions.push(
      "    • Ensure the Docker daemon or Docker Desktop is running",
      "    • On Linux, restart Docker if the error mentions iptables, nftables, or DOCKER-FORWARD",
    );
  }
  if (cmdStr.startsWith("go ")) {
    suggestions.push("    • Ensure Go can reach the module proxy and checksum database");
    if (details.includes("checksum mismatch")) {
      suggestions.push("    • Clear the local Go module cache with: go clean -modcache");
    }
  }
  if (cmdStr.startsWith("psql ") || cmdStr.startsWith("createdb ")) {
    suggestions.push("    • Ensure local PostgreSQL is running and the postgres user can create databases");
  }
  if (cmdStr.includes("prisma")) {
    suggestions.push("    • Ensure your DATABASE_URL is correct in .env");
  }

  return [
    `Command "${cmdStr}" exited with code ${exitCode}`,
    ...(truncatedDetails ? ["", truncatedDetails] : []),
    "",
    ...suggestions,
  ].join("\n");
}

function projectDatabaseName(projectName: string) {
  return projectName.replace(/[\\/]/g, "-");
}

function sqlLiteral(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

async function ensureLocalPostgresDatabase(projectName: string, cwd: string) {
  const databaseName = projectDatabaseName(projectName);
  const exists = await runCommand([
    "psql",
    "-U",
    "postgres",
    "-d",
    "postgres",
    "-v",
    "ON_ERROR_STOP=1",
    "-tAc",
    `SELECT 1 FROM pg_database WHERE datname = ${sqlLiteral(databaseName)}`,
  ], cwd);
  if (exists.trim() !== "1") {
    await runCommand(["createdb", "-U", "postgres", databaseName], cwd);
  }
}

export async function runCommand(command: string[], cwd: string, ignoreFailure = false): Promise<string> {
  try {
    const proc = Bun.spawn({
      // Pass arguments directly instead of re-parsing them through a shell. This
      // preserves paths with spaces and avoids losing the child environment.
      cmd: command,
      cwd,
      stdout: isVerbose ? "inherit" : "pipe",
      stderr: isVerbose ? "inherit" : "pipe",
      stdin: "inherit",
      env: { ...process.env },
    });

    const stdout = outputFrom(proc.stdout);
    const stderr = outputFrom(proc.stderr);
    const exitCode = await proc.exited;
    const [stdoutText, stderrText] = await Promise.all([stdout, stderr]);
    if (exitCode !== 0) {
      throw new Error(formatCommandFailure(command, exitCode, `${stderrText}\n${stdoutText}`));
    }

    return `${stdoutText}\n${stderrText}`;
  } catch (error) {
    if (ignoreFailure) {
      console.error(pc.yellow(`  ⚠️  Warning: Could not execute "${command.join(" ")}". Skipping...`));
      if (error instanceof Error) console.error(pc.dim(error.message));
      console.error("");
      return "";
    }

    throw error;
  }
}

async function runSetupCommands(
  options: Awaited<ReturnType<typeof promptForProjectOptions>>,
  s: any
) {
  const targetDir = join(process.cwd(), options.projectName);

  if (options.framework === "express" || options.framework === "nextjs" || options.framework === "hono" || options.framework === "elysia") {
    s.message("📦 Installing NPM dependencies...");
    await runCommand(["bun", "install"], targetDir);

    if (options.dbTarget === "local") {
      s.message("📦 Ensuring local PostgreSQL database exists...");
      await ensureLocalPostgresDatabase(options.projectName, targetDir);
    }

    if (options.dbTarget === "docker" || options.cachingTarget === "docker") {
      s.message("🐳 Cleaning stale Docker volumes...");
      try {
        await runCommand(["docker", "compose", "down", "-v", "--remove-orphans"], targetDir);
      } catch (e) {}
      s.message("🐳 Booting up Docker containers...");
      await runCommand(
        ["docker", "compose", "up", "-d", "--wait", "--wait-timeout", "120"],
        targetDir,
      );
    }

    s.message("◓ Generating Prisma Client...");
    await runCommand(["bun", "run", "db:generate"], targetDir);
    s.message("🚀 Pushing database schema...");
    await runCommand(["bun", "run", "db:push"], targetDir);
    
    s.message("🧪 Running automated test suite...");
    await runCommand(["bun", "test"], targetDir);
  } else if (options.framework === "monorepo") {
    s.message("📦 Installing Monorepo NPM dependencies...");
    await runCommand(["bun", "install"], targetDir);
    const backendDir = join(targetDir, "backend");

    if (options.dbTarget === "local") {
      s.message("📦 Ensuring backend PostgreSQL database exists...");
      await ensureLocalPostgresDatabase(`${options.projectName}/backend`, backendDir);
    }
    
    if (["express", "hono", "elysia"].includes(options.backendFramework as string)) {
      if (options.dbTarget === "docker" || options.cachingTarget === "docker") {
        s.message("🐳 Booting up Backend Docker containers...");
        await runCommand(["docker", "compose", "up", "-d", "--wait", "--wait-timeout", "120"], backendDir);
      }
      s.message("◓ Generating Prisma Client...");
      await runCommand(["bun", "run", "db:generate"], backendDir);
      s.message("🚀 Pushing database schema...");
      await runCommand(["bun", "run", "db:push"], backendDir);
    } else if (options.backendFramework === "laravel") {
      s.message("📦 Installing Laravel Composer dependencies...");
      await runCommand(["composer", "install", "--no-interaction"], backendDir);
      if (options.dbTarget === "docker" || options.cachingTarget === "docker") {
        s.message("🐳 Booting up Backend Docker containers...");
        await runCommand(["docker", "compose", "up", "-d", "--wait", "--wait-timeout", "120"], backendDir);
      }
      s.message("🔑 Generating Laravel app key...");
      await runCommand(["php", "artisan", "key:generate", "--force", "-n"], backendDir, true);
      s.message("🚀 Running database migrations...");
      await runCommand(["php", "artisan", "migrate", "--force", "-n"], backendDir, true);
    } else if (options.backendFramework === "python") {
      if (options.dbTarget === "docker" || options.cachingTarget === "docker") {
        s.message("🐳 Booting up Backend Docker containers...");
        await runCommand(["docker", "compose", "up", "-d", "--wait", "--wait-timeout", "120"], backendDir);
      }
      s.message("📦 Creating Python virtual environment...");
      await runCommand(["python3", "-m", "venv", "venv"], backendDir);
      s.message("📦 Installing Python dependencies...");
      const pipCmd = process.platform === "win32" ? "venv\\\\Scripts\\\\pip" : "venv/bin/pip";
      await runCommand([pipCmd, "install", "-r", "requirements.txt"], backendDir);
    } else if (options.backendFramework === "go") {
      if (options.dbTarget === "docker" || options.cachingTarget === "docker") {
        s.message("🐳 Booting up Backend Docker containers...");
        await runCommand(["docker", "compose", "up", "-d", "--wait", "--wait-timeout", "120"], backendDir);
      }
      s.message("📦 Installing Go modules...");
      await runCommand(["go", "mod", "tidy"], backendDir);
    } else if (options.backendFramework === "rust") {
      if (options.dbTarget === "docker" || options.cachingTarget === "docker") {
        s.message("🐳 Booting up Backend Docker containers...");
        await runCommand(["docker", "compose", "up", "-d", "--wait", "--wait-timeout", "120"], backendDir);
      }
      s.message("🚀 Running database migrations (sqlx)...");
      await runCommand(["cargo", "sqlx", "migrate", "run"], backendDir);
    }
  } else if (options.framework === "laravel") {
    s.message("📦 Installing Laravel Composer dependencies...");
    await runCommand(["composer", "install", "--no-interaction"], targetDir);
    if (options.dbTarget === "local") {
      s.message("📦 Ensuring local PostgreSQL database exists...");
      await ensureLocalPostgresDatabase(options.projectName, targetDir);
    }

    if (options.dbTarget === "docker" || options.cachingTarget === "docker") {
      s.message("🐳 Cleaning stale Docker volumes...");
      try {
        await runCommand(["docker", "compose", "down", "-v", "--remove-orphans"], targetDir);
      } catch (e) {}
      s.message("🐳 Booting up Docker containers...");
      try {
        await runCommand(["docker", "compose", "up", "-d", "--wait", "--wait-timeout", "120"], targetDir);
      } catch (error) {
        throw new Error(
          `Command "docker compose up -d --wait" exited with code 1\n\n` +
          `  Suggestions:\n` +
          `    • Ensure the Docker daemon or Docker Desktop is running\n` +
          `    • On Linux, restart Docker if the error mentions iptables, nftables, or DOCKER-FORWARD\n` +
          `    • Check if ports 54320 or 63790 are already occupied by previous boilerplate containers!\n` +
          `    • Re-run with --verbose for full output`
        );
      }
    }

    s.message("🔑 Generating Laravel app key...");
    await runCommand(["php", "artisan", "key:generate", "--force", "-n"], targetDir, true);
    s.message("🚀 Running database migrations...");
    await runCommand(["php", "artisan", "migrate", "--force", "-n"], targetDir, true);
  } else if (options.framework === "react" || options.framework === "vue") {
    s.message("📦 Installing NPM dependencies...");
    await runCommand(["bun", "install"], targetDir);
  } else if (options.framework === "python") {
    if (options.dbTarget === "docker" || options.cachingTarget === "docker") {
      s.message("🐳 Booting up Docker containers...");
      await runCommand(["docker", "compose", "up", "-d", "--wait", "--wait-timeout", "120"], targetDir);
    }
    if (options.dbTarget === "local") {
      s.message("📦 Ensuring local PostgreSQL database exists...");
      await ensureLocalPostgresDatabase(options.projectName, targetDir);
    }
    s.message("📦 Creating Python virtual environment...");
    await runCommand(["python", "-m", "venv", "venv"], targetDir, true);
    s.message("📦 Installing Python dependencies...");
    const pipCmd = process.platform === "win32" ? "venv\\\\Scripts\\\\pip" : "venv/bin/pip";
    await runCommand([pipCmd, "install", "-r", "requirements.txt"], targetDir, true);
  } else if (options.framework === "go") {
    if (options.dbTarget === "docker" || options.cachingTarget === "docker") {
      s.message("🐳 Booting up Docker containers...");
      await runCommand(["docker", "compose", "up", "-d", "--wait", "--wait-timeout", "120"], targetDir);
    }
    if (options.dbTarget === "local") {
      s.message("📦 Ensuring local PostgreSQL database exists...");
      await ensureLocalPostgresDatabase(options.projectName, targetDir);
    }
    s.message("📦 Installing Go modules...");
    await runCommand(["go", "mod", "tidy"], targetDir);
  } else if (options.framework === "rust") {
    if (options.dbTarget === "docker" || options.cachingTarget === "docker") {
      s.message("🐳 Booting up Docker containers...");
      await runCommand(["docker", "compose", "up", "-d", "--wait", "--wait-timeout", "120"], targetDir);
    }
    s.message("📦 Setting up Database & Migrations (this may take a minute)...");
    await runCommand(["cargo", "install", "sqlx-cli"], targetDir, true);
    await runCommand(["sqlx", "database", "create"], targetDir, true);
    await runCommand(["sqlx", "migrate", "run"], targetDir);
  }
}

async function ensureBunTmpDir() {
  const bunTmpDir = process.env.BUN_TMPDIR || join(tmpdir(), "qwykz-bun-tmp");
  const bunInstallDir =
    process.env.BUN_INSTALL || join(tmpdir(), "qwykz-bun-install");
  process.env.BUN_TMPDIR = bunTmpDir;
  process.env.BUN_INSTALL = bunInstallDir;
  await mkdir(bunTmpDir, { recursive: true });
  await mkdir(bunInstallDir, { recursive: true });
}

export async function runCli() {
  await ensureBunTmpDir();

  // Load community plugins before prompting
  const { registry } = await import("./plugins/registry");
  const pluginsDirFlag = process.argv.find((arg) => arg.startsWith("--plugins-dir="));
  const pluginsDirIndex = process.argv.indexOf("--plugins-dir");
  const overridePluginsDir = pluginsDirFlag
    ? pluginsDirFlag.slice("--plugins-dir=".length)
    : pluginsDirIndex >= 0
      ? process.argv[pluginsDirIndex + 1]
      : undefined;
  await registry.loadPlugins(overridePluginsDir);

  const options = await promptForProjectOptions();

  const plugin = registry.getPluginForFramework(options.framework);
  const authPlugin = registry.getAuthProvider(options.authTarget);
  const deploymentPlugin = registry.getDeploymentTarget(options.deploymentTarget);
  const activePlugins = registry.getActivePlugins(options);
  try {
    if (options.deploymentTarget && !deploymentPlugin) {
      throw new Error(`Unknown deployment target: ${options.deploymentTarget}`);
    }
    if (!plugin && !authPlugin) {
      const capability = getProjectCapability(options);
      if (capability === "unsupported" || capability === "planned") {
        throw new Error(
          `Unsupported scaffold combination: ${options.framework} + ${options.dbTarget} DB + ${options.authTarget} auth + ${options.cachingTarget} cache`,
        );
      }
      if (capability === "experimental" && !options.experimental) {
        throw new Error(
          "This scaffold combination is experimental. Re-run with --experimental to acknowledge the risk.",
        );
      }
    }

    // ── Dry-run: show preview and exit without writing anything ─────────────
    if (isDryRun) {
      const plan = await buildScaffoldPlan(options);
      renderDryRun(plan, {
        showFileDiff: true,
        maxFileDiff: isShowDiff ? Number.POSITIVE_INFINITY : 5,
      });
      process.exit(0);
    }
  } catch (error) {
    if (isVerbose) console.error(error);
    else console.error(pc.red(pc.bold("✖ ")) + (error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }

  const s = spinner();

  s.start("Scaffolding qwykz architecture...");


  try {
    for (const activePlugin of activePlugins) {
      await registry.executeValidationHook(activePlugin, {
        framework: options.framework,
        dbTarget: options.dbTarget,
        authTarget: options.authTarget,
        cachingTarget: options.cachingTarget,
        projectName: options.projectName,
      });
    }

    const plan = await buildScaffoldPlan(options);
    if (options.strict) {
      console.log(pc.bold("\nPackage policy audit"));
      console.log(renderPackageAudit(plan.packageAudit));
    }
    await writePlan(plan);

    for (const activePlugin of activePlugins) {
      await registry.executePostGenerateHook(activePlugin, {
        framework: options.framework,
        dbTarget: options.dbTarget,
        authTarget: options.authTarget,
        cachingTarget: options.cachingTarget,
        projectName: options.projectName,
        outputDir: join(process.cwd(), options.projectName),
      });
    }

    s.stop("Infrastructure generation finished.");

    const shouldRunSetup = await promptForAutomaticSetup(options);
    if (shouldRunSetup) {
      s.start("Running background setup commands...");
      await runSetupCommands(options, s);
      s.stop("Setup commands completed.");
      showSuccess(options, true);
      console.log(pc.yellow("\n⭐ Please leave a star if you like this package: https://github.com/MarcZxc1/qwykz\n"));
      console.log(pc.green("\n🚀 Starting development server..."));

      let devCmd = "bun dev";
      if (options.framework === "laravel") devCmd = "php artisan serve";
      if (options.framework === "python") {
        devCmd = process.platform === "win32"
          ? "venv\\\\Scripts\\\\uvicorn app.main:app --reload"
          : "venv/bin/uvicorn app.main:app --reload";
      }
      if (options.framework === "go") devCmd = "go run cmd/api/main.go";
      if (options.framework === "rust") devCmd = "cargo run";
      if (options.framework === "monorepo") devCmd = "bun run dev";

      const proc = Bun.spawn(["bash", "-c", devCmd], {
        cwd: join(process.cwd(), options.projectName),
        stdio: ["inherit", "inherit", "inherit"],
        env: { ...process.env },
      });
      process.on("SIGINT", () => proc.kill());
      process.on("SIGTERM", () => proc.kill());
      await proc.exited;
      process.exit(0);
    }

    showSuccess(options, false);
    console.log(pc.yellow("\n⭐ Please leave a star if you like this package: https://github.com/MarcZxc1/qwykz\n"));
    process.exit(0);
  } catch (error) {
    s.stop(pc.red("Configuration failed."));

    if (isVerbose && error instanceof Error) {
      console.error(error);
    } else if (error instanceof Error) {
      console.error(pc.red(pc.bold("✖ ")) + error.message);
    }

    process.exit(1);
  }
}
