from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.api.deps import get_db
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.user import User, UserCreate, UserRead

router = APIRouter()

class Token(BaseModel):
    access_token: str
    token_type: str

class AuthResponse(BaseModel):
    user: UserRead
    token: Token

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/register", response_model=AuthResponse)
async def register(user_in: UserCreate, session: AsyncSession = Depends(get_db)) -> Any:
    """
    Register a new user.
    """
    result = await session.exec(select(User).where(User.email == user_in.email))
    user = result.first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    
    user = User(
        email=user_in.email,
        name=user_in.name,
        password=get_password_hash(user_in.password),
        role=user_in.role
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    
    access_token = create_access_token(subject=user.id)
    return AuthResponse(
        user=user,
        token=Token(access_token=access_token, token_type="bearer")
    )


@router.post("/login", response_model=AuthResponse)
async def login(login_data: LoginRequest, session: AsyncSession = Depends(get_db)) -> Any:
    """
    Login a user.
    """
    result = await session.exec(select(User).where(User.email == login_data.email))
    user = result.first()
    if not user or not verify_password(login_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    access_token = create_access_token(subject=user.id)
    return AuthResponse(
        user=user,
        token=Token(access_token=access_token, token_type="bearer")
    )
