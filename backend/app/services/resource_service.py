import json
import uuid
from sqlalchemy.orm import Session

from app.ai.llm import get_llm, llm_rate_limit
from app.models.lesson_plan import LessonPlan
from app.models.resource import Resource
from app.schemas.resource import ResourceResponse

_RESOURCE_PROMPT = """You are an expert educator. Generate detailed, self-contained study material for a student to read inside their learning app. Do NOT include any external URLs or links.

Subject: {subject}
Topics to cover: {topics_list}
Student goal: {goal}
{skill_section}

For each topic produce one section with:
- title: a short, clear section heading
- topic: the exact topic name
- explanation: 2-3 paragraphs of thorough, beginner-friendly explanation the student can read to understand the topic without any outside help
- key_concepts: 4-6 concise bullet-point definitions or rules
- examples: 2-3 fully worked examples written as plain text (show all steps)
- quick_check: one short question the student can answer in their head to test understanding (no answer provided — just the question)

Return ONLY valid JSON (no markdown, no trailing commas, no comments):
{{
  "sections": [
    {{
      "title": "...",
      "topic": "...",
      "explanation": "...",
      "key_concepts": ["concept1", "concept2", "concept3"],
      "examples": ["example1", "example2"],
      "quick_check": "..."
    }}
  ]
}}

STRICT JSON RULES — violating any of these will break the parser:
- No trailing commas after the last item in any array or object
- No comments or extra text outside the JSON
- All string values must be on a single line (no literal newlines inside strings — use \\n if needed)
- Arrays must end with the last element followed immediately by ]

Generate one section per topic listed. Keep all content self-contained — no external references."""


def generate_resources(lesson_plan: LessonPlan, db: Session) -> ResourceResponse:
    daily_plans = lesson_plan.plan.get("daily_plans", [])
    topics = list(dict.fromkeys(
        t for day in daily_plans for t in day.get("topics", [])
    ))
    if not topics:
        topics = [lesson_plan.subject]

    skill_section = ""
    if lesson_plan.plan.get("skill_summary"):
        skill_section = f"Student's current level: {lesson_plan.plan['skill_summary']}"

    prompt = _RESOURCE_PROMPT.format(
        subject=lesson_plan.subject,
        topics_list=", ".join(topics),
        goal=lesson_plan.goal,
        skill_section=skill_section,
    )

    llm_rate_limit()
    llm = get_llm(temperature=0.6)
    response = llm.invoke(prompt)
    content = response.content.strip()
    if content.startswith("```"):
        content = content.split("```")[1]
        if content.startswith("json"):
            content = content[4:]
    data = json.loads(content.strip())

    record = Resource(
        lesson_plan_id=lesson_plan.id,
        subject=lesson_plan.subject,
        sections=data["sections"],
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return ResourceResponse.model_validate(record)


def list_resources(db: Session) -> list[ResourceResponse]:
    records = db.query(Resource).order_by(Resource.created_at.desc()).limit(50).all()
    return [ResourceResponse.model_validate(r) for r in records]


def get_resource(resource_id: uuid.UUID, db: Session) -> ResourceResponse:
    from fastapi import HTTPException
    record = db.query(Resource).filter(Resource.id == resource_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Resource not found")
    return ResourceResponse.model_validate(record)


def get_resource_by_plan(plan_id: uuid.UUID, db: Session) -> ResourceResponse:
    from fastapi import HTTPException
    record = db.query(Resource).filter(Resource.lesson_plan_id == plan_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Resource not found for this plan")
    return ResourceResponse.model_validate(record)
