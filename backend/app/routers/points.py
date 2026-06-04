from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.point_transaction import PointTransaction
from app.schemas.points import PointsResponse, TransactionResponse, PurchaseRequest
from app.services.points_service import get_user_transactions

router = APIRouter(prefix="/points", tags=["points"])


@router.get("", response_model=PointsResponse)
async def get_points(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    transactions = await get_user_transactions(db, current_user.id)

    return PointsResponse(
        balance=current_user.points_balance,
        transactions=[
            TransactionResponse(
                id=str(t.id),
                change_amount=t.change_amount,
                balance_after=t.balance_after,
                reason=t.reason,
                related_generation_id=str(t.related_generation_id) if t.related_generation_id else None,
                created_at=t.created_at.isoformat(),
            )
            for t in transactions
        ],
    )


@router.post("/purchase")
async def purchase_points(
    body: PurchaseRequest,
    current_user: User = Depends(get_current_user),
):
    return {"message": "Payment not yet available"}
