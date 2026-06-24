import { spinner } from "@clack/prompts";
import pc from "picocolors";
import { join } from "node:path";
import { generateProject } from "./generator";
import {
  promptForAutomaticSetup,
  promptForProjectOptions,
  showSuccess,
} from "./prompts";

/** Check if --verbose flag is present in process.argv */
const isVerbose = process.argv.includes("--verbose");

async function runCommand(command: string[], cwd: string) {
  try {
    const proc = Bun.spawn({
      cmd: ["bash", "-c", command.join(" ")],
      cwd,
      stdout: isVerbose ? "inherit" : "ignore",
      stderr: isVerbose ? "inherit" : "pipe",
      stdin: "inherit",
    });

    const exitCode = await proc.exited;
    if (exitCode !== 0) {
      // If not verbose, read stderr for error details
      let errorDetails = "";
      if (!isVerbose && proc.stderr && typeof proc.stderr !== "number") {
        errorDetails = await new Response(proc.stderr).text();
      }
      throw new Error(
        `Command "${command.join(" ")}" exited with code ${exitCode}` +
          (errorDetails ? `\n${errorDetails}` : ""),
      );
    }
  } catch (error) {
    const cmdStr = command.join(" ");

    console.error("");
    console.error(pc.red(pc.bold("✖ Command failed: ")) + pc.dim(cmdStr));
    console.error("");

    if (error instanceof Error && error.message) {
      console.error(pc.yellow("  Reason: ") + error.message.split("\n")[0]);
    }

    console.error("");
    console.error(pc.cyan("  Suggestions:"));
    console.error(pc.dim("    • Check your internet connection"));
    console.error(
      pc.dim("    • Ensure Bun is installed and up-to-date (https://bun.sh)"),
    );

    if (cmdStr.includes("docker")) {
      console.error(pc.dim("    • Ensure Docker Desktop is running"));
    }
    if (cmdStr.includes("prisma")) {
      console.error(
        pc.dim("    • Ensure your DATABASE_URL is correct in .env"),
      );
    }

    console.error(pc.dim("    • Re-run with --verbose for full output"));
    console.error("");

    process.exit(1);
  }
}

async function runSetupCommands(
  options: Awaited<ReturnType<typeof promptForProjectOptions>>,
  s: any
) {
  const targetDir = join(process.cwd(), options.projectName);

  if (options.framework === "express" || options.framework === "nextjs") {
    s.message("📦 Installing NPM dependencies...");
    await runCommand(["bun", "install"], targetDir);

    if (options.dbTarget === "docker") {
      s.message("🐳 Booting up PostgreSQL container...");
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
  } else if (options.framework === "laravel") {
    if (options.dbTarget === "docker") {
      s.message("🐳 Booting up PostgreSQL container...");
      await runCommand(
        ["docker", "compose", "up", "-d", "--wait", "--wait-timeout", "120"],
        targetDir,
      );
    }

    s.message("🔑 Generating Laravel app key...");
    await runCommand(["php", "artisan", "key:generate", "--force", "-n"], targetDir);
    s.message("🚀 Running database migrations...");
    await runCommand(["php", "artisan", "migrate", "--force", "-n"], targetDir);
  } else if (options.framework === "react" || options.framework === "vue") {
    s.message("📦 Installing NPM dependencies...");
    await runCommand(["bun", "install"], targetDir);
  }
}

export async function runCli() {
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

      const devCmd =
        options.framework === "laravel" ? "php artisan serve" : "bun dev";

      const proc = Bun.spawn(["bash", "-c", devCmd], {
        cwd: join(process.cwd(), options.projectName),
        stdio: ["inherit", "inherit", "inherit"],
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
