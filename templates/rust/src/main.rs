mod api;
mod db;

use axum::{
    http::{Method, header::{ACCEPT, AUTHORIZATION, CONTENT_TYPE}},
    routing::{get, post},
    Router,
};
use tower_http::cors::CorsLayer;
use api::handlers::{
    health::health_check,
    auth::{register, login},
    users::get_users,
};
use api::AppState;
use sqlx::postgres::PgPoolOptions;
use std::env;

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();
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

    let users_routes = Router::new()
        .route("/", get(get_users));

    let cors = CorsLayer::new()
        .allow_origin("http://localhost:5173".parse::<axum::http::HeaderValue>().unwrap())
        .allow_methods([Method::GET, Method::POST, Method::OPTIONS, Method::PUT, Method::DELETE])
        .allow_headers([AUTHORIZATION, CONTENT_TYPE, ACCEPT])
        .allow_credentials(true);

    let app = Router::new()
        .route("/api/health", get(health_check))
        .nest("/api/auth", auth_routes)
        .nest("/api/users", users_routes)
        .with_state(state)
        .layer(cors);

    let port = env::var("PORT").unwrap_or_else(|_| "8080".to_string());
    let address = format!("0.0.0.0:{port}");
    let listener = tokio::net::TcpListener::bind(&address).await.unwrap();
    println!("Listening on {address}");
    axum::serve(listener, app).await.unwrap();
}
