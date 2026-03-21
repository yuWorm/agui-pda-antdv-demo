from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKey


class Session(Base, UUIDPrimaryKey, TimestampMixin):
    __tablename__ = "sessions"

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(256), default="New Chat")
    model_provider: Mapped[str] = mapped_column(String(64), default="openai")
    model_name: Mapped[str] = mapped_column(String(128), default="gpt-4o")
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False)

    user = relationship("User", back_populates="sessions")
    messages = relationship("Message", back_populates="session", cascade="all, delete-orphan")
