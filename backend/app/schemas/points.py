from pydantic import BaseModel


class PointsResponse(BaseModel):
    balance: int
    transactions: list["TransactionResponse"]


class TransactionResponse(BaseModel):
    id: str
    change_amount: int
    balance_after: int
    reason: str
    related_generation_id: str | None = None
    created_at: str

    model_config = {"from_attributes": True}


class PurchaseRequest(BaseModel):
    plan: str
