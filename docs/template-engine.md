# The Template Engine

Templates live in framework directories such as `templates/express/`, `templates/react/`, and `templates/python/`. Framework generators under `src/generator/frameworks/` select files and apply the relevant overlays.

This provides a few benefits:
- IDE syntax highlighting works for templates.
- Clear separation of concerns.
- Cleaner diffs in pull requests.

### Variable Injection

Templates use standard double-curly-brace syntax: `{{VARIABLE_NAME}}`.

Resolvers call `injectVariables()` with a dictionary of keys. If a template contains a `{{PLACEHOLDER}}` missing from the dictionary, the engine throws an error immediately to prevent generating broken code. Empty string values are valid for optional sections.

### Compiled Mode vs Development Mode

Because `import.meta.url` behaves differently inside a compiled Bun binary, `template-engine.ts` detects the environment:
- **Dev Mode**: Uses `Bun.file()` to read from the filesystem.
- **Compiled Mode**: Reads from a pre-injected dictionary mapping file paths to their string contents.

When you run `bun run build:bin`, `scripts/build-bin.ts` walks `templates/`, serializes every file into a JSON map, injects it into `template-engine.ts`, and compiles the binary. The script restores the source file after compilation. Empty embedded template files are valid; missing entries produce an error.
