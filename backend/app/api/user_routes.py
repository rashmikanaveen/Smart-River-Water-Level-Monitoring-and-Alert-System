from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from pydantic import BaseModel, EmailStr, Field

from app.db.sessions import get_session
from app.models.database.user import User
from app.services.auth_service import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user
)

router = APIRouter(prefix="/api/users", tags=["users"])


# Pydantic Models for Request/Response
class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)


class UserLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    is_admin: bool
    is_active: bool

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    email: EmailStr | None = None
    is_active: bool | None = None
    is_admin: bool | None = None


class PasswordChange(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=8, max_length=128)



@router.post("/login", response_model=Token)
async def login(
    user_data: UserLogin,
    session: AsyncSession = Depends(get_session)
):
    """
    Login with username and password.
    
    Returns a JWT access token for authenticated requests.
    """
    # Find user by username
    stmt = select(User).where(User.username == user_data.username)
    result = await session.execute(stmt)
    user = result.scalar_one_or_none()
    
    # Verify user exists and password is correct
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Create access token
    access_token = create_access_token(
        data={"sub": user.username, "user_id": user.id, "is_admin": user.is_admin}
    )
    
    
    return {"access_token": access_token, "token_type": "bearer"}


# ==================== User Management Routes ====================

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Get current logged-in user's information.
    
    Requires authentication.
    """
    return current_user


@router.get("/role/{username}")
async def get_user_role(
    username: str,
    session: AsyncSession = Depends(get_session)
):
    """
    Get user role by username.
    
    Returns the user's role (admin or user).
    """
    # Find user by username
    stmt = select(User).where(User.username == username)
    result = await session.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {
        "username": user.username,
        "role": "admin" if user.is_admin else "user",
        "is_admin": user.is_admin,
        "is_active": user.is_active
    }


@router.post("/change-password", status_code=status.HTTP_200_OK)
async def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Change current user's password.
    
    Requires authentication and correct old password.
    """
    # Verify old password
    if not verify_password(password_data.old_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect old password"
        )
    
    # Update password
    current_user.password_hash = get_password_hash(password_data.new_password)
    
    await session.commit()
    
    return {"message": "Password changed successfully"}

