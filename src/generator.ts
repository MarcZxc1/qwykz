/**
 * Public generator facade.
 *
 * Implementations live under src/generator/ so existing imports remain stable.
 */
export {
  buildScaffoldPlan,
  generateProject,
  writePlan,
} from "./generator/scaffold-plan";
export { generateExpressProject } from "./generator/frameworks/node-api";
export { resolveFrontendApiUrl } from "./generator/shared/frontend";
