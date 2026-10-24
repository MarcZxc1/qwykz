# Dependency Resolution

Built-in Node, Next.js, React, Vue, and monorepo scaffolds use exact direct npm dependency versions bundled with the qwykz release. Generating these projects does not query npm or read a local version cache. The same qwykz release and options produce the same package declarations online and offline.

Shared versions live in `src/package-versions.ts`; framework-specific packages are declared in their generators. Missing shared versions fail explicitly instead of falling back to `latest`. Version updates are deliberate source changes, checked by generated application installs, typechecks, and builds in CI.

`--strict` prints the dependency audit and its reasons. Exact versions apply with or without this flag.

Exact direct dependencies do not lock their transitive dependencies. Run `bun install`, commit the generated `bun.lock`, and use `bun install --frozen-lockfile` in the generated project's CI to preserve the resolved dependency graph.

Laravel still bootstraps through Composer and retains upstream npm declarations. Plugins retain their authors' package specifications. Go, Rust, and Python retain the version constraints in their own templates. Those ecosystems are not covered by the built-in npm pinning guarantee.

Generated secrets and timestamps intentionally change between scaffold runs. A dry run previews its own completed plan; a separate generation creates a new plan and new secrets.
