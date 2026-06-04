from pydantic import BaseModel
from typing import Optional


class GenerationRequest(BaseModel):
    image_type: str
    aspect_ratio: str
    style: str
    scene: str
    whitespace: str
    subject: str
    additional_requirements: Optional[str] = None


class GenerationResponse(BaseModel):
    id: str
    status: str
    image_type: str
    aspect_ratio: str
    style: str
    scene: str
    whitespace: str
    subject: str
    additional_requirements: Optional[str] = None
    assembled_prompt: str
    image_url: Optional[str] = None
    cost_points: int
    points_balance_after: int
    created_at: str


class GenerationListResponse(BaseModel):
    items: list[GenerationResponse]
    total: int
    page: int
    size: int
