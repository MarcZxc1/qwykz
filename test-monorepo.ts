import { generateProject } from "./src/generator";
import type { ProjectOptions } from "./src/types";

async function main() {
  const options: ProjectOptions = {
    projectName: "test-monorepo",
    framework: "monorepo",
    frontendFramework: "react",
    backendFramework: "express",
    dbTarget: "supabase",
    authTarget: "supabase",
    cachingTarget: "none",
    extraPackages: ["zod", "helmet", "cors"],
  };

  console.log("Generating Monorepo...");
  await generateProject(options);
  console.log("Done generating! Checking directories...");
}

main().catch(console.error);
