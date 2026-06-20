# The Template Engine

`qwykz` avoids massive hardcoded strings in TypeScript files. Instead, all templates live as real files inside `templates/mvc/`.

This provides a few benefits:
- IDE syntax highlighting works for templates.
- Clear separation of concerns.
- Cleaner diffs in pull requests.

### Variable Injection

Templates use standard double-curly-brace syntax: `{{VARIABLE_NAME}}`.

When `generator.ts` calls `injectVariables()`, it passes a dictionary of keys. If a template contains a `{{PLACEHOLDER}}` missing from the dictionary, the engine throws an error immediately to prevent generating broken code.

### Compiled Mode vs Development Mode

Because `import.meta.url` behaves differently inside a compiled Bun binary, `template-engine.ts` detects the environment:
- **Dev Mode**: Uses `Bun.file()` to read from the filesystem.
- **Compiled Mode**: Reads from a pre-injected dictionary mapping file paths to their string contents.

When you run `bun run build:bin`, a script (`scripts/build-bin.ts`) walks the `templates/` directory, serializes every file into a massive JSON object, injects it into `template-engine.ts`, and *then* compiles the binary.
