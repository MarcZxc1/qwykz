export const packageVersions = {
  dependencies: {
    "@prisma/adapter-pg": "7.10.1",
    "@prisma/client": "7.10.1",
    argon2: "0.41.1",
    cors: "2.8.6",
    dotenv: "17.4.2",
    express: "5.2.1",
    helmet: "8.2.0",
    jsonwebtoken: "9.0.2",
    pg: "8.21.0",
    zod: "4.6.7",
  },
  devDependencies: {
    "@prisma/config": "7.10.1",
    "@types/bun": "1.3.14",
    "@types/cors": "2.8.19",
    "@types/express": "5.0.6",
    "@types/jsonwebtoken": "9.0.9",
    "@types/node": "25.9.3",
    "@types/pg": "8.20.0",
    concurrently: "9.2.5",
    prisma: "7.10.1",
    typescript: "6.0.3",
  },
} as const;

// Updated deliberately with each release; scaffolding never queries npm.
const frontendVersions: Record<string, string> = {
  react: "19.2.7",
  "react-dom": "19.2.7",
  vue: "3.5.42",
  tailwindcss: "4.3.3",
  vite: "8.3.5",
  "@vitejs/plugin-react": "6.1.1",
  "@vitejs/plugin-vue": "6.0.8",
  "@tailwindcss/vite": "4.3.3",
  "@types/react": "19.2.17",
  "@types/react-dom": "19.2.3",
  "@vue/compiler-sfc": "3.5.42",
  "vue-tsc": "3.3.13",
  "@clerk/react": "6.15.1",
  "@clerk/vue": "2.5.0",
  "@supabase/supabase-js": "2.115.0",
};

export function resolvePackageVersions(packageNames: string[]): Record<string, string> {
  const bundled: Record<string, string> = {
    ...packageVersions.dependencies,
    ...packageVersions.devDependencies,
    ...frontendVersions,
  };
  return Object.fromEntries(packageNames.map((name) => {
    const version = bundled[name];
    if (!version) throw new Error(`No bundled package version for ${name}`);
    return [name, version];
  }));
}
