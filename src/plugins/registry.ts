import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { discoverPluginDirectories, getPluginSearchPaths } from "./discovery";
import { validateManifest } from "./validate-manifest";
import type {
  LoadedPlugin,
  PluginManifest,
  PluginFrameworkCapability,
  PluginAuthProviderCapability,
  PluginDeploymentTargetCapability
} from "./types";

class PluginRegistry {
  private plugins: LoadedPlugin[] = [];
  private hasLoaded = false;

  /**
   * Loads all discovered plugins and validates their manifests.
   */
  public async loadPlugins(overrideDir?: string): Promise<void> {
    if (this.hasLoaded && !overrideDir) return;

    this.plugins = [];
    const searchPaths = getPluginSearchPaths(overrideDir);
    const discovered = discoverPluginDirectories(searchPaths);

    for (const { dir, source } of discovered) {
      const manifestPath = join(dir, "plugin.json");
      try {
        const content = readFileSync(manifestPath, "utf-8");
        const manifest = JSON.parse(content) as PluginManifest;

        validateManifest(dir, manifest);

        const registeredNames = new Set(this.plugins.flatMap((plugin) => [
          ...plugin.manifest.capabilities.frameworks.map((item) => `framework:${item.name}`),
          ...plugin.manifest.capabilities.authProviders.map((item) => `auth:${item.name}`),
          ...plugin.manifest.capabilities.deploymentTargets.map((item) => `deployment:${item.name}`),
        ]));
        const incomingNames = [
          ...manifest.capabilities.frameworks.map((item) => `framework:${item.name}`),
          ...manifest.capabilities.authProviders.map((item) => `auth:${item.name}`),
          ...manifest.capabilities.deploymentTargets.map((item) => `deployment:${item.name}`),
        ];
        const duplicate = incomingNames.find((name) => registeredNames.has(name));
        if (duplicate) throw new Error(`Duplicate plugin capability ${duplicate}`);

        this.plugins.push({
          pluginDir: dir,
          manifest,
          source
        });
      } catch (e: any) {
        console.warn(`Skipping invalid qwykz plugin at ${dir}: ${e.message}`);
      }
    }

    this.hasLoaded = true;
  }

  public getPlugins(): LoadedPlugin[] {
    return this.plugins;
  }

  public getFrameworks(): Array<{ plugin: LoadedPlugin, capability: PluginFrameworkCapability }> {
    const frameworks: Array<{ plugin: LoadedPlugin, capability: PluginFrameworkCapability }> = [];
    for (const plugin of this.plugins) {
      for (const fw of plugin.manifest.capabilities?.frameworks || []) {
        frameworks.push({ plugin, capability: fw });
      }
    }
    return frameworks;
  }

  public getAuthProviders(): Array<{ plugin: LoadedPlugin, capability: PluginAuthProviderCapability }> {
    const providers: Array<{ plugin: LoadedPlugin, capability: PluginAuthProviderCapability }> = [];
    for (const plugin of this.plugins) {
      for (const ap of plugin.manifest.capabilities?.authProviders || []) {
        providers.push({ plugin, capability: ap });
      }
    }
    return providers;
  }

  public getDeploymentTargets(): Array<{ plugin: LoadedPlugin, capability: PluginDeploymentTargetCapability }> {
    const targets: Array<{ plugin: LoadedPlugin, capability: PluginDeploymentTargetCapability }> = [];
    for (const plugin of this.plugins) {
      for (const dt of plugin.manifest.capabilities?.deploymentTargets || []) {
        targets.push({ plugin, capability: dt });
      }
    }
    return targets;
  }

  public getPluginForFramework(frameworkName: string): LoadedPlugin | undefined {
    return this.plugins.find(p =>
      p.manifest.capabilities?.frameworks?.some(fw => fw.name === frameworkName)
    );
  }

  public getAuthProvider(authName: string): { plugin: LoadedPlugin, capability: PluginAuthProviderCapability } | undefined {
    return this.getAuthProviders().find(({ capability }) => capability.name === authName);
  }

  public getDeploymentTarget(targetName?: string): { plugin: LoadedPlugin, capability: PluginDeploymentTargetCapability } | undefined {
    if (!targetName) return undefined;
    return this.getDeploymentTargets().find(({ capability }) => capability.name === targetName);
  }

  public getActivePlugins(options: {
    framework: string;
    authTarget: string;
    deploymentTarget?: string;
  }): LoadedPlugin[] {
    const active = [
      this.getPluginForFramework(options.framework),
      this.getAuthProvider(options.authTarget)?.plugin,
      this.getDeploymentTarget(options.deploymentTarget)?.plugin,
    ].filter((plugin): plugin is LoadedPlugin => Boolean(plugin));
    return [...new Map(active.map((plugin) => [plugin.pluginDir, plugin])).values()];
  }

  public async executeValidationHook(plugin: LoadedPlugin, context: import("./types").PluginValidationContext): Promise<void> {
    if (!plugin.manifest.validation) return;
    const hookPath = join(plugin.pluginDir, plugin.manifest.validation);
    if (!existsSync(hookPath)) return;

    // We expect the validation hook to be a loadable module
    const module = await import(hookPath);
    if (typeof module.validate === "function") {
      await module.validate(context);
    }
  }

  public async executePostGenerateHook(plugin: LoadedPlugin, context: import("./types").PluginPostGenerateContext): Promise<void> {
    if (!plugin.manifest.postGenerate) return;
    const hookPath = join(plugin.pluginDir, plugin.manifest.postGenerate);
    if (!existsSync(hookPath)) return;

    // We expect the postGenerate hook to be a loadable module
    const module = await import(hookPath);
    if (typeof module.postGenerate === "function") {
      await module.postGenerate(context);
    }
  }
}

// Export a singleton instance
export const registry = new PluginRegistry();
