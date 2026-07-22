import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { resolveLatestVersions } from "../../npm-registry";
import type { AuthTarget, PackageMap, ProjectPackageJson } from "../../types";

async function resolveViteVersions(packageNames: string[]): Promise<Record<string, string>> {
  const resolved = await resolveLatestVersions(packageNames);

  for (const name of packageNames) {
    if (!resolved[name]) resolved[name] = "latest";
  }

  return resolved;
}

async function writeViteIndexHtml(targetDir: string, framework: "react" | "vue") {
  const title = framework === "react" ? "React + Vite" : "Vue + Vite";
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/${framework === "react" ? "main.tsx" : "main.ts"}"></script>
  </body>
</html>
`;
  await writeFile(join(targetDir, "index.html"), html);
}

/** The local URL exposed by each supported fullstack backend. */
export function resolveFrontendApiUrl(backendFramework?: string): string {
  if (backendFramework === "laravel" || backendFramework === "python") {
    return "http://localhost:8000/";
  }
  if (backendFramework === "rust") {
    return "http://localhost:8080/";
  }
  // Express, Hono, Elysia, and Fiber all listen on port 3000.
  return "http://localhost:3000/";
}

export async function writeReactScaffold(targetDir: string) {
  await Promise.all([
    writeViteIndexHtml(targetDir, "react"),
    writeFile(
      join(targetDir, "src", "main.tsx"),
      `import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
`,
    ),
    writeFile(
      join(targetDir, "src", "vite-env.d.ts"),
      `/// <reference types="vite/client" />\n`,
    ),
    writeFile(
      join(targetDir, "tsconfig.json"),
      `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "Bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true,
    "jsx": "react-jsx"
  },
  "include": ["src"]
}
`,
    ),
  ]);
}

export async function writeVueScaffold(targetDir: string, includeClerkBootstrap = false) {
  await Promise.all([
    writeViteIndexHtml(targetDir, "vue"),
    writeFile(
      join(targetDir, "src", "main.ts"),
      includeClerkBootstrap
        ? `import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { setupClerk } from './lib/clerk'

const app = createApp(App)
setupClerk(app)
app.mount('#app')
`
        : `import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

createApp(App).mount('#app')
`,
    ),
    writeFile(
      join(targetDir, "src", "vite-env.d.ts"),
      `/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
`,
    ),
    writeFile(
      join(targetDir, "tsconfig.json"),
      `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "Bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true,
    "jsx": "preserve"
  },
  "include": ["src"]
}
`,
    ),
  ]);
}

export async function createVitePackageJson(
  projectName: string,
  framework: "react" | "vue",
  authTarget: AuthTarget,
): Promise<ProjectPackageJson> {
  const baseDeps = framework === "react"
    ? [
        "react",
        "react-dom",
        "tailwindcss",
        "@clerk/react",
        "@supabase/supabase-js",
        "zod",
      ]
    : [
        "vue",
        "tailwindcss",
        "@clerk/vue",
        "@supabase/supabase-js",
        "zod",
      ];

  const devDeps = framework === "react"
    ? [
        "vite",
        "typescript",
        "@vitejs/plugin-react",
        "@tailwindcss/vite",
        "@types/react",
        "@types/react-dom",
        "@types/node",
      ]
    : [
        "vite",
        "typescript",
        "@vitejs/plugin-vue",
        "@tailwindcss/vite",
        "@vue/compiler-sfc",
        "@types/node",
      ];

  const versions = await resolveViteVersions([...baseDeps, ...devDeps]);

  const dependencies: PackageMap = {
    ...(framework === "react"
      ? {
          react: versions.react!,
          "react-dom": versions["react-dom"]!,
        }
      : {
          vue: versions.vue!,
        }),
    tailwindcss: versions.tailwindcss!,
  };

  const devDependencies: PackageMap = {
    vite: versions.vite!,
    typescript: versions.typescript!,
    "@tailwindcss/vite": versions["@tailwindcss/vite"]!,
    "@types/node": versions["@types/node"]!,
  };

  if (framework === "react") {
    devDependencies["@vitejs/plugin-react"] = versions["@vitejs/plugin-react"]!;
    devDependencies["@types/react"] = versions["@types/react"]!;
    devDependencies["@types/react-dom"] = versions["@types/react-dom"]!;
  } else {
    devDependencies["@vitejs/plugin-vue"] = versions["@vitejs/plugin-vue"]!;
    devDependencies["@vue/compiler-sfc"] = versions["@vue/compiler-sfc"]!;
  }

  if (authTarget === "clerk") {
    dependencies[framework === "react" ? "@clerk/react" : "@clerk/vue"] =
      versions[framework === "react" ? "@clerk/react" : "@clerk/vue"]!;
  } else if (authTarget === "supabase") {
    dependencies["@supabase/supabase-js"] = versions["@supabase/supabase-js"]!;
    dependencies.zod = versions.zod!;
  }

  return {
    name: projectName,
    version: "1.0.0",
    type: "module",
    scripts: {
      dev: "vite",
      build: "vite build",
      preview: "vite preview",
      typecheck: "tsc --noEmit",
    },
    dependencies,
    devDependencies,
  };
}

// ---------------------------------------------------------------------------
// Template resolvers — pick the right variant and inject variables
// ---------------------------------------------------------------------------
