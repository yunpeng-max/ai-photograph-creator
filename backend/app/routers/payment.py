"""
Payment API routes — personal QR code mode.

- GET  /plans              — list recharge plans
- GET  /qr                 — get QR code image URL
- POST /create             — create order after user clicks "I've Paid"
- GET  /status/{order_id}  — poll payment status
- GET  /admin/pending      — list pending orders (admin)
- POST /admin/approve/{id} — approve order (admin)
- POST /admin/reject/{id}  — reject order (admin)
"""

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.payment import (
    CreatePaymentRequest,
    CreatePaymentResponse,
    PaymentStatusResponse,
    PlansResponse,
)
from app.services.payment_service import (
    create_order,
    get_payment_status,
    get_plans,
    get_pending_orders,
    approve_order,
    reject_order,
)

router = APIRouter(prefix="/payment", tags=["payment"])


@router.get("/plans", response_model=PlansResponse)
async def list_plans():
    return get_plans()


@router.get("/qr")
async def get_qr_code():
    """Return the admin's WeChat payment QR code URL."""
    settings = get_settings()
    return {"qr_url": settings.wechat_qr_url or ""}


@router.post("/create", response_model=CreatePaymentResponse)
async def create_payment(
    body: CreatePaymentRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Submit payment confirmation. Admin will verify manually."""
    try:
        return await create_order(db, current_user, body)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/status/{order_id}", response_model=PaymentStatusResponse)
async def check_payment_status(
    order_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await get_payment_status(db, order_id, str(current_user.id))
    if not result:
        raise HTTPException(status_code=404, detail="Order not found")
    return result


# ── Admin endpoints (protected by admin_token) ─────────────


def _verify_admin(x_admin_token: str = Header(default="")) -> None:
    settings = get_settings()
    if not settings.admin_token:
        raise HTTPException(status_code=403, detail="Admin not configured")
    if x_admin_token != settings.admin_token:
        raise HTTPException(status_code=401, detail="Invalid admin token")


@router.get("/admin/pending")
async def list_pending(
    _: None = Depends(_verify_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all orders awaiting manual approval (admin only)."""
    return {"orders": await get_pending_orders(db)}


@router.post("/admin/approve/{order_id}")
async def approve(
    order_id: str,
    _: None = Depends(_verify_admin),
    db: AsyncSession = Depends(get_db),
):
    """Approve a pending order and credit points (admin only)."""
    ok = await approve_order(db, order_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Order not found or already processed")
    return {"status": "approved"}


@router.post("/admin/reject/{order_id}")
async def reject(
    order_id: str,
    _: None = Depends(_verify_admin),
    db: AsyncSession = Depends(get_db),
):
    """Reject a pending order (admin only)."""
    ok = await reject_order(db, order_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Order not found or already processed")
    return {"status": "rejected"}
