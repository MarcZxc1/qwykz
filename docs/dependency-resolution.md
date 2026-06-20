# Dependency Resolution

One of `qwykz`'s standout features is that it doesn't hardcode package versions into the templates, preventing generated projects from instantly suffering from outdated dependencies.

Instead, `src/npm-registry.ts` queries the public NPM registry at runtime to resolve the `latest` tag for every required package.

### The 3-Tier Fallback Strategy

Network calls can be slow or fail. To guarantee the CLI always works quickly:

1. **Network Lookup**: It fires off concurrent `fetch` requests to `https://registry.npmjs.org/[package]`, with a strict 5-second timeout.
2. **Local Cache**: If a request succeeds, it caches the result in `~/.cache/npm-versions.json`. If a request fails, it reads from this cache (which is considered fresh for 24 hours).
3. **Hardcoded Fallback**: If there is no cache, or the cache is corrupted, it falls back to a statically defined `package-versions.ts` file bundled with the CLI. This ensures `qwykz` works completely offline.
