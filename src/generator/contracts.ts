import type { ProjectOptions } from "../types";

export type FrameworkGenerator = (options: ProjectOptions, rootDir: string) => Promise<void>;
