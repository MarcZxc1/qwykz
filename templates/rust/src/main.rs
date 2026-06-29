mod api;
mod db;

use axum::{
    routing::{get, post},
    Router,
};
use api::handlers::{
    health::health_check,
    auth::{register, login},
};
use api::AppState;
use sqlx::postgres::PgPoolOptions;
use std::env;

#[tokio::main]
async fn main() {
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let jwt_secret = env::var("JWT_SECRET").unwrap_or_else(|_| "secret".to_string());

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("Failed to connect to Postgres");

    let state = AppState {
        db: pool,
        jwt_secret,
    };

    let auth_routes = Router::new()
        .route("/register", post(register))
        .route("/login", post(login));

    let app = Router::new()
        .route("/health", get(health_check))
        .nest("/api/auth", auth_routes)
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await.unwrap();
    println!("Listening on 0.0.0.0:8080");
    axum::serve(listener, app).await.unwrap();
}
