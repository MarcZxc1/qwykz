const fs = require("fs");
let content = fs.readFileSync("src/generator.ts", "utf-8");
const lines = content.split("\n");
lines.splice(265, 60, `  if (options.dbTarget === "supabase") {
    envContent = envContent.replace("# DB_HOST=127.0.0.1", "DB_HOST=aws-0-region.pooler.supabase.com");
    envContent = envContent.replace("# DB_PORT=3306", "DB_PORT=6543");
    envContent = envContent.replace("# DB_DATABASE=laravel", "DB_DATABASE=postgres");
    envContent = envContent.replace("# DB_USERNAME=root", "DB_USERNAME=postgres.[your-project-ref]");
    envContent = envContent.replace("# DB_PASSWORD=", "DB_PASSWORD=[your-database-password]");
  } else {
    envContent = envContent.replace("# DB_HOST=127.0.0.1", "DB_HOST=127.0.0.1");
    envContent = envContent.replace("# DB_PORT=3306", "DB_PORT=5432");
    envContent = envContent.replace(
      "# DB_DATABASE=laravel",
      \`DB_DATABASE=\${options.projectName}\`,
    );
    envContent = envContent.replace("# DB_USERNAME=root", "DB_USERNAME=postgres");
    envContent = envContent.replace(
      "# DB_PASSWORD=",
      \`DB_PASSWORD=\${options.dbTarget === "docker" ? dbPassword : "postgres"}\`,
    );
  }

  await writeFile(envPath, envContent);

  if (options.dbTarget === "docker") {
    console.log(\`\\n🐳 Generating docker-compose.yml...\`);

    const dockerCompose = await resolveDockerCompose(
      options.projectName,
      dbPassword,
    );

    await writeFile(join(targetDir, "docker-compose.yml"), dockerCompose);
  }`);
fs.writeFileSync("src/generator.ts", lines.join("\n"));
