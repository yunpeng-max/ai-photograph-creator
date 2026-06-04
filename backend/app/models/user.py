import uuid
from datetime import datetime

from sqlalchemy import Integer, String, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    nickname: Mapped[str] = mapped_column(String(100), nullable=False)
    points_balance: Mapped[int] = mapped_column(Integer, nullable=False, default=5)
    locale: Mapped[str] = mapped_column(String(5), nullable=False, default="zh")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    generations: Mapped[list["Generation"]] = relationship(back_populates="user", lazy="selectin")
    point_transactions: Mapped[list["PointTransaction"]] = relationship(
        back_populates="user", lazy="selectin"
    )
    payment_orders: Mapped[list["PaymentOrder"]] = relationship(
        back_populates="user", lazy="selectin"
    )
