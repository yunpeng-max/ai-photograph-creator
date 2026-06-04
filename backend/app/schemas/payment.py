from pydantic import BaseModel


# ── Plans ────────────────────────────────────────────────

class PlanInfo(BaseModel):
    key: str
    name_zh: str
    name_en: str
    points: int
    price_cents: int
    price_label: str  # e.g. "¥5.00"


class PlansResponse(BaseModel):
    plans: list[PlanInfo]


# ── Create Payment ───────────────────────────────────────

class CreatePaymentRequest(BaseModel):
    plan: str  # "basic" | "pro" | "premium"


class CreatePaymentResponse(BaseModel):
    order_id: str
    code_url: str
    expires_at: str


# ── Payment Status ───────────────────────────────────────

class PaymentStatusResponse(BaseModel):
    order_id: str
    status: str  # "pending" | "paid" | "expired" | "failed"
    plan: str
    points: int
    amount_cents: int
    paid_at: str | None
    created_at: str
