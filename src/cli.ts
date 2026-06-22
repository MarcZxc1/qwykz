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
) {
  const targetDir = join(process.cwd(), options.projectName);

  if (options.framework === "express") {
    await runCommand(["bun", "install"], targetDir);

    if (options.dbTarget === "docker") {
      await runCommand(
        ["docker", "compose", "up", "-d", "--wait", "--wait-timeout", "120"],
        targetDir,
      );
    }

    await runCommand(["bun", "run", "db:generate"], targetDir);
    await runCommand(["bun", "run", "db:push"], targetDir);
  } else if (options.framework === "laravel") {
    await runCommand(["php", "artisan", "migrate"], targetDir);
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
      s.start("Running setup commands...");
      await runSetupCommands(options);
      s.stop("Setup commands completed.");
      showSuccess(options, true);
      if (options.dbTarget === "docker") {
        console.log(pc.green("\n🚀 Starting development server..."));
        if (options.framework === "express") {
          const proc = Bun.spawn(["bash", "-c", "bun dev"], {
            cwd: join(process.cwd(), options.projectName),
            stdio: ["inherit", "inherit", "inherit"],
          });
          process.on("SIGINT", () => proc.kill());
          process.on("SIGTERM", () => proc.kill());
          await proc.exited;
        } else if (options.framework === "laravel") {
          const proc = Bun.spawn(["bash", "-c", "php artisan serve"], {
            cwd: join(process.cwd(), options.projectName),
            stdio: ["inherit", "inherit", "inherit"],
          });
          process.on("SIGINT", () => proc.kill());
          process.on("SIGTERM", () => proc.kill());
          await proc.exited;
        }
      }
      process.exit(0);
    }

    showSuccess(options, false);
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
