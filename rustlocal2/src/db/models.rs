use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, Type};
use uuid::Uuid;

#[derive(Type, Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[sqlx(type_name = "user_role", rename_all = "UPPERCASE")]
pub enum Role {
    USER,
    ADMIN,
    MANAGER,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    #[serde(skip_serializing)]
    pub password: String,
    pub name: String,
    pub role: Role,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
