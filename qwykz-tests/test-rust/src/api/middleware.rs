use axum::{
    async_trait,
    extract::FromRequestParts,
    http::{request::Parts, StatusCode},
    response::{IntoResponse, Response},
    Json,
};
use jsonwebtoken::{decode, DecodingKey, Validation};
use serde_json::json;

use crate::api::handlers::auth::Claims;
use crate::api::AppState;
use crate::db::models::Role;

pub struct RequireAuth(pub Claims);

#[async_trait]
impl FromRequestParts<AppState> for RequireAuth {
    type Rejection = Response;

    async fn from_request_parts(parts: &mut Parts, state: &AppState) -> Result<Self, Self::Rejection> {
        let auth_header = parts
            .headers
            .get("Authorization")
            .and_then(|h| h.to_str().ok())
            .and_then(|h| h.strip_prefix("Bearer "))
            .ok_or_else(|| {
                (
                    StatusCode::UNAUTHORIZED,
                    Json(json!({"error": "Missing or invalid authorization header"})),
                )
                    .into_response()
            })?;

        let token_data = decode::<Claims>(
            auth_header,
            &DecodingKey::from_secret(state.jwt_secret.as_bytes()),
            &Validation::default(),
        )
        .map_err(|_| {
            (
                StatusCode::UNAUTHORIZED,
                Json(json!({"error": "Invalid token"})),
            )
                .into_response()
        })?;

        Ok(RequireAuth(token_data.claims))
    }
}

pub struct RequireAdmin(pub Claims);

#[async_trait]
impl FromRequestParts<AppState> for RequireAdmin {
    type Rejection = Response;

    async fn from_request_parts(parts: &mut Parts, state: &AppState) -> Result<Self, Self::Rejection> {
        let RequireAuth(claims) = RequireAuth::from_request_parts(parts, state).await?;
        
        if claims.role != Role::ADMIN {
            return Err((
                StatusCode::FORBIDDEN,
                Json(json!({"error": "Admin role required"})),
            )
                .into_response());
        }

        Ok(RequireAdmin(claims))
    }
}
