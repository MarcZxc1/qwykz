import { describe, expect, test } from "bun:test";
import { readEmbeddedTemplate } from "../src/template-engine";

describe("compiled template lookup", () => {
  test("returns an intentionally empty embedded template", () => {
    expect(readEmbeddedTemplate({ "python/app/__init__.py": "" }, "python/app/__init__.py")).toBe("");
  });

  test("rejects a template that is not embedded", () => {
    expect(() => readEmbeddedTemplate({}, "python/app/__init__.py")).toThrow(
      'Template file not found: "python/app/__init__.py"',
    );
  });
});
