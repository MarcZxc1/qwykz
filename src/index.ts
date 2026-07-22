#!/usr/bin/env bun
import { runCli } from "./cli";
import { runPluginCli } from "./plugins/cli";

if (process.argv.length > 2 && process.argv[2] === "plugin") {
  await runPluginCli();
} else {
  await runCli();
}
