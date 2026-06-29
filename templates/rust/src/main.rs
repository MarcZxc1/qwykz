mod api;

use axum::{
    routing::get,
    Router,
};
use api::handlers::health::health_check;

#[tokio::main]
async fn main() {
    let app = Router::new().route("/health", get(health_check));

    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
