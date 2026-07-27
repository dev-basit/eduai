from sqlalchemy import String, DateTime, Float, Integer, Text, ARRAY
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime, timezone
import uuid

from app.config import Base


class LessonPlan(Base):
    __tablename__ = "lesson_plans"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)
    grade: Mapped[str] = mapped_column(String, nullable=False)
    subject: Mapped[str] = mapped_column(String, nullable=False)
    goal: Mapped[str] = mapped_column(Text, nullable=False)
    topics: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    days: Mapped[int] = mapped_column(Integer, nullable=False, server_default="7")
    study_hours_per_day: Mapped[float] = mapped_column(Float, nullable=False)
    plan: Mapped[dict] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
