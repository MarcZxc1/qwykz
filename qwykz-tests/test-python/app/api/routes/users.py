from typing import Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.api.deps import get_db, get_current_user, require_role
from app.models.user import User, UserRead, RoleEnum

router = APIRouter()

@router.get("/", response_model=List[UserRead])
async def list_users(
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.ADMIN))
) -> Any:
    """
    Get a list of users.
    Requires authentication.
    """
    result = await session.exec(select(User).order_by(User.created_at.desc()))
    users = result.all()
    return users
