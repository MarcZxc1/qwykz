import type { ProjectOptions } from "../types";
import type { CapabilityStatus, FrameworkCapabilities, CapabilityMatrix } from "./types";
import pkg from "../../package.json";

export const CAPABILITY_MATRIX: CapabilityMatrix = {
  version: "1.0.0",
  generatorVersion: pkg.version,
  matrix: {
    express: nodeCapabilities(),
    hono: nodeCapabilities(),
    elysia: nodeCapabilities(),
    nextjs: {
      dbTargets: statuses("supported", "supported", "supported", "unsupported"),
      authTargets: { local: "supported", supabase: "experimental", clerk: "experimental" },
      cachingTargets: { none: "supported", docker: "supported", upstash: "supported" },
      dockerfile: false,
    },
    react: frontendCapabilities(),
    vue: frontendCapabilities(),
    python: nativeCapabilities(),
    go: nativeCapabilities(),
    rust: nativeCapabilities(),
    laravel: {
      dbTargets: statuses("experimental", "experimental", "experimental", "unsupported"),
      authTargets: { local: "experimental", supabase: "unsupported", clerk: "unsupported" },
      cachingTargets: { none: "experimental", docker: "experimental", upstash: "experimental" },
      dockerfile: false,
    },
  },
};

function statuses(
  local: CapabilityStatus,
  docker: CapabilityStatus,
  supabase: CapabilityStatus,
  neon: CapabilityStatus,
): Record<string, CapabilityStatus> {
  return { local, docker, supabase, neon };
}

function nodeCapabilities(): FrameworkCapabilities {
  return {
    dbTargets: statuses("supported", "supported", "supported", "experimental"),
    authTargets: { local: "supported", supabase: "experimental", clerk: "experimental" },
    cachingTargets: { none: "supported", docker: "supported", upstash: "supported" },
    dockerfile: false,
    frontends: ["react", "vue"],
  };
}

function frontendCapabilities(): FrameworkCapabilities {
  return {
    // Database selection is not applicable to standalone SPAs, so it must not
    // make an otherwise valid frontend/auth selection unsupported.
    dbTargets: statuses("supported", "supported", "supported", "supported"),
    authTargets: { local: "experimental", supabase: "supported", clerk: "supported" },
    cachingTargets: { none: "supported", docker: "unsupported", upstash: "unsupported" },
    dockerfile: false,
  };
}

function nativeCapabilities(): FrameworkCapabilities {
  return {
    dbTargets: statuses("supported", "supported", "supported", "experimental"),
    authTargets: { local: "supported", supabase: "unsupported", clerk: "unsupported" },
    cachingTargets: { none: "supported", docker: "supported", upstash: "unsupported" },
    dockerfile: true,
    frontends: ["react", "vue"],
  };
}

const STATUS_RANK: Record<CapabilityStatus, number> = {
  supported: 0,
  experimental: 1,
  planned: 2,
  unsupported: 3,
};

function combineStatuses(statusesToCombine: Array<CapabilityStatus | undefined>): CapabilityStatus {
  if (statusesToCombine.some((status) => status === undefined)) return "unsupported";
  return statusesToCombine.reduce<CapabilityStatus>((worst, status) =>
    STATUS_RANK[status!] > STATUS_RANK[worst] ? status! : worst,
  "supported");
}

export function getCapability(
  framework: string,
  db: string,
  auth: string,
  cache: string,
): CapabilityStatus {
  const capabilities = CAPABILITY_MATRIX.matrix[framework];
  if (!capabilities) return "unsupported";
  return combineStatuses([
    capabilities.dbTargets[db],
    capabilities.authTargets[auth],
    capabilities.cachingTargets[cache],
  ]);
}

export function getProjectCapability(options: ProjectOptions): CapabilityStatus {
  if (options.framework !== "monorepo") {
    return getCapability(
      options.framework,
      options.dbTarget,
      options.authTarget,
      options.cachingTarget,
    );
  }

  if (!options.backendFramework || !options.frontendFramework) return "unsupported";
  const backendStatus = getCapability(
    options.backendFramework,
    options.dbTarget,
    options.authTarget,
    options.cachingTarget,
  );
  // Local auth is supplied by the generated backend in a monorepo. Managed
  // providers must also be supported by the selected frontend.
  if (options.authTarget === "local") return backendStatus;
  const frontendStatus = getCapability(
    options.frontendFramework,
    options.dbTarget,
    options.authTarget,
    "none",
  );
  return combineStatuses([backendStatus, frontendStatus]);
}

export function isSupported(framework: string, db: string, auth: string, cache: string): boolean {
  return getCapability(framework, db, auth, cache) === "supported";
}

export function getFrameworkCapabilities(framework: string): FrameworkCapabilities | undefined {
  return CAPABILITY_MATRIX.matrix[framework];
}
