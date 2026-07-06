import uuid
from datetime import datetime
from enum import Enum
from typing import Optional
from sqlmodel import Field, SQLModel


class RoleEnum(str, Enum):
    USER = "USER"
    ADMIN = "ADMIN"
    MANAGER = "MANAGER"


class UserBase(SQLModel):
    email: str = Field(unique=True, index=True)
    name: str
    role: RoleEnum = Field(default=RoleEnum.USER)


class User(UserBase, table=True):
    __tablename__ = "users"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class UserCreate(UserBase):
    password: str


class UserRead(UserBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
