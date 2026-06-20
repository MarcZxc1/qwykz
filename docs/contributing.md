# Contributing Guide

First off, thank you for considering contributing to `qwykz`!

### Getting Started

1. Fork the repo.
2. Clone it locally.
3. Install dependencies: `bun install`
4. Make your changes!

### Testing Your Changes

We use `bun test` for our integration test suite.

```bash
bun test
```

This will run the test suite inside `tests/`. The suite spins up a temporary directory, runs the CLI via the `--yes` non-interactive flag, and asserts that all files are generated correctly.

### Adding a New Template Feature

1. Create or modify a `.ts` or `.prisma` file in `templates/mvc/`.
2. Use `{{VARIABLE_NAME}}` for anything dynamic.
3. If you added a new variable, update `src/generator.ts` to pass it to the `injectVariables` call.
4. If your feature requires new NPM packages, add them to `src/package-json.ts` and add hardcoded fallback versions to `src/package-versions.ts`.
5. Run `bun test` to ensure you didn't break anything!

### Submitting a PR

- Keep your PRs focused on a single feature or bug fix.
- Ensure `bun test` passes completely.
- If you're adding CLI flags, ensure they work in both interactive (`prompts.ts`) and non-interactive (`--yes`) modes.
