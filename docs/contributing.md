# Contributing Guide

Use Bun to develop and verify `qwykz`.

### Getting Started

1. Fork the repo.
2. Clone it locally.
3. Install dependencies: `bun install --frozen-lockfile`
4. Make your changes!

### Testing Your Changes

Run the same gates used for repository changes:

```bash
bunx tsc --noEmit
bun run validate:templates
bun run test
```

The core suite covers planning, CLI behavior, plugins, and generated files. Network-dependent generated builds and database-backed smoke tests are separate; see [Testing](testing.md).

### Adding a New Template Feature

1. Create or modify files in the relevant `templates/<framework>/` directory.
2. Use `{{VARIABLE_NAME}}` for anything dynamic.
3. If you added a variable, update its resolver under `src/generator/` to pass it to `injectVariables()`.
4. Declare npm packages in `src/package-json.ts` or the relevant framework generator. Add shared exact versions to `src/package-versions.ts`; keep scaffolding independent of registry lookups.
5. Write a regression test first, then run the gates above and the affected generated build cases.
6. Update the knowledge graph with `graphify update .`. Changes to the capability matrix, presets, package metadata, or CLI flags also require `bun run sync:web` and the website checks documented in `AGENTS.md`.

### Submitting a PR

- Keep your PRs focused on a single feature or bug fix.
- Ensure the typecheck, template validation, and core test suite pass.
- If you're adding CLI flags, ensure they work in both interactive (`prompts.ts`) and non-interactive (`--yes`) modes.

For dependency audits and packaging checks, follow [Maintenance](maintenance.md).
