import { spinner } from "@clack/prompts";
import { join } from "node:path";
import { generateProject } from "./generator";
import {
  promptForAutomaticSetup,
  promptForProjectOptions,
  showSuccess,
} from "./prompts";

async function runCommand(command: string[], cwd: string) {
  const process = Bun.spawn({
    cmd: command,
    cwd,
    stdout: "inherit",
    stderr: "inherit",
    stdin: "inherit",
  });

  const exitCode = await process.exited;
  if (exitCode !== 0) {
    throw new Error(`Command failed: ${command.join(" ")}`);
  }
}

async function runSetupCommands(options: Awaited<ReturnType<typeof promptForProjectOptions>>) {
  const targetDir = join(process.cwd(), options.projectName);

  await runCommand(["bun", "install"], targetDir);

  if (options.dbTarget === "docker") {
    await runCommand(["docker", "compose", "up", "-d", "--wait", "--wait-timeout", "60"], targetDir);
  }

  await runCommand(["bun", "run", "db:generate"], targetDir);
  await runCommand(["bun", "run", "db:push"], targetDir);
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
      return;
    }

    showSuccess(options, false);
  } catch (error) {
    s.stop("Configuration failed.");
    console.error(error);
    process.exitCode = 1;
  }
}
