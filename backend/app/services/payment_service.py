"""
Payment business logic — personal QR code mode.

Flow:
  1. User selects a plan and uploads their personal WeChat QR code
  2. User pays by scanning the QR code with WeChat
  3. User clicks "I've Paid" — order is created with status "pending_manual"
  4. Admin verifies the payment and approves → points are credited
"""

import uuid
from datetime import datetime, timezone, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.payment_order import PaymentOrder
from app.models.user import User
from app.services.points_service import add_points
from app.schemas.payment import (
    PlanInfo,
    PlansResponse,
    CreatePaymentRequest,
    CreatePaymentResponse,
    PaymentStatusResponse,
)


# ── Plan definitions ─────────────────────────────────────

PLANS: list[dict] = [
    {"key": "basic",   "name_zh": "基础套餐", "name_en": "Basic",    "points": 20,  "price_cents": 500},
    {"key": "pro",     "name_zh": "专业套餐", "name_en": "Pro",      "points": 50,  "price_cents": 1000},
    {"key": "premium", "name_zh": "高级套餐", "name_en": "Premium",  "points": 200, "price_cents": 1500},
]


def _get_plan(key: str) -> dict | None:
    for p in PLANS:
        if p["key"] == key:
            return p
    return None


# ── Public API ────────────────────────────────────────────


def get_plans() -> PlansResponse:
    return PlansResponse(
        plans=[
            PlanInfo(
                key=p["key"],
                name_zh=p["name_zh"],
                name_en=p["name_en"],
                points=p["points"],
                price_cents=p["price_cents"],
                price_label=f"¥{p['price_cents'] / 100:.2f}",
            )
            for p in PLANS
        ]
    )


async def create_order(
    db: AsyncSession,
    user: User,
    request: CreatePaymentRequest,
) -> CreatePaymentResponse:
    """Create a pending order after user clicks 'I've Paid'."""
    plan = _get_plan(request.plan)
    if not plan:
        raise ValueError(f"Unknown plan: {request.plan}")

    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(hours=24)

    order = PaymentOrder(
        user_id=user.id,
        plan=plan["key"],
        amount_cents=plan["price_cents"],
        points=plan["points"],
        status="pending_manual",
        wechat_out_trade_no=uuid.uuid4().hex,
        code_url=None,
        expires_at=expires_at,
    )
    db.add(order)
    await db.commit()
    await db.refresh(order)

    return CreatePaymentResponse(
        order_id=str(order.id),
        code_url="",  # not used in QR image mode
        expires_at=expires_at.isoformat(),
    )


async def get_payment_status(
    db: AsyncSession, order_id: str, user_id: str
) -> PaymentStatusResponse | None:
    result = await db.execute(
        select(PaymentOrder).where(
            PaymentOrder.id == order_id,
            PaymentOrder.user_id == user_id,
        )
    )
    order = result.scalar_one_or_none()
    if not order:
        return None

    return PaymentStatusResponse(
        order_id=str(order.id),
        status=order.status,
        plan=order.plan,
        points=order.points,
        amount_cents=order.amount_cents,
        paid_at=order.paid_at.isoformat() if order.paid_at else None,
        created_at=order.created_at.isoformat(),
    )


# ── Admin functions ───────────────────────────────────────


async def get_pending_orders(db: AsyncSession) -> list[dict]:
    """List all orders awaiting manual approval."""
    result = await db.execute(
        select(PaymentOrder)
        .where(PaymentOrder.status == "pending_manual")
        .order_by(PaymentOrder.created_at.desc())
    )
    orders = result.scalars().all()
    return [
        {
            "order_id": str(o.id),
            "user_email": "",  # populated below if user loaded
            "plan": o.plan,
            "amount_cents": o.amount_cents,
            "points": o.points,
            "created_at": o.created_at.isoformat(),
        }
        for o in orders
    ]


async def approve_order(db: AsyncSession, order_id: str) -> bool:
    """Approve a pending order and award points."""
    result = await db.execute(
        select(PaymentOrder).where(PaymentOrder.id == order_id)
    )
    order = result.scalar_one_or_none()
    if not order or order.status != "pending_manual":
        return False

    order.status = "paid"
    order.paid_at = datetime.now(timezone.utc)

    user_result = await db.execute(select(User).where(User.id == order.user_id))
    user = user_result.scalar_one_or_none()
    if user:
        await add_points(
            db, user, amount=order.points, reason=f"purchase_{order.plan}"
        )

    await db.commit()
    return True


async def reject_order(db: AsyncSession, order_id: str) -> bool:
    """Reject a pending order."""
    result = await db.execute(
        select(PaymentOrder).where(PaymentOrder.id == order_id)
    )
    order = result.scalar_one_or_none()
    if not order or order.status != "pending_manual":
        return False

    order.status = "failed"
    await db.commit()
    return True
