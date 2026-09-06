import type { ProjectOptions } from "../types";

export interface MethodReference {
  name: string;
  signature?: string;
  purpose: string;
  exampleSnippet?: string;
}

export interface FrameworkLearnProfile {
  name: string;
  category: "node" | "native" | "web" | "fullstack" | "monorepo";
  entryPoint: string;
  bootstrapExplanation: string;
  keyFiles: Array<{ path: string; role: string }>;
  requestFlowAscii: string;
  frameworkMethods: MethodReference[];
  ormMethods?: MethodReference[];
  authMethods?: MethodReference[];
  extensionGuide: {
    addRoute: string;
    addModel: string;
    protectRoute: string;
  };
  milestones: LearnMilestone[];
}

export interface LearnMilestone {
  number: number;
  title: string;
  goal: string;
  concept: string;
  bestPractice: string;
  keyMethods: MethodReference[];
  verificationCommand: string;
}
