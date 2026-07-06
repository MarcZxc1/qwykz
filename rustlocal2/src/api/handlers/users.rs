use axum::{
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
}