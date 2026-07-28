import uuid
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.ai.llm import get_llm, llm_rate_limit
from app.models.conversation import Conversation, Message
from app.schemas.conversation import ConversationCreate, ConversationResponse, MessageResponse, AskRequest

_SYSTEM = """You are an expert tutor helping students understand academic concepts.
Explain concepts clearly and simply. Use examples, analogies, and step-by-step breakdowns.
When explaining math or science, show your working. Encourage follow-up questions.
Keep answers focused and age-appropriate."""


def _build_context_section(conv: Conversation, db: Session) -> str:
    if not conv.context_type or not conv.context_id:
        return ""

    if conv.context_type == "assignment":
        from app.models.assignment import Assignment, AssignmentSubmission
        from sqlalchemy import desc

        assignment = db.query(Assignment).filter(Assignment.id == conv.context_id).first()
        if not assignment:
            return ""

        section = (
            f"\n\nSTUDENT CONTEXT — The student is asking about an assignment they worked on:\n"
            f"Subject: {assignment.subject} | Topic: {assignment.topic} | Difficulty: {assignment.difficulty}\n"
        )

        submission = (
            db.query(AssignmentSubmission)
            .filter(AssignmentSubmission.assignment_id == assignment.id)
            .order_by(desc(AssignmentSubmission.created_at))
            .first()
        )
        if submission:
            fb = submission.feedback
            pct = round((submission.score / submission.max_score * 100), 1) if submission.max_score else 0
            section += f"Score: {submission.score}/{submission.max_score} ({pct}%)\n"

            wrong = [
                qr for qr in fb.get("question_results", [])
                if not qr.get("is_correct")
            ]
            if wrong:
                section += "Questions they got wrong:\n"
                for qr in wrong:
                    section += (
                        f"  - Q: {qr.get('question')}\n"
                        f"    Their answer: {qr.get('student_answer') or '(blank)'}\n"
                        f"    Correct answer: {qr.get('correct_answer')}\n"
                    )

            improvements = fb.get("areas_for_improvement", [])
            if improvements:
                section += f"Areas needing improvement: {'; '.join(improvements)}\n"
        else:
            section += "(Student has not submitted this assignment yet — explain the topic proactively.)\n"

        section += "\nUse this context to target your explanations at the student's specific mistakes and gaps. Reference their actual wrong answers when helpful."
        return section

    if conv.context_type == "lesson_plan":
        from app.models.lesson_plan import LessonPlan

        plan = db.query(LessonPlan).filter(LessonPlan.id == conv.context_id).first()
        if not plan:
            return ""

        topics = list(dict.fromkeys(
            t for day in plan.plan.get("daily_plans", []) for t in day.get("topics", [])
        ))
        skill = plan.plan.get("skill_summary", "")

        section = (
            f"\n\nSTUDENT CONTEXT — The student is following a lesson plan:\n"
            f"Subject: {plan.subject} | Goal: {plan.goal}\n"
        )
        if skill:
            section += f"Current level: {skill}\n"
        if topics:
            section += f"Topics in their plan: {', '.join(topics)}\n"

        section += "\nTailor your explanations to match their stated goal and current skill level. Refer to their plan topics when relevant."
        return section

    return ""


def create_conversation(body: ConversationCreate, db: Session, user_id: uuid.UUID | None = None) -> ConversationResponse:
    subject = body.subject
    context_id = uuid.UUID(body.context_id) if body.context_id else None
    title = f"{subject} - Doubt Session" if subject else "Doubt Session"
    conv = Conversation(
        user_id=user_id,
        subject=subject,
        title=title,
        context_type=body.context_type,
        context_id=context_id,
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return ConversationResponse.model_validate(conv)


def ask_doubt(conversation_id: uuid.UUID, body: AskRequest, db: Session) -> MessageResponse:
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    human_msg = Message(conversation_id=conversation_id, role="human", content=body.question)
    db.add(human_msg)
    db.flush()

    history = db.query(Message).filter(Message.conversation_id == conversation_id).order_by(Message.created_at).all()

    context_section = _build_context_section(conv, db)
    system_prompt = _SYSTEM + context_section

    messages = [("system", system_prompt)]
    for m in history[:-1]:
        messages.append(("human" if m.role == "human" else "assistant", m.content))
    messages.append(("human", body.question))

    llm_rate_limit()
    llm = get_llm(temperature=0.5)
    response = llm.invoke(messages)
    answer = response.content.strip()

    ai_msg = Message(conversation_id=conversation_id, role="ai", content=answer)
    db.add(ai_msg)
    db.commit()
    db.refresh(ai_msg)
    return MessageResponse.model_validate(ai_msg)


def get_conversation(conversation_id: uuid.UUID, db: Session) -> ConversationResponse:
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return ConversationResponse.model_validate(conv)


def list_conversations(db: Session, user_id: uuid.UUID | None = None) -> list[ConversationResponse]:
    query = db.query(Conversation)
    if user_id:
        query = query.filter(Conversation.user_id == user_id)
    records = query.order_by(Conversation.created_at.desc()).limit(20).all()
    return [ConversationResponse.model_validate(r) for r in records]
