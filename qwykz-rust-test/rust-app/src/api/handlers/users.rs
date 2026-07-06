use axum::{
    extract::State,
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use crate::api::AppState;

#[derive(Serialize, FromRow)]
pub struct UserResponse {
    pub id: uuid::Uuid,
    pub email: String,
    pub name: Option<String>,
    pub role: String,
}

pub async fn get_users(
    State(state): State<AppState>,
) -> Result<Json<Vec<UserResponse>>, (StatusCode, String)> {
    let users = sqlx::query_as::<_, UserResponse>(
        "SELECT id, email, name, role FROM users ORDER BY created_at DESC"
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Database error: {}", e),
        )
    })?;

    Ok(Json(users))
}
