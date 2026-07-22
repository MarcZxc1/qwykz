import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { readTemplate } from "../../template-engine";
import type { ProjectOptions } from "../../types";
import { writeJson } from "../shared/files";
import {
  createVitePackageJson,
  resolveFrontendApiUrl,
  writeReactScaffold,
  writeVueScaffold,
} from "../shared/frontend";

function stripBackendStatus(content: string): string {
  const stripped = content
    .replace(/import\s*\{\s*useState,\s*useEffect\s*\}\s*from\s*["']react["'];?/g, 'import { useState } from "react";')
    .replace(/\s*const \[backendStatus[^\n]*/g, "")
    .replace(/\s*const \{ getToken \} = useAuth\(\);?/g, "")
    .replace(/\s*const backendStatus = ref.*?;/g, "")
    .replace(/\s*const \[users, setUsers\] = useState<any\[\]>\(\[\]\);/g, "")
    .replace(/\s*const testBackend = async \(\) => \{[\s\S]*?\}\s*\};\s*/g, "")
    .replace(/\s*const testBackend = async \(\) => \{[\s\S]*?catch \(e\) \{[\s\S]*?\}\s*\};/g, "")
    .replace(/\s*useEffect\(\(\) => \{[\s\S]*?testBackend\(\)[\s\S]*?\}, \[.*?\]\);?/g, "")
    .replace(/\s*onMounted\(async \(\) => \{[\s\S]*?catch \(err\) \{[\s\S]*?\}\s*\}\)/g, "")
    .replace(/\s*<div className="mt-8 p-4 bg-gray-50 rounded-md border border-gray-200 w-full max-w-md[^>]*">[\s\S]*?Backend Connection Status[\s\S]*?<\/div>/g, "")
    .replace(/\s*<div class="mt-8 p-4 bg-gray-50 rounded-md border border-gray-200 w-full max-w-md[^>]*">[\s\S]*?Backend Connection Status[\s\S]*?<\/div>/g, "")
    .replace(/\s*<div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">\s*<h2[^>]*>Backend Connection Status[\s\S]*?<\/p>\s*<\/div>\s*<\/div>\s*<\/div>/g, "")
    .replace(/\s*<div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">\s*<h2[^>]*>Backend Connection Status[\s\S]*?<\/p>\s*<\/div>\s*<\/div>\s*<\/div>/g, "")
    .replace(/\s*\{users\.length > 0 && \([\s\S]*?<\/div>\s*\)\}/g, "")
    .replace(/\s*<div v-if="users\.length > 0"[\s\S]*?Users API Response[\s\S]*?<\/div>/g, "");

  return stripped.replace(
    /,\s*useAuth(?=\s*\}\s*from\s*["']@clerk\/react["'];?)/g,
    "",
  );
}

export async function generateReactProject(options: ProjectOptions) {
  console.log(`\n🚀 Scaffolding React + Vite...`);
  const targetDir = join(process.cwd(), options.projectName);
  await mkdir(join(targetDir, "src", "lib"), { recursive: true });

  const viteConfig = await readTemplate("react/vite.config.ts.stub");
  const indexCss = await readTemplate("react/index.css.stub");

  if (options.authTarget === "clerk") {
    let clerkProvider = await readTemplate("react/clerk-provider.tsx.stub");
    if (!options.backendFramework) clerkProvider = stripBackendStatus(clerkProvider);
    await Bun.write(join(targetDir, "src", "App.tsx"), clerkProvider);
  } else if (options.authTarget === "supabase") {
    const supabaseTs = await readTemplate("react/supabase.ts.stub");
    const authContextTsx = await readTemplate("react/AuthContext.tsx.stub");
    let appTsx = await readTemplate("react/App.tsx.stub");
    if (!options.backendFramework) appTsx = stripBackendStatus(appTsx);
    await Bun.write(join(targetDir, "src", "lib", "supabase.ts"), supabaseTs);
    await Bun.write(join(targetDir, "src", "lib", "AuthContext.tsx"), authContextTsx);
    await Bun.write(join(targetDir, "src", "App.tsx"), appTsx);
  } else {
    // Local Auth App.tsx
    let localAppTsx = await readTemplate("react/App.local.tsx.stub");
    if (!options.backendFramework) localAppTsx = stripBackendStatus(localAppTsx);
    await Bun.write(join(targetDir, "src", "App.tsx"), localAppTsx);
  }

  await Bun.write(join(targetDir, "vite.config.ts"), viteConfig);
  await Bun.write(join(targetDir, "src", "index.css"), indexCss);
  await writeReactScaffold(targetDir);

  const pkgJson = await createVitePackageJson(options.projectName, "react", options.authTarget);
  await writeJson(join(targetDir, "package.json"), pkgJson);

  const apiUrl = resolveFrontendApiUrl(options.backendFramework);

  if (options.authTarget === "clerk") {
    const envContent = `VITE_API_URL="${apiUrl}"\nVITE_CLERK_PUBLISHABLE_KEY="YOUR_CLERK_PUBLISHABLE_KEY"\n`;
    await Bun.write(join(targetDir, ".env"), envContent);
    await Bun.write(join(targetDir, ".env.example"), envContent);
  } else if (options.authTarget === "supabase") {
    const envContent = `VITE_API_URL="${apiUrl}"\nVITE_SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"\nVITE_SUPABASE_ANON_KEY="YOUR_ANON_KEY"\n`;
    await Bun.write(join(targetDir, ".env"), envContent);
    await Bun.write(join(targetDir, ".env.example"), envContent);
  } else {
    await Bun.write(join(targetDir, ".env"), `VITE_API_URL="${apiUrl}"\n`);
  }
}

export async function generateVueProject(options: ProjectOptions) {
  console.log(`\n🚀 Scaffolding Vue + Vite...`);
  const targetDir = join(process.cwd(), options.projectName);
  await mkdir(join(targetDir, "src", "lib"), { recursive: true });

  const viteConfig = await readTemplate("vue/vite.config.ts.stub");
  const styleCss = await readTemplate("vue/style.css.stub");

  if (options.authTarget === "clerk") {
    const clerkPlugin = await readTemplate("vue/clerk-plugin.ts.stub");
    let appVue = await readTemplate("vue/App.clerk.vue.stub");
    if (!options.backendFramework) appVue = stripBackendStatus(appVue);
    await Bun.write(join(targetDir, "src", "lib", "clerk.ts"), clerkPlugin);
    await Bun.write(join(targetDir, "src", "App.vue"), appVue);
    await Bun.write(join(targetDir, "src", "main.ts"), `import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { setupClerk } from './lib/clerk'

const app = createApp(App)
setupClerk(app)
app.mount('#app')`);
  } else if (options.authTarget === "supabase") {
    const supabaseTs = await readTemplate("vue/supabase.ts.stub");
    const authTs = await readTemplate("vue/auth.ts.stub");
    let appVue = await readTemplate("vue/App.vue.stub");
    if (!options.backendFramework) appVue = stripBackendStatus(appVue);
    await Bun.write(join(targetDir, "src", "lib", "supabase.ts"), supabaseTs);
    await Bun.write(join(targetDir, "src", "lib", "auth.ts"), authTs);
    await Bun.write(join(targetDir, "src", "App.vue"), appVue);
  } else {
    let localAppVue = await readTemplate("vue/App.local.vue.stub");
    if (!options.backendFramework) localAppVue = stripBackendStatus(localAppVue);
    await Bun.write(join(targetDir, "src", "App.vue"), localAppVue);
  }

  await Bun.write(join(targetDir, "vite.config.ts"), viteConfig);
  await Bun.write(join(targetDir, "src", "style.css"), styleCss);
  await writeVueScaffold(targetDir, options.authTarget === "clerk");

  const pkgJson = await createVitePackageJson(options.projectName, "vue", options.authTarget);
  await writeJson(join(targetDir, "package.json"), pkgJson);

  const apiUrl = resolveFrontendApiUrl(options.backendFramework);

  if (options.authTarget === "clerk") {
    const envContent = `VITE_API_URL="${apiUrl}"\nVITE_CLERK_PUBLISHABLE_KEY="YOUR_CLERK_PUBLISHABLE_KEY"\n`;
    await Bun.write(join(targetDir, ".env"), envContent);
    await Bun.write(join(targetDir, ".env.example"), envContent);
  } else if (options.authTarget === "supabase") {
    const envContent = `VITE_API_URL="${apiUrl}"\nVITE_SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"\nVITE_SUPABASE_ANON_KEY="YOUR_ANON_KEY"\n`;
    await Bun.write(join(targetDir, ".env"), envContent);
    await Bun.write(join(targetDir, ".env.example"), envContent);
  } else {
    await Bun.write(join(targetDir, ".env"), `VITE_API_URL="${apiUrl}"\n`);
  }
}
