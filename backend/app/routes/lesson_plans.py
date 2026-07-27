import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.config import get_db
from app.models.lesson_plan import LessonPlan
from app.schemas.lesson_plan import LessonPlanCreate, LessonPlanResponse, QuizRequest
from app.services.lesson_plan_service import generate_lesson_plan, generate_quiz, get_lesson_plan, improve_lesson_plan, list_lesson_plans

router = APIRouter(prefix="/lesson-plans", tags=["Lesson Plans"])


def _infer_difficulty(skill_summary: str | None) -> str:
    if not skill_summary:
        return "medium"
    lower = skill_summary.lower()
    if any(w in lower for w in ["beginner", "basics", "struggling", "weak", "limited", "very little", "no knowledge", "little knowledge"]):
        return "easy"
    if any(w in lower for w in ["advanced", "strong", "proficient", "mastered", "excellent", "solid understanding", "deep understanding"]):
        return "hard"
    return "medium"


@router.get("/subjects")
def get_subjects(db: Session = Depends(get_db)):
    plans = db.query(LessonPlan).order_by(LessonPlan.created_at.desc()).all()
    seen: set[str] = set()
    result = []
    for plan in plans:
        if plan.subject in seen:
            continue
        seen.add(plan.subject)
        skill_summary = plan.plan.get("skill_summary") if plan.plan else None
        result.append({
            "subject": plan.subject,
            "skill_summary": skill_summary,
            "suggested_difficulty": _infer_difficulty(skill_summary),
        })
    return result


@router.post("/quiz")
def get_quiz(body: QuizRequest):
    return generate_quiz(body)


@router.post("/generate", response_model=LessonPlanResponse, status_code=201)
def generate(body: LessonPlanCreate, db: Session = Depends(get_db)):
    return generate_lesson_plan(body, db)


@router.get("/", response_model=list[LessonPlanResponse])
def list_plans(db: Session = Depends(get_db)):
    return list_lesson_plans(db)


@router.get("/{plan_id}", response_model=LessonPlanResponse)
def get_plan(plan_id: uuid.UUID, db: Session = Depends(get_db)):
    return get_lesson_plan(plan_id, db)


@router.post("/{plan_id}/improve", response_model=LessonPlanResponse, status_code=201)
def improve_plan(plan_id: uuid.UUID, db: Session = Depends(get_db)):
    return improve_lesson_plan(plan_id, db)
