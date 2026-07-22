import re
import uuid
from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import field_validator
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
    password: str = Field(min_length=8, max_length=128)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", value):
            raise ValueError("Invalid email address")
        return value


class UserRead(UserBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
