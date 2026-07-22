import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { runPluginCli } from "../src/plugins/cli";

describe("Plugin CLI", () => {
  it("exports runPluginCli", () => {
    expect(typeof runPluginCli).toBe("function");
  });
});
