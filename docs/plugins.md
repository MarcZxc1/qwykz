# Plugin Authoring

qwykz plugins add framework templates, authentication overlays, or deployment files without editing the core generator.

## Directory contract

Every plugin directory contains a `plugin.json` and at least one non-empty template directory. Capability names use lowercase letters, numbers, and dashes. Template and hook paths must stay inside the plugin directory; qwykz rejects traversal and symlink escapes.

```text
qwykz-plugin-fastify/
├── plugin.json
├── templates/
│   └── fastify/
│       └── src/index.ts.stub
└── validate.ts             # optional
```

See [`examples/qwykz-plugin-fastify`](../examples/qwykz-plugin-fastify/) for a working reference.

## Template variables

Plugin text templates may use:

- `{{PROJECT_NAME}}`
- `{{DB_TARGET}}`
- `{{AUTH_TARGET}}`
- `{{CACHING_TARGET}}`
- `{{DB_PORT}}` and `{{REDIS_PORT}}`
- `{{JWT_SECRET}}` for generated server-side secrets
- `{{EXTRA_IMPORTS}}` and `{{EXTRA_MIDDLEWARE}}`

Files ending in `.stub` are written without that suffix. Missing uppercase variables fail generation; they are never left unresolved.

## Validate and use

```bash
qwykz plugin validate ./qwykz-plugin-fastify
qwykz --yes --name demo --framework fastify --plugins-dir ./plugins
```

`--plugins-dir` points to a directory containing one or more plugin directories. The generated scaffold manifest records only plugins used by that scaffold.

## Hooks

The optional `validation` module exports `validate(context)` and runs before generation. The optional `postGenerate` module exports `postGenerate(context)` and runs after the plan is written. Hooks execute trusted local code, so users should review third-party plugins before installing them.

## Authentication and deployment overlays

Auth-provider and deployment capabilities use template directories as overlays on the selected core/framework scaffold. Overlay paths are relative to the generated project root. A plugin can replace core files and merge its declared packages and scripts into a generated `package.json`.
