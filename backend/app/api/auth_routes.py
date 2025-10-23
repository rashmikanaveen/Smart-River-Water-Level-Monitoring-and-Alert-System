from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.sessions import get_session
from pydantic import BaseModel, field_validator
from app.services.auth_service import (
    get_password_hash, authenticate_user, create_access_token, get_user_by_username, admin_required
)
from app.models.database.user import User
from sqlalchemy.future import select

router = APIRouter(prefix="/api/auth")
router.tags=["authentication"]
class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    full_name: str = ""
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if len(v) > 128:
            raise ValueError('Password must not exceed 128 characters')
        return v

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

@router.post("/register", status_code=201)
async def register_user(
    payload: RegisterRequest, 
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(admin_required)  # ✅ Only admins can register users
):
    # Check existing user
    existing = await get_user_by_username(db, payload.username)
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    # Create user
    user = User(
        username=payload.username,
        email=payload.email,
        full_name=payload.full_name,
        password_hash=get_password_hash(payload.password),
        is_admin=False
    )
    async for session in get_session():
        session.add(user)
        await session.commit()
        await session.refresh(user)
        return {"message": "User created", "username": user.username}


