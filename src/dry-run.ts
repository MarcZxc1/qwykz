/**
 * Dry-run renderer — shows what qwykz WOULD do without writing anything to disk.
 * Renders a directory tree, package diff, and file content preview.
 */
import pc from "picocolors";
import type { ScaffoldPlan, PackageAudit } from "./types";
import { buildManifest, serializeManifest } from "./manifest";

// ---------------------------------------------------------------------------
// Directory tree renderer
// ---------------------------------------------------------------------------

function buildTree(paths: string[]): string {
  // Sort paths so directories appear before their children
  const sorted = [...paths].sort();

  // Build a nested structure
  const root: Record<string, unknown> = {};
  for (const p of sorted) {
    const parts = p.split("/");
    let node: Record<string, unknown> = root;
    for (const part of parts) {
      if (!(part in node)) {
        node[part] = {};
      }
      node = node[part] as Record<string, unknown>;
    }
  }

  function renderNode(
    node: Record<string, unknown>,
    prefix: string,
    name: string,
    isLast: boolean,
    isRoot: boolean,
  ): string {
    const connector = isRoot ? "" : isLast ? "└── " : "├── ";
    const children = Object.keys(node).sort();
    const isDir = children.length > 0;
    const line = isRoot
      ? `${name}/`
      : `${prefix}${connector}${name}${isDir ? "/" : ""}`;

    const childPrefix = isRoot ? "" : prefix + (isLast ? "    " : "│   ");
    const childLines = children.map((child, i) =>
      renderNode(
        node[child] as Record<string, unknown>,
        childPrefix,
        child,
        i === children.length - 1,
        false,
      ),
    );

    return [line, ...childLines].join("\n");
  }

  const topKeys = Object.keys(root).sort();
  return topKeys
    .map((k, i) =>
      renderNode(
        root[k] as Record<string, unknown>,
        "",
        k,
        i === topKeys.length - 1,
        false,
      ),
    )
    .join("\n");
}

// ---------------------------------------------------------------------------
// Package audit renderer
// ---------------------------------------------------------------------------

export function renderPackageAudit(audit: PackageAudit[]): string {
  const deps = audit.filter((a) => !a.isDev);
  const devDeps = audit.filter((a) => a.isDev);

  const rows = (entries: PackageAudit[], header: string): string => {
    if (entries.length === 0) return "";
    const maxName = Math.max(...entries.map((e) => e.name.length), 7);
    const maxVer = Math.max(...entries.map((e) => e.version.length), 7);
    const maxCat = Math.max(...entries.map((e) => e.category.length), 8);

    const line = `  ${"-".repeat(maxName + maxVer + maxCat + 11)}`;
    const head = `  ${"Package".padEnd(maxName)}  ${"Version".padEnd(maxVer)}  ${"Category".padEnd(maxCat)}  Reason`;

    const body = entries
      .map(
        (e) =>
          `  ${e.name.padEnd(maxName)}  ${e.version.padEnd(maxVer)}  ${e.category.padEnd(maxCat)}  ${pc.dim(e.reason)}`,
      )
      .join("\n");

    return `\n${pc.bold(header)}\n${line}\n${pc.dim(head)}\n${line}\n${body}\n${line}`;
  };

  return rows(deps, "dependencies") + rows(devDeps, "devDependencies");
}

// ---------------------------------------------------------------------------
// File diff renderer (all additions for new projects)
// ---------------------------------------------------------------------------

function redactSensitiveContent(content: string): string {
  return content
    .split("\n")
    .map((line) => {
      const assignment = line.match(/^(\s*)((?:DATABASE|DIRECT|REDIS)_URL|[A-Z][A-Z0-9_]*(?:SECRET|PASSWORD|TOKEN|PRIVATE_KEY)[A-Z0-9_]*)(\s*[:=]).*$/);
      if (assignment) return `${assignment[1]}${assignment[2]}${assignment[3]}<redacted>`;
      if (/POSTGRES_PASSWORD\s*:/.test(line)) {
        return line.replace(/(POSTGRES_PASSWORD\s*:\s*).+$/, "$1<redacted>");
      }
      return line;
    })
    .join("\n");
}

function renderFileDiff(path: string, content: string): string {
  const lines = redactSensitiveContent(content).split("\n");
  // Only show first 20 lines to keep output manageable
  const preview = lines.slice(0, 20);
  const truncated = lines.length > 20;

  const diffLines = preview
    .map((l) => pc.green(`+ ${l}`))
    .join("\n");

  return (
    `\n${pc.bold(pc.cyan(`  ┌─ ${path}`))}` +
    `\n${diffLines}` +
    (truncated
      ? `\n${pc.dim(`  ... (${lines.length - 20} more lines)`)}`
      : "") +
    `\n${pc.dim("  └─ end")}`
  );
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface DryRunOptions {
  /** Show full file diffs. Default: show tree + packages only. */
  showFileDiff?: boolean;
  /** Max files to show diffs for. Default: 5. */
  maxFileDiff?: number;
}

/**
 * Render a human-readable dry-run preview of what would be generated.
 * Nothing is written to disk.
 */
export function renderDryRun(
  plan: ScaffoldPlan,
  opts: DryRunOptions = {},
): void {
  const { showFileDiff = false, maxFileDiff = 5 } = opts;

  console.log();
  console.log(
    pc.bold(
      pc.magenta(
        "  ╔══════════════════════════════════════════════════════╗",
      ),
    ),
  );
  console.log(
    pc.bold(
      pc.magenta(
        "  ║           qwykz  —  DRY RUN PREVIEW                 ║",
      ),
    ),
  );
  console.log(
    pc.bold(
      pc.magenta(
        "  ╚══════════════════════════════════════════════════════╝",
      ),
    ),
  );
  console.log();
  console.log(
    pc.dim("  Nothing will be written to disk. This is a preview only."),
  );
  console.log();

  // ── Target directory ──────────────────────────────────────────────────────
  console.log(pc.bold("  📁 Project Directory"));
  console.log(`  ./${plan.projectName}/`);
  console.log();

  // ── Directory tree ────────────────────────────────────────────────────────
  console.log(pc.bold("  🌳 Files That Would Be Created"));
  const filePaths = plan.files.map((f) => f.path);
  const tree = buildTree(filePaths);
  for (const line of tree.split("\n")) {
    console.log(`  ${line}`);
  }
  console.log();

  // ── Stack summary ─────────────────────────────────────────────────────────
  const { options } = plan;
  console.log(pc.bold("  ⚙️  Selected Stack"));
  console.log(`  Framework   : ${pc.cyan(options.framework)}`);
  console.log(`  Database    : ${pc.cyan(options.dbTarget)}`);
  console.log(`  Auth        : ${pc.cyan(options.authTarget)}`);
  console.log(`  Caching     : ${pc.cyan(options.cachingTarget)}`);
  if (options.frontendFramework)
    console.log(`  Frontend    : ${pc.cyan(options.frontendFramework)}`);
  if (options.backendFramework)
    console.log(`  Backend     : ${pc.cyan(options.backendFramework)}`);
  if (options.extraPackages.length > 0)
    console.log(`  Extras      : ${pc.cyan(options.extraPackages.join(", "))}`);
  console.log();

  // ── Package audit ─────────────────────────────────────────────────────────
  if (plan.packageAudit.length > 0) {
    console.log(pc.bold("  📦 Packages That Would Be Added"));
    console.log(renderPackageAudit(plan.packageAudit));
    console.log();
  }

  // ── Manifest preview ──────────────────────────────────────────────────────
  console.log(pc.bold("  📋 Scaffold Manifest (.qwykz-manifest.json)"));
  const manifest = buildManifest(plan);
  const manifestJson = serializeManifest(manifest);
  for (const line of manifestJson.split("\n").slice(0, 20)) {
    console.log(pc.dim(`  ${line}`));
  }
  console.log();

  // ── File diffs ────────────────────────────────────────────────────────────
  if (showFileDiff && plan.files.length > 0) {
    console.log(pc.bold("  📄 File Diffs"));
    const toShow = plan.files.slice(0, maxFileDiff);
    for (const file of toShow) {
      console.log(renderFileDiff(file.path, file.content));
    }
    if (plan.files.length > maxFileDiff) {
      console.log(
        pc.dim(
          `  ... and ${plan.files.length - maxFileDiff} more files (use --show-diff to see all)`,
        ),
      );
    }
    console.log();
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  console.log(
    pc.bold(
      pc.green(
        `  ✅ Dry run complete — ${plan.files.length} files, ${plan.packageAudit.filter((a) => !a.isDev).length} deps, ${plan.packageAudit.filter((a) => a.isDev).length} devDeps would be added.`,
      ),
    ),
  );
  console.log(
    pc.dim(
      "  Remove --dry-run to scaffold for real.",
    ),
  );
  console.log();
}
