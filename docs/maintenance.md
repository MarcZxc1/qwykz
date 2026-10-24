# Maintenance

Start with a clean inventory of local changes so maintenance preserves work already in progress:

```bash
git status --short
bun install --frozen-lockfile
bun outdated
bun audit
bun pm ls --all
```

Keep dependency updates focused. The CLI and generated applications have separate dependency sets: `package.json` controls qwykz itself, while `src/package-versions.ts`, framework generators, and language templates control generated projects. An audit of qwykz does not audit its generated applications.

For built-in npm templates, update exact direct versions deliberately. Keep coupled packages such as Prisma's CLI, client, config, and adapter aligned. Verify SDK or framework upgrades with the affected auth variants. Review installed package license metadata when adding dependencies or changing major versions.

Run the repository gates and generated application checks:

```bash
bunx tsc --noEmit
bun run validate:templates
bun run test
QWYKZ_RUN_GENERATED_BUILDS=1 bun test --timeout 600000 tests/generated-build.test.ts
```

The generated build suite audits resolved dependencies, typechecks application code (including Vue single-file components), builds production output, and verifies frozen installs. It does not validate live managed-provider credentials. Use the separate [runtime and managed-provider checks](testing.md) when those integrations change.

Check generated capability artifacts and inspect the npm package contents before publishing repository updates:

```bash
bun run capabilities:generate
git diff -- capability-matrix.json docs/capability-matrix.md
bun pm pack --dry-run
git diff --check
graphify update .
```

Run `bun run sync:web` after changing package metadata, presets, CLI flags, or capabilities. Verify `bun run check:upstream`, `bun run lint`, and `bun run build` in `../qwykz-web`. Commit the core changes before the final sync so the recorded upstream commit identifies the changes actually being reviewed.

Do not include caches, generated test projects, environment files, credentials, or local graph output in commits. Publishing an npm release is a separate step from pushing verified repository changes.

For standalone binary verification, `bun run build:bin` compiles the CLI and installs it at `~/.local/bin/qwykz`. Run that binary with `--dry-run` to verify its embedded templates.
