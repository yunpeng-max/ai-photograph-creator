from fastapi import APIRouter, Depends, HTTPException, Header, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.point_transaction import PointTransaction
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    AuthResponse,
    UserResponse,
    UpdateUserRequest,
)
from app.services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    get_user_by_email,
)

router = APIRouter(prefix="/auth", tags=["auth"])


class ResetPasswordRequest(BaseModel):
    email: str
    new_password: str


def _verify_admin(x_admin_token: str = Header(default="")) -> None:
    settings = get_settings()
    if not settings.admin_token:
        raise HTTPException(status_code=403, detail="Admin not configured")
    if x_admin_token != settings.admin_token:
        raise HTTPException(status_code=401, detail="Invalid admin token")


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Check if email already exists
    existing = await get_user_by_email(db, body.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    # Create user
    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        nickname=body.nickname,
        points_balance=5,
    )
    db.add(user)
    await db.flush()

    # Record registration bonus transaction
    txn = PointTransaction(
        user_id=user.id,
        change_amount=5,
        balance_after=5,
        reason="registration_bonus",
    )
    db.add(txn)
    await db.commit()
    await db.refresh(user)

    token = create_access_token(user.id)
    return AuthResponse(
        token=token,
        user=UserResponse(
            id=str(user.id),
            email=user.email,
            nickname=user.nickname,
            points_balance=user.points_balance,
            locale=user.locale,
        ),
    )


@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await get_user_by_email(db, body.email)
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token(user.id)
    return AuthResponse(
        token=token,
        user=UserResponse(
            id=str(user.id),
            email=user.email,
            nickname=user.nickname,
            points_balance=user.points_balance,
            locale=user.locale,
        ),
    )


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        nickname=current_user.nickname,
        points_balance=current_user.points_balance,
        locale=current_user.locale,
    )


@router.patch("/me", response_model=UserResponse)
async def update_me(
    body: UpdateUserRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if body.nickname is not None:
        current_user.nickname = body.nickname
    if body.locale is not None:
        current_user.locale = body.locale

    await db.commit()
    await db.refresh(current_user)

    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        nickname=current_user.nickname,
        points_balance=current_user.points_balance,
        locale=current_user.locale,
    )


@router.post("/reset-password")
async def reset_password(
    body: ResetPasswordRequest,
    _: None = Depends(_verify_admin),
    db: AsyncSession = Depends(get_db),
):
    """Reset a user's password (admin only)."""
    user = await get_user_by_email(db, body.email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.password_hash = hash_password(body.new_password)
    await db.commit()

    return {"message": "Password reset successfully"}