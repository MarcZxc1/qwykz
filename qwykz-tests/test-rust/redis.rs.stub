use redis::Client;
use std::env;

pub fn get_client() -> Client {
    let url = env::var("REDIS_URL").unwrap_or_else(|_| "redis://localhost:6379".to_string());
    Client::open(url).expect("Invalid Redis URL")
}
