import uuid
from datetime import datetime

from sqlalchemy import Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Generation(Base):
    __tablename__ = "generations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    image_type: Mapped[str] = mapped_column(String(50), nullable=False)
    aspect_ratio: Mapped[str] = mapped_column(String(20), nullable=False)
    style: Mapped[str] = mapped_column(String(50), nullable=False)
    scene: Mapped[str] = mapped_column(String(50), nullable=False)
    whitespace: Mapped[str] = mapped_column(String(20), nullable=False)
    subject: Mapped[str] = mapped_column(Text, nullable=False)
    additional_requirements: Mapped[str | None] = mapped_column(Text, nullable=True)
    assembled_prompt: Mapped[str] = mapped_column(Text, nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending", index=True
    )
    cost_points: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="generations")
