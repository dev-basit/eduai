from pydantic import BaseModel
from datetime import datetime
import uuid


class AskRequest(BaseModel):
    question: str


class ConversationCreate(BaseModel):
    subject: str | None = None
    context_type: str | None = None   # "assignment" | "lesson_plan"
    context_id: str | None = None


class MessageResponse(BaseModel):
    id: uuid.UUID
    conversation_id: uuid.UUID
    role: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationResponse(BaseModel):
    id: uuid.UUID
    subject: str | None
    title: str
    context_type: str | None = None
    context_id: uuid.UUID | None = None
    created_at: datetime
    messages: list[MessageResponse] = []

    model_config = {"from_attributes": True}
