#!/usr/bin/env bun
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { execSync } from "node:child_process";

const WEB_DIR = resolve(process.cwd(), "../qwykz-web");

function run() {
  console.log("\x1b[1m\x1b[36m⚡ Syncing Qwykz Core Engine -> Qwykz Web Showcase\x1b[0m");

  if (!existsSync(WEB_DIR)) {
    console.warn("\x1b[33m▲ Qwykz web directory not found at " + WEB_DIR + "\x1b[0m");
    return;
  }

  try {
    const isCheckOnly = process.argv.includes("--check");
    const flag = isCheckOnly ? "--check" : "--sync";
    const output = execSync("bun scripts/sync-qwykz.ts " + flag, {
      cwd: WEB_DIR,
      encoding: "utf8",
      stdio: "inherit",
    });
  } catch (err: any) {
    console.error("\x1b[31m✖ Failed to sync with qwykz-web\x1b[0m", err.message);
    process.exit(1);
  }
}

run();
