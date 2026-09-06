# Docker Resource and Data Lifecycle

Generated Docker services use development-sized memory/CPU limits and bounded log files.

## PostgreSQL Volume Lifecycle

- PostgreSQL data is stored in a named volume so an ordinary `docker compose down` preserves the database across restarts.
- Redis is generated as an ephemeral, memory-bounded cache and does not create a data volume.

## Resetting Data

When a generated project is disposable, remove its containers and PostgreSQL volume from inside that project directory:

```bash
docker compose down -v
```

> [!WARNING]
> `-v` permanently deletes that project's local database volume. Omit it when data must survive.

## Managed Volume Inventory

qwykz-managed PostgreSQL volumes carry the `io.qwykz.managed=true` label so unused generator data can be inventoried and cleaned deliberately instead of using an unscoped system-wide prune:

```bash
# List all qwykz-managed volumes
docker volume ls --filter label=io.qwykz.managed=true

# Remove all qwykz-managed volumes
docker volume prune --filter label=io.qwykz.managed=true
```
