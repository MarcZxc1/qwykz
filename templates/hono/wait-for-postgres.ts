const childProcess = Bun.spawn({
  cmd: [
    "docker",
    "compose",
    "up",
    "-d",
    "--wait",
    "--wait-timeout",
    "120",
  ],
  stdout: "inherit",
  stderr: "inherit",
  stdin: "inherit",
});

const exitCode = await childProcess.exited;
if (exitCode !== 0) {
  throw new Error("Docker Compose did not report a healthy Postgres service.");
}
