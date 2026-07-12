import { spinner } from "@clack/prompts";
import pc from "picocolors";
import { join } from "node:path";
import { mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { generateProject } from "./generator";
import {
  promptForAutomaticSetup,
  promptForProjectOptions,
  showSuccess,
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
    suggestions.push("    • Ensure Docker Desktop is running");
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

export async function runCommand(command: string[], cwd: string, ignoreFailure = false) {
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
    if (exitCode !== 0) {
      const [stdoutText, stderrText] = await Promise.all([stdout, stderr]);
      throw new Error(formatCommandFailure(command, exitCode, `${stderrText}\n${stdoutText}`));
    }

    await Promise.all([stdout, stderr]);
  } catch (error) {
    if (ignoreFailure) {
      console.error(pc.yellow(`  ⚠️  Warning: Could not execute "${command.join(" ")}". Skipping...`));
      if (error instanceof Error) console.error(pc.dim(error.message));
      console.error("");
      return false;
    }

    throw error;
  }
  return true;
}

async function runSetupCommands(
  options: Awaited<ReturnType<typeof promptForProjectOptions>>,
  s: any
) {
  const targetDir = join(process.cwd(), options.projectName);

  if (options.framework === "express" || options.framework === "nextjs" || options.framework === "hono" || options.framework === "elysia") {
    s.message("📦 Installing NPM dependencies...");
    await runCommand(["bun", "install"], targetDir);

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
    
    if (["express", "hono", "elysia"].includes(options.backendFramework as string)) {
      if (options.dbTarget === "docker" || options.cachingTarget === "docker") {
        s.message("🐳 Booting up Backend Docker containers...");
        try {
          await runCommand(["docker", "compose", "up", "-d", "--wait", "--wait-timeout", "120"], backendDir);
        } catch (e) {}
      }
      s.message("◓ Generating Prisma Client...");
      await runCommand(["bun", "run", "db:generate"], backendDir);
      s.message("🚀 Pushing database schema...");
      await runCommand(["bun", "run", "db:push"], backendDir);
    } else if (options.backendFramework === "laravel") {
      if (options.dbTarget === "docker" || options.cachingTarget === "docker") {
        s.message("🐳 Booting up Backend Docker containers...");
        try {
          await runCommand(["docker", "compose", "up", "-d", "--wait", "--wait-timeout", "120"], backendDir);
        } catch (e) {}
      }
      s.message("🔑 Generating Laravel app key...");
      await runCommand(["php", "artisan", "key:generate", "--force", "-n"], backendDir, true);
      s.message("🚀 Running database migrations...");
      await runCommand(["php", "artisan", "migrate", "--force", "-n"], backendDir, true);
    } else if (options.backendFramework === "python") {
      if (options.dbTarget === "docker" || options.cachingTarget === "docker") {
        s.message("🐳 Booting up Backend Docker containers...");
        try {
          await runCommand(["docker", "compose", "up", "-d", "--wait", "--wait-timeout", "120"], backendDir);
        } catch (e) {}
      }
      if (options.dbTarget === "local") {
        s.message("📦 Creating local PostgreSQL database...");
        await runCommand(["createdb", "-U", "postgres", options.projectName.replace(/\//g, "-")], backendDir, true);
      }
      s.message("📦 Creating Python virtual environment...");
      await runCommand(["python3", "-m", "venv", "venv"], backendDir);
      s.message("📦 Installing Python dependencies...");
      const pipCmd = process.platform === "win32" ? "venv\\\\Scripts\\\\pip" : "venv/bin/pip";
      await runCommand([pipCmd, "install", "-r", "requirements.txt"], backendDir);
    } else if (options.backendFramework === "go") {
      if (options.dbTarget === "docker" || options.cachingTarget === "docker") {
        s.message("🐳 Booting up Backend Docker containers...");
        try {
          await runCommand(["docker", "compose", "up", "-d", "--wait", "--wait-timeout", "120"], backendDir);
        } catch (e) {}
      }
      s.message("📦 Installing Go modules...");
      await runCommand(["go", "mod", "tidy"], backendDir);
    } else if (options.backendFramework === "rust") {
      if (options.dbTarget === "docker" || options.cachingTarget === "docker") {
        s.message("🐳 Booting up Backend Docker containers...");
        try {
          await runCommand(["docker", "compose", "up", "-d", "--wait", "--wait-timeout", "120"], backendDir);
        } catch (e) {}
      }
      s.message("🚀 Running database migrations (sqlx)...");
      await runCommand(["cargo", "sqlx", "migrate", "run"], backendDir, true);
    }
  } else if (options.framework === "laravel") {
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
          `    • Ensure Docker Desktop is running\n` +
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
      try {
        await runCommand(["docker", "compose", "up", "-d", "--wait"], targetDir);
      } catch (e) {}
    }
    if (options.dbTarget === "local") {
      s.message("📦 Creating local PostgreSQL database...");
      await runCommand(["createdb", "-U", "postgres", options.projectName.replace(/\//g, "-")], targetDir, true);
    }
    s.message("📦 Creating Python virtual environment...");
    await runCommand(["python", "-m", "venv", "venv"], targetDir, true);
    s.message("📦 Installing Python dependencies...");
    const pipCmd = process.platform === "win32" ? "venv\\\\Scripts\\\\pip" : "venv/bin/pip";
    await runCommand([pipCmd, "install", "-r", "requirements.txt"], targetDir, true);
  } else if (options.framework === "go") {
    if (options.dbTarget === "docker" || options.cachingTarget === "docker") {
      s.message("🐳 Booting up Docker containers...");
      try {
        await runCommand(["docker", "compose", "up", "-d", "--wait"], targetDir);
      } catch (e) {}
    }
    if (options.dbTarget === "local") {
      s.message("📦 Creating local PostgreSQL database...");
      await runCommand(["createdb", "-U", "postgres", options.projectName.replace(/\//g, "-")], targetDir, true);
    }
    s.message("📦 Installing Go modules...");
    await runCommand(["go", "mod", "tidy"], targetDir, true);
  } else if (options.framework === "rust") {
    if (options.dbTarget === "docker" || options.cachingTarget === "docker") {
      s.message("🐳 Booting up Docker containers...");
      try {
        await runCommand(["docker", "compose", "up", "-d", "--wait"], targetDir);
      } catch (e) {}
    }
    s.message("📦 Setting up Database & Migrations (this may take a minute)...");
    await runCommand(["cargo", "install", "sqlx-cli"], targetDir, true);
    await runCommand(["sqlx", "database", "create"], targetDir, true);
    await runCommand(["sqlx", "migrate", "run"], targetDir, true);
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
  const options = await promptForProjectOptions();
  const s = spinner();

  s.start("Scaffolding qwykz architecture...");

  try {
    await generateProject(options);
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
        devCmd = process.platform === "win32" ? "venv\\\\Scripts\\\\fastapi dev app/main.py" : "venv/bin/fastapi dev app/main.py";
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
