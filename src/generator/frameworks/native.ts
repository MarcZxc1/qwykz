import { join } from "node:path";
import { readTemplate } from "../../template-engine";
import type { ProjectOptions } from "../../types";
import {
  copyDirectoryRecursive,
  generateDbPassword,
  generateJwtSecret,
} from "../shared/files";
import { resolveDockerCompose, resolveEnvFile } from "../shared/runtime";

export async function generatePythonProject(options: ProjectOptions) {
  const targetDir = join(process.cwd(), options.projectName);
  console.log(`\n🚀 Scaffolding Python (FastAPI)...`);

  await copyDirectoryRecursive(
    "python",
    targetDir,
    { "qwykz-app": options.projectName }
  );

  const jwtSecret = generateJwtSecret();
  const dbPassword = generateDbPassword();
  let envContent = await resolveEnvFile(options.dbTarget, options.projectName, jwtSecret, dbPassword, options.authTarget, options.cachingTarget, options.dbPort, options.redisPort);
  envContent = envContent.replace('?schema=public', '');

  if (options.cachingTarget !== "none") {
    const redisStub = await readTemplate("python/redis.py.stub");
    await Bun.write(join(targetDir, "app/core/redis.py"), redisStub);
    const reqPath = join(targetDir, "requirements.txt");
    const reqText = await Bun.file(reqPath).text();
    await Bun.write(reqPath, reqText + "redis>=5.0.1\n");
  }

  if (options.dbTarget === "docker" || options.cachingTarget === "docker") {
    const dc = await resolveDockerCompose(options.projectName, dbPassword, options.dbTarget, options.cachingTarget, options.dbPort, options.redisPort);
    await Bun.write(join(targetDir, "docker-compose.yml"), dc);
  }

  await Bun.write(join(targetDir, ".env"), envContent);
}

export async function generateGoProject(options: ProjectOptions) {
  const targetDir = join(process.cwd(), options.projectName);
  console.log(`\n🚀 Scaffolding Go (Fiber)...`);

  await copyDirectoryRecursive(
    "go",
    targetDir,
    { "qwykz-app": options.projectName }
  );

  const jwtSecret = generateJwtSecret();
  const dbPassword = generateDbPassword();
  let envContent = await resolveEnvFile(options.dbTarget, options.projectName, jwtSecret, dbPassword, options.authTarget, options.cachingTarget, options.dbPort, options.redisPort);
  envContent = envContent.replace('?schema=public', '');

  if (options.cachingTarget !== "none") {
    const redisStub = await readTemplate("go/redis.go.stub");
    await Bun.spawn(["mkdir", "-p", join(targetDir, "internal/cache")]).exited;
    await Bun.write(join(targetDir, "internal/cache/redis.go"), redisStub);
    const modPath = join(targetDir, "go.mod");
    const modText = await Bun.file(modPath).text();
    await Bun.write(modPath, modText + "\nrequire github.com/redis/go-redis/v9 v9.5.1\n");
  }

  if (options.dbTarget === "docker" || options.cachingTarget === "docker") {
    const dc = await resolveDockerCompose(options.projectName, dbPassword, options.dbTarget, options.cachingTarget, options.dbPort, options.redisPort);
    await Bun.write(join(targetDir, "docker-compose.yml"), dc);
  }

  await Bun.write(join(targetDir, ".env"), envContent);
}

export async function generateRustProject(options: ProjectOptions) {
  const targetDir = join(process.cwd(), options.projectName);
  console.log(`\n🚀 Scaffolding Rust (Axum)...`);

  await copyDirectoryRecursive(
    "rust",
    targetDir,
    { "qwykz-app": options.projectName }
  );

  const jwtSecret = generateJwtSecret();
  const dbPassword = generateDbPassword();
  let envContent = await resolveEnvFile(options.dbTarget, options.projectName, jwtSecret, dbPassword, options.authTarget, options.cachingTarget, options.dbPort, options.redisPort);

  if (options.cachingTarget !== "none") {
    const redisStub = await readTemplate("rust/redis.rs.stub");
    await Bun.spawn(["mkdir", "-p", join(targetDir, "src/cache")]).exited;
    await Bun.write(join(targetDir, "src/cache/mod.rs"), "pub mod redis;\n");
    await Bun.write(join(targetDir, "src/cache/redis.rs"), redisStub);
    const cargoPath = join(targetDir, "Cargo.toml");
    const cargoText = await Bun.file(cargoPath).text();
    await Bun.write(cargoPath, cargoText + "redis = { version = \"0.25.3\", features = [\"tokio-comp\", \"tokio-rustls-comp\"] }\n");

    const mainPath = join(targetDir, "src/main.rs");
    const mainText = await Bun.file(mainPath).text();
    await Bun.write(mainPath, mainText.replace("mod db;\n", "mod db;\npub mod cache;\n"));

    const usersPath = join(targetDir, "src/api/handlers/users.rs");
    await Bun.write(usersPath, `use axum::{
    extract::State,
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use redis::AsyncCommands;
use crate::api::AppState;

#[derive(Serialize, Deserialize, FromRow)]
pub struct UserResponse {
    pub id: uuid::Uuid,
    pub email: String,
    pub name: Option<String>,
    pub role: String,
}

pub async fn get_users(
    State(state): State<AppState>,
) -> Result<Json<Vec<UserResponse>>, (StatusCode, String)> {
    let client = crate::cache::redis::get_client();
    if let Ok(mut con) = client.get_multiplexed_async_connection().await {
        if let Ok(cached_users) = con.get::<_, String>("users:all").await {
            if let Ok(users) = serde_json::from_str::<Vec<UserResponse>>(&cached_users) {
                return Ok(Json(users));
            }
        }
    }

    let users = sqlx::query_as::<_, UserResponse>(
        "SELECT id, email, name, role::text as role FROM users ORDER BY created_at DESC"
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Database error: {}", e)))?;

    if let Ok(mut con) = client.get_multiplexed_async_connection().await {
        if let Ok(json_str) = serde_json::to_string(&users) {
            let _: redis::RedisResult<()> = con.set_ex("users:all", json_str, 60).await;
        }
    }

    Ok(Json(users))
}`);
  }

  if (options.dbTarget === "docker" || options.cachingTarget === "docker") {
    const dc = await resolveDockerCompose(options.projectName, dbPassword, options.dbTarget, options.cachingTarget, options.dbPort, options.redisPort);
    await Bun.write(join(targetDir, "docker-compose.yml"), dc);
  }

  await Bun.write(join(targetDir, ".env"), envContent);
}
