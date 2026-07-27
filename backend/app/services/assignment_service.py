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

_CHECK_PROMPT = """You are an experienced teacher grading a student's assignment. Grade each question carefully using the rules below.

Questions and model answers:
{questions_json}

Student's answers:
{answers_json}

GRADING RULES — follow these exactly:

MCQ:
- Full marks if the student's answer matches expected_answer exactly (case-insensitive, ignore leading/trailing spaces)
- 0 marks for any other answer
- is_correct = true only if full marks awarded

Short answer (partial credit allowed):
- Identify the key concepts in expected_answer
- Award marks proportionally: score = round((concepts_covered / total_concepts) * marks)
- score must be an integer between 0 and the question's marks value — never exceed it
- is_correct = true only if score equals the question's full marks

Long answer (rubric-based partial credit):
- Grade across three dimensions: content accuracy (50%), depth of explanation (30%), clarity (20%)
- Combine into a final score = round(weighted_total * marks)
- score must be an integer between 0 and the question's marks value — never exceed it
- is_correct = true only if score equals the question's full marks

SCORING CONSTRAINTS (critical):
- score is always an integer, never a float
- score is always >= 0 and <= the question's marks
- total_score = sum of all individual scores
- max_score = sum of all question marks
- percentage = round((total_score / max_score) * 100, 1)

GRADE SCALE:
- A: 90–100%
- B: 75–89%
- C: 60–74%
- D: 45–59%
- F: below 45%

COUNTER QUESTIONS:
- For questions where score == full marks: write ONE challenging follow-up question that tests deeper understanding — not answerable by re-reading the student's own answer
- For all other questions: set counter_question to null

FEEDBACK:
- Per question: explain what was correct, what was missed, and what the correct answer is (for wrong/partial answers)
- strengths: 2-3 specific things the student did well overall
- areas_for_improvement: 2-3 specific topics or skills to work on
- recommended_topics: list of topic names the student should study next based on their weak answers

Return ONLY valid JSON (no markdown, no trailing commas, no comments):
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
      "feedback": "Correct. You clearly explained all key concepts.",
      "counter_question": "How would your answer change if the input were negative?"
    }},
    {{
      "question_id": 2,
      "question": "...",
      "student_answer": "...",
      "correct_answer": "Full model answer here",
      "score": 4,
      "max_score": 10,
      "is_correct": false,
      "feedback": "Partial credit. You covered X but missed Y and Z. The key idea is: ...",
      "counter_question": null
    }}
  ],
  "overall_feedback": "2-3 sentence assessment of the student's overall performance",
  "strengths": ["Specific strength 1", "Specific strength 2"],
  "areas_for_improvement": ["Specific area 1", "Specific area 2"],
  "recommended_topics": ["Topic A", "Topic B"]
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
