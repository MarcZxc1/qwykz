export type CapabilityStatus = "supported" | "experimental" | "planned" | "unsupported";

export interface FrameworkCapabilities {
  dbTargets: Record<string, CapabilityStatus>;
  authTargets: Record<string, CapabilityStatus>;
  cachingTargets: Record<string, CapabilityStatus>;
  dockerfile: boolean;
  frontends?: string[];
  backends?: string[];
}

export interface CapabilityMatrix {
  version: string;
  generatorVersion: string;
  matrix: Record<string, FrameworkCapabilities>;
}
