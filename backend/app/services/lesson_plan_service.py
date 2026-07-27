import json
import uuid
from sqlalchemy.orm import Session

from app.ai.llm import get_llm
from app.models.lesson_plan import LessonPlan
from app.schemas.lesson_plan import LessonPlanCreate, LessonPlanResponse, QuizRequest

_QUIZ_PROMPT = """You are an expert educator. Generate a short diagnostic quiz to assess a student's current knowledge level.

Subject: {subject}{topics_section}
Student's goal: {goal}

Rules:
- 4-6 questions total
- Mix: ~60% MCQ, ~40% short answer
- Cover different difficulty levels (easy → hard) to pinpoint exactly where they are
- Questions must directly test the specific topics listed, not general knowledge
- Keep questions concise and clear

Return ONLY valid JSON (no markdown):
{{
  "questions": [
    {{
      "id": "q1",
      "topic": "Algebra",
      "difficulty": "easy",
      "type": "mcq",
      "question": "What is the value of x in 2x + 4 = 10?",
      "options": ["A. 2", "B. 3", "C. 4", "D. 5"],
      "correct_answer": "B. 3",
      "points": 1
    }},
    {{
      "id": "q2",
      "topic": "Algebra",
      "difficulty": "hard",
      "type": "short",
      "question": "Solve and explain your steps: 3x² - 12 = 0",
      "options": null,
      "correct_answer": "x = ±2. Steps: 3x²=12 → x²=4 → x=±2",
      "points": 2
    }}
  ],
  "total_points": 10,
  "instructions": "Answer honestly — this helps us build the right plan for you. It should take about 3 minutes."
}}"""

_PLAN_PROMPT = """You are an expert educational planner creating a personalized 7-day study plan.

Student profile:
- Subject: {subject}{topics_section}
- Goal: {goal}
- Study time available: {hours} hours per day
{skill_section}
{focus_instruction}

Return ONLY valid JSON — no markdown, no explanation:
{{
  "skill_summary": "2-sentence assessment of the student's current level based on the quiz — be specific about what they know and don't know",
  "week_overview": "2-3 sentence summary of what the student will achieve this week and how the plan is structured around their level",
  "daily_plans": [
    {{
      "day": "Monday",
      "topics": ["Topic A", "Topic B"],
      "duration_minutes": {duration},
      "activities": ["Specific activity 1", "Practice 10 problems on X", "Watch YouTube: channel — specific video topic"],
      "resources": ["Khan Academy — specific topic URL description", "YouTube: channel name — video title", "Practice: describe the type of problems to do"],
      "learning_objectives": ["Be able to solve X type problems", "Understand concept Y"]
    }}
  ],
  "weekly_goals": ["Concrete measurable goal 1", "Concrete measurable goal 2", "Concrete measurable goal 3"],
  "tips": ["Actionable study tip specific to this student's weak areas", "Tip 2", "Tip 3"]
}}

Generate all 7 days (Monday–Sunday). Each day must be specific to the student's topics and goal.
IMPORTANT for resources: only suggest free online resources (Khan Academy, YouTube channels, practice websites like Brilliant.org, Desmos, PhET simulations etc). Never suggest textbooks or paid materials."""


def generate_quiz(body: QuizRequest) -> dict:
    topics_section = ""
    if body.topics:
        topics_section = f"\nTopics to assess: {', '.join(body.topics)}"

    prompt = _QUIZ_PROMPT.format(
        subject=body.subject,
        topics_section=topics_section,
        goal=body.goal,
    )
    llm = get_llm(temperature=0.7)
    response = llm.invoke(prompt)
    content = response.content.strip()
    if content.startswith("```"):
        content = content.split("```")[1]
        if content.startswith("json"):
            content = content[4:]
    return json.loads(content.strip())


def generate_lesson_plan(body: LessonPlanCreate, db: Session, user_id: uuid.UUID | None = None) -> LessonPlanResponse:
    topics_section = ""
    focus_instruction = "Build the week progressively — start with foundational concepts and increase complexity."
    if body.topics:
        topics_list = ", ".join(body.topics)
        topics_section = f"\n- Specific topics to cover: {topics_list}"
        focus_instruction = f"Focus on these topics: {topics_list}. Do not add unrelated content."

    skill_section = ""
    if body.quiz_questions and body.quiz_answers:
        qa_pairs = []
        for q in body.quiz_questions:
            student_answer = body.quiz_answers.get(q["id"], "(no answer)")
            qa_pairs.append(
                f'  Q ({q["difficulty"]}): {q["question"]}\n'
                f'  Correct: {q["correct_answer"]}\n'
                f'  Student answered: {student_answer}'
            )
        skill_section = (
            "\nDiagnostic quiz results (use these to calibrate the plan):\n"
            + "\n\n".join(qa_pairs)
            + "\n\nBased on the above, identify exactly what the student already knows and what they struggle with."
            + " Skip topics they clearly mastered. Focus heavily on weak areas."
        )

    prompt = _PLAN_PROMPT.format(
        subject=body.subject,
        topics_section=topics_section,
        goal=body.goal,
        hours=body.study_hours_per_day,
        duration=int(body.study_hours_per_day * 60),
        skill_section=skill_section,
        focus_instruction=focus_instruction,
    )

    llm = get_llm(temperature=0.7)
    response = llm.invoke(prompt)
    content = response.content.strip()
    if content.startswith("```"):
        content = content.split("```")[1]
        if content.startswith("json"):
            content = content[4:]
    plan_data = json.loads(content.strip())

    record = LessonPlan(
        user_id=user_id,
        grade=body.grade,
        subject=body.subject,
        goal=body.goal,
        study_hours_per_day=body.study_hours_per_day,
        plan=plan_data,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return LessonPlanResponse.model_validate(record)


_IMPROVE_PROMPT = """You are an expert educational planner. A student has been following a lesson plan and completed real assignments. Use their actual performance data to generate an improved, targeted 7-day study plan.

Current plan context:
- Subject: {subject}
- Goal: {goal}
- Study time: {hours} hours per day
- Current skill summary: {skill_summary}

Assignment performance data:
{performance_summary}

Rules for the improved plan:
- Spend significantly more time on topics where scores were below 70%
- Lightly review or skip topics with scores above 85%
- Directly address every area listed under "Needs work"
- Incorporate recommended topics from the feedback
- If the student is consistently struggling overall, begin with more foundational activities before progressing
- Be specific — activities should mention the exact weak topics by name
- Keep only free online resources (Khan Academy, YouTube, Brilliant.org, PhET, etc) — no textbooks

Return ONLY valid JSON (no markdown):
{{
  "skill_summary": "2-sentence updated assessment based on the actual assignment performance — be specific about what the data reveals",
  "week_overview": "2-3 sentence summary describing how this improved plan is different from the previous one and what weak areas it targets",
  "daily_plans": [
    {{
      "day": "Monday",
      "topics": ["Specific weak topic A", "Remedial concept B"],
      "duration_minutes": {duration},
      "activities": ["Specific remedial activity targeting weak topic", "Practice 10 problems on X", "Review correct approach to Y"],
      "resources": ["Khan Academy — specific topic", "YouTube: channel — video title", "Practice: describe problems"],
      "learning_objectives": ["Understand why the previous approach to X was wrong", "Correctly solve Y type problems"]
    }}
  ],
  "weekly_goals": ["Measurable goal targeting a previously weak area", "Goal 2", "Goal 3"],
  "tips": ["Tip addressing a specific mistake pattern seen in submissions", "Tip 2", "Tip 3"]
}}

Generate all 7 days (Monday–Sunday). Every day must directly reflect the performance data above."""


def improve_lesson_plan(plan_id: uuid.UUID, db: Session) -> LessonPlanResponse:
    from fastapi import HTTPException
    from app.models.assignment import Assignment, AssignmentSubmission
    from sqlalchemy import desc

    plan = db.query(LessonPlan).filter(LessonPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Lesson plan not found")

    assignments = (
        db.query(Assignment)
        .filter(Assignment.subject.ilike(plan.subject))
        .order_by(desc(Assignment.created_at))
        .limit(10)
        .all()
    )

    perf_lines: list[str] = []
    for a in assignments:
        sub = (
            db.query(AssignmentSubmission)
            .filter(AssignmentSubmission.assignment_id == a.id)
            .order_by(desc(AssignmentSubmission.created_at))
            .first()
        )
        if not sub:
            continue
        fb = sub.feedback
        pct = fb.get("percentage", 0)
        grade = fb.get("grade", "?")
        strengths = "; ".join(fb.get("strengths", [])) or "—"
        improvements = "; ".join(fb.get("areas_for_improvement", [])) or "—"
        recommended = "; ".join(fb.get("recommended_topics", [])) or "—"
        perf_lines.append(
            f"  Topic: {a.topic} | Difficulty: {a.difficulty} | Score: {pct:.0f}% ({grade})\n"
            f"    Strengths: {strengths}\n"
            f"    Needs work: {improvements}\n"
            f"    Recommended next topics: {recommended}"
        )

    if not perf_lines:
        raise HTTPException(status_code=422, detail="No submitted assignments found for this subject")

    performance_summary = "\n\n".join(perf_lines)
    skill_summary = plan.plan.get("skill_summary") or "No prior assessment available."

    prompt = _IMPROVE_PROMPT.format(
        subject=plan.subject,
        goal=plan.goal,
        hours=plan.study_hours_per_day,
        duration=int(plan.study_hours_per_day * 60),
        skill_summary=skill_summary,
        performance_summary=performance_summary,
    )

    llm = get_llm(temperature=0.7)
    response = llm.invoke(prompt)
    content = response.content.strip()
    if content.startswith("```"):
        content = content.split("```")[1]
        if content.startswith("json"):
            content = content[4:]
    new_plan_data = json.loads(content.strip())

    record = LessonPlan(
        user_id=plan.user_id,
        grade=plan.grade,
        subject=plan.subject,
        goal=plan.goal,
        study_hours_per_day=plan.study_hours_per_day,
        plan=new_plan_data,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return LessonPlanResponse.model_validate(record)


def list_lesson_plans(db: Session, user_id: uuid.UUID | None = None) -> list[LessonPlanResponse]:
    query = db.query(LessonPlan)
    if user_id:
        query = query.filter(LessonPlan.user_id == user_id)
    records = query.order_by(LessonPlan.created_at.desc()).limit(50).all()
    return [LessonPlanResponse.model_validate(r) for r in records]


def get_lesson_plan(plan_id: uuid.UUID, db: Session) -> LessonPlanResponse:
    record = db.query(LessonPlan).filter(LessonPlan.id == plan_id).first()
    if not record:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Lesson plan not found")
    return LessonPlanResponse.model_validate(record)
