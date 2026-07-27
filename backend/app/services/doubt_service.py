import uuid
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.ai.llm import get_llm
from app.models.conversation import Conversation, Message
from app.schemas.conversation import ConversationResponse, MessageResponse, AskRequest

_SYSTEM = """You are an expert tutor helping students understand academic concepts.
Explain concepts clearly and simply. Use examples, analogies, and step-by-step breakdowns.
When explaining math or science, show your working. Encourage follow-up questions.
Keep answers focused and age-appropriate."""


def create_conversation(subject: str | None, db: Session, user_id: uuid.UUID | None = None) -> ConversationResponse:
    title = f"{subject} - Doubt Session" if subject else "Doubt Session"
    conv = Conversation(user_id=user_id, subject=subject, title=title)
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

    messages = [("system", _SYSTEM)]
    for m in history[:-1]:
        messages.append(("human" if m.role == "human" else "assistant", m.content))
    messages.append(("human", body.question))

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
