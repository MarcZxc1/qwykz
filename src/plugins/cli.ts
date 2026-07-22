import pc from "picocolors";
import { join, resolve } from "node:path";
import { existsSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { text, intro, outro, spinner, isCancel, cancel } from "@clack/prompts";
import { registry } from "./registry";
import { validateManifest } from "./validate-manifest";

export async function runPluginCli() {
  const subcommand = process.argv[3];

  if (!subcommand) {
    console.log(pc.red("Error: Missing subcommand."));
    console.log(`Usage: qwykz plugin <list|init|validate>`);
    process.exit(1);
  }

  switch (subcommand) {
    case "list":
      await listPlugins();
      break;
    case "init":
      await initPlugin();
      break;
    case "validate":
      await validatePlugin(process.argv[4]);
      break;
    default:
      console.log(pc.red(`Error: Unknown subcommand "${subcommand}"`));
      console.log(`Usage: qwykz plugin <list|init|validate>`);
      process.exit(1);
  }
}

async function listPlugins() {
  await registry.loadPlugins();
  const plugins = registry.getPlugins();

  console.log(pc.bold(pc.cyan("qwykz plugins")));
  console.log("");

  if (plugins.length === 0) {
    console.log("No plugins found.");
    return;
  }

  for (const plugin of plugins) {
    console.log(`${pc.green(plugin.manifest.name)} ${pc.dim(`v${plugin.manifest.version}`)}`);
    console.log(`  Path: ${plugin.pluginDir}`);

    const frameworks = plugin.manifest.capabilities?.frameworks;
    if (frameworks && frameworks.length > 0) {
      console.log(`  Frameworks: ${frameworks.map(f => f.name).join(", ")}`);
    }

    const authProviders = plugin.manifest.capabilities?.authProviders;
    if (authProviders && authProviders.length > 0) {
      console.log(`  Auth Providers: ${authProviders.map(a => a.name).join(", ")}`);
    }

    console.log("");
  }
}

async function initPlugin() {
  intro(pc.inverse(" qwykz plugin init "));

  const name = await text({
    message: "Plugin name (e.g., qwykz-plugin-my-framework):",
    placeholder: "qwykz-plugin-custom",
    validate: (value) => {
      if (!value) return "Name is required";
      if (!value.startsWith("qwykz-plugin-")) return "Plugin name should start with 'qwykz-plugin-'";
    }
  });

  if (isCancel(name)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  const s = spinner();
  s.start("Generating plugin skeleton");

  const pluginDir = join(process.cwd(), name as string);

  if (existsSync(pluginDir)) {
    s.stop(pc.red(`Directory ${name} already exists.`));
    process.exit(1);
  }

  mkdirSync(pluginDir, { recursive: true });
  mkdirSync(join(pluginDir, "templates", "custom-framework"), { recursive: true });

  const manifest = {
    $schema: "https://qwykz.dev/plugin.schema.json",
    name: name,
    version: "0.1.0",
    description: "A custom qwykz plugin",
    author: "Your Name",
    qwykzVersion: ">=1.0.0",
    capabilities: {
      frameworks: [
        {
          name: "custom-framework",
          label: "Custom Framework",
          type: "backend",
          language: "typescript",
          runtime: "node",
          templateDir: "templates/custom-framework"
        }
      ],
      authProviders: [],
      deploymentTargets: []
    },
    packages: {
      dependencies: {},
      devDependencies: {}
    },
    scripts: {
      dev: "bun --watch index.ts"
    }
  };

  writeFileSync(join(pluginDir, "plugin.json"), JSON.stringify(manifest, null, 2));

  // Write a sample template file
  writeFileSync(join(pluginDir, "templates", "custom-framework", "index.ts"), "// Entrypoint for custom framework\nconsole.log('Hello world!');\n");

  s.stop(pc.green("Plugin skeleton generated successfully!"));

  outro(`Plugin created at ${pluginDir}. You can test it by running: qwykz plugin validate ${pluginDir}`);
}

async function validatePlugin(dirPath?: string) {
  const targetDir = dirPath ? resolve(process.cwd(), dirPath) : process.cwd();

  console.log(`Validating plugin at ${targetDir}...`);

  const manifestPath = join(targetDir, "plugin.json");
  if (!existsSync(manifestPath)) {
    console.log(pc.red("✖ Validation failed: plugin.json not found in directory."));
    process.exit(1);
  }

  try {
    const content = readFileSync(manifestPath, "utf-8");
    const manifest = JSON.parse(content);

    validateManifest(targetDir, manifest);
    console.log(pc.green("✔ Plugin is valid!"));
  } catch (e: any) {
    console.log(pc.red(`✖ Validation failed: ${e.message}`));
    process.exit(1);
  }
}
