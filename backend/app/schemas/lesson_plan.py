from pydantic import BaseModel
from datetime import datetime
import uuid


class QuizRequest(BaseModel):
    subject: str
    topics: list[str] | None = None
    goal: str


class LessonPlanCreate(BaseModel):
    grade: str = ""
    subject: str
    topics: list[str] | None = None
    goal: str
    study_hours_per_day: float
    quiz_questions: list[dict] | None = None
    quiz_answers: dict | None = None   # {question_id: answer_text}


class LessonPlanResponse(BaseModel):
    id: uuid.UUID
    grade: str
    subject: str
    topics: list[str] | None = None
    goal: str
    study_hours_per_day: float
    plan: dict
    created_at: datetime

    model_config = {"from_attributes": True}
