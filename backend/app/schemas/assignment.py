from pydantic import BaseModel
from datetime import datetime
import uuid


class AssignmentCreate(BaseModel):
    subject: str
    topic: str
    difficulty: str = "medium"   # easy / medium / hard
    num_questions: int
    skill_level: str | None = None  # from planner quiz assessment


class AssignmentResponse(BaseModel):
    id: uuid.UUID
    subject: str
    topic: str
    difficulty: str
    num_questions: int
    content: dict
    created_at: datetime

    model_config = {"from_attributes": True}


class SubmitAnswersRequest(BaseModel):
    answers: dict   # {question_id: answer_text}


class CounterAnswersRequest(BaseModel):
    counter_answers: dict   # {question_id: answer_text}


class QuestionResult(BaseModel):
    question_id: int
    question: str
    student_answer: str
    correct_answer: str
    score: float
    max_score: float
    is_correct: bool
    feedback: str
    counter_question: str | None = None


class SubmissionResponse(BaseModel):
    id: uuid.UUID
    assignment_id: uuid.UUID
    answers: dict
    score: float
    max_score: float
    feedback: dict
    created_at: datetime

    model_config = {"from_attributes": True}


class CounterResult(BaseModel):
    question_id: int
    counter_question: str
    student_answer: str
    understood: bool
    feedback: str


class CounterCheckResponse(BaseModel):
    results: list[CounterResult]
    overall_understanding: str
