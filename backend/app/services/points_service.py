from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.point_transaction import PointTransaction
from app.models.user import User


async def deduct_points(
    db: AsyncSession,
    user: User,
    amount: int,
    reason: str,
    related_generation_id: str | None = None,
) -> int:
    """
    Deduct points from user balance atomically.
    Returns the new balance after deduction.
    Raises ValueError if insufficient points.
    """
    if user.points_balance < amount:
        raise ValueError("Insufficient points")

    # Deduct points
    user.points_balance -= amount
    new_balance = user.points_balance

    # Record transaction
    txn = PointTransaction(
        user_id=user.id,
        change_amount=-amount,
        balance_after=new_balance,
        reason=reason,
        related_generation_id=related_generation_id,
    )
    db.add(txn)

    return new_balance


async def add_points(
    db: AsyncSession,
    user: User,
    amount: int,
    reason: str,
    related_generation_id: str | None = None,
) -> int:
    """
    Add points to user balance.
    Returns the new balance after addition.
    """
    user.points_balance += amount
    new_balance = user.points_balance

    # Record transaction
    txn = PointTransaction(
        user_id=user.id,
        change_amount=amount,
        balance_after=new_balance,
        reason=reason,
        related_generation_id=related_generation_id,
    )
    db.add(txn)

    return new_balance


async def get_user_transactions(
    db: AsyncSession,
    user_id: str,
    limit: int = 50,
) -> list[PointTransaction]:
    """Get recent point transactions for a user."""
    result = await db.execute(
        select(PointTransaction)
        .where(PointTransaction.user_id == user_id)
        .order_by(PointTransaction.created_at.desc())
        .limit(limit)
    )
    return list(result.scalars().all())
