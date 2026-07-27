from pydantic import BaseModel
from datetime import datetime
import uuid


class ResourceResponse(BaseModel):
    id: uuid.UUID
    lesson_plan_id: uuid.UUID
    subject: str
    sections: list[dict]
    created_at: datetime

    model_config = {"from_attributes": True}
