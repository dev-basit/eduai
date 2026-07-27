import json
import uuid
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.ai.llm import get_llm
from app.models.assignment import Assignment, AssignmentSubmission
from app.schemas.assignment import (
    AssignmentCreate, AssignmentResponse, CounterAnswersRequest,
    CounterCheckResponse, SubmitAnswersRequest, SubmissionResponse,
)

_GEN_PROMPT = """You are an expert teacher creating an assignment.

Subject: {subject}
Topic: {topic}
Difficulty: {difficulty}
Number of questions: {num_questions}
{skill_section}

Distribute questions: ~40% MCQ, ~30% short answer, ~30% long answer (adjust for small counts).
Questions must match the exact difficulty and topic — no generic questions.

Return ONLY valid JSON (no markdown):
{{
  "title": "Assignment title",
  "subject": "{subject}",
  "topic": "{topic}",
  "instructions": "Brief instructions for the student",
  "questions": [
    {{
      "id": 1,
      "type": "mcq",
      "question": "Question text",
      "options": ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"],
      "marks": 5,
      "expected_answer": "A. Option 1",
      "explanation": "Why this is correct"
    }},
    {{
      "id": 2,
      "type": "short",
      "question": "Question text",
      "options": null,
      "marks": 10,
      "expected_answer": "Model short answer",
      "explanation": "Key points to include"
    }},
    {{
      "id": 3,
      "type": "long",
      "question": "Question text",
      "options": null,
      "marks": 20,
      "expected_answer": "Comprehensive model answer",
      "explanation": "Rubric breakdown"
    }}
  ],
  "total_marks": 100
}}"""

_CHECK_PROMPT = """You are a strict but fair teacher grading a student's assignment.

Questions and model answers:
{questions_json}

Student's answers:
{answers_json}

For each question:
- MCQ: correct only if exact match with expected_answer
- Short/Long: check whether key concepts from expected_answer are covered
- For CORRECT answers: generate ONE challenging follow-up counter question that tests genuine understanding — something they cannot answer just by re-reading their own answer
- For WRONG answers: set counter_question to null

Return ONLY valid JSON (no markdown):
{{
  "total_score": 75,
  "max_score": 100,
  "percentage": 75.0,
  "grade": "B",
  "question_results": [
    {{
      "question_id": 1,
      "question": "...",
      "student_answer": "...",
      "correct_answer": "...",
      "score": 5,
      "max_score": 5,
      "is_correct": true,
      "feedback": "Correct! Well explained.",
      "counter_question": "Now explain why this would change if the coefficient were negative?"
    }},
    {{
      "question_id": 2,
      "question": "...",
      "student_answer": "...",
      "correct_answer": "Full correct answer here",
      "score": 0,
      "max_score": 10,
      "is_correct": false,
      "feedback": "Incorrect. You missed the key concept of X. The correct answer is: ...",
      "counter_question": null
    }}
  ],
  "overall_feedback": "Overall assessment of the student's performance",
  "strengths": ["What they did well"],
  "areas_for_improvement": ["What to work on"]
}}"""

_COUNTER_PROMPT = """You are a teacher checking genuine understanding after a student answered questions correctly.

For each counter question below, evaluate whether the student's answer shows real understanding or was likely guessed/copied.
Be strict: vague, too short, or parroted answers should be marked as not understood.

Counter questions and student answers:
{context_json}

Return ONLY valid JSON (no markdown):
{{
  "results": [
    {{
      "question_id": 1,
      "counter_question": "...",
      "student_answer": "...",
      "understood": true,
      "feedback": "Great — you clearly understand the underlying concept."
    }},
    {{
      "question_id": 2,
      "counter_question": "...",
      "student_answer": "...",
      "understood": false,
      "feedback": "This answer suggests you may have guessed. The key point is: ..."
    }}
  ],
  "overall_understanding": "1-2 sentence summary of what the student genuinely understands vs. what they may have guessed"
}}"""


def generate_assignment(body: AssignmentCreate, db: Session, user_id: uuid.UUID | None = None) -> AssignmentResponse:
    skill_section = ""
    if body.skill_level:
        skill_section = f"\nStudent's current skill level (from planner assessment): {body.skill_level}\nCalibrate question difficulty and depth accordingly."

    prompt = _GEN_PROMPT.format(
        subject=body.subject,
        topic=body.topic,
        difficulty=body.difficulty,
        num_questions=body.num_questions,
        skill_section=skill_section,
    )
    llm = get_llm(temperature=0.8)
    response = llm.invoke(prompt)
    content = response.content.strip()
    if content.startswith("```"):
        content = content.split("```")[1]
        if content.startswith("json"):
            content = content[4:]
    content_data = json.loads(content.strip())

    record = Assignment(
        user_id=user_id,
        subject=body.subject,
        topic=body.topic,
        difficulty=body.difficulty,
        num_questions=body.num_questions,
        content=content_data,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return AssignmentResponse.model_validate(record)


def submit_assignment(assignment_id: uuid.UUID, body: SubmitAnswersRequest, db: Session) -> SubmissionResponse:
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    questions_for_grading = [
        {
            "id": q["id"],
            "type": q["type"],
            "question": q["question"],
            "marks": q["marks"],
            "expected_answer": q["expected_answer"],
        }
        for q in assignment.content.get("questions", [])
    ]
    prompt = _CHECK_PROMPT.format(
        questions_json=json.dumps(questions_for_grading, indent=2),
        answers_json=json.dumps(body.answers, indent=2),
    )
    llm = get_llm(temperature=0.3)
    response = llm.invoke(prompt)
    content = response.content.strip()
    if content.startswith("```"):
        content = content.split("```")[1]
        if content.startswith("json"):
            content = content[4:]
    feedback_data = json.loads(content.strip())

    submission = AssignmentSubmission(
        assignment_id=assignment_id,
        answers=body.answers,
        score=feedback_data.get("total_score", 0),
        max_score=feedback_data.get("max_score", 100),
        feedback=feedback_data,
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return SubmissionResponse.model_validate(submission)


def check_counter_answers(assignment_id: uuid.UUID, submission_id: uuid.UUID, body: CounterAnswersRequest, db: Session) -> CounterCheckResponse:
    submission = db.query(AssignmentSubmission).filter(AssignmentSubmission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    question_results = submission.feedback.get("question_results", [])
    context = []
    for qr in question_results:
        qid = str(qr["question_id"])
        if qr.get("is_correct") and qr.get("counter_question") and qid in body.counter_answers:
            context.append({
                "question_id": qr["question_id"],
                "original_question": qr["question"],
                "student_original_answer": qr["student_answer"],
                "counter_question": qr["counter_question"],
                "student_counter_answer": body.counter_answers[qid],
            })

    if not context:
        return CounterCheckResponse(results=[], overall_understanding="No counter questions to evaluate.")

    prompt = _COUNTER_PROMPT.format(context_json=json.dumps(context, indent=2))
    llm = get_llm(temperature=0.3)
    response = llm.invoke(prompt)
    content = response.content.strip()
    if content.startswith("```"):
        content = content.split("```")[1]
        if content.startswith("json"):
            content = content[4:]
    data = json.loads(content.strip())
    return CounterCheckResponse(**data)


def get_assignment(assignment_id: uuid.UUID, db: Session) -> AssignmentResponse:
    record = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return AssignmentResponse.model_validate(record)


def list_assignments(db: Session, user_id: uuid.UUID | None = None) -> list[AssignmentResponse]:
    query = db.query(Assignment)
    if user_id:
        query = query.filter(Assignment.user_id == user_id)
    records = query.order_by(Assignment.created_at.desc()).limit(50).all()
    return [AssignmentResponse.model_validate(r) for r in records]


def get_submission(submission_id: uuid.UUID, db: Session) -> SubmissionResponse:
    record = db.query(AssignmentSubmission).filter(AssignmentSubmission.id == submission_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Submission not found")
    return SubmissionResponse.model_validate(record)
