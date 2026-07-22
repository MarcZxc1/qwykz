import type { ProjectOptions } from "../types";

export type FrameworkGenerator = (options: ProjectOptions) => Promise<void>;
