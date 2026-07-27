# from datetime import datetime, timezone

# from langchain_core.messages import AIMessage, HumanMessage
# from sqlalchemy.orm import Session

# from app.config import ChatRole
# from app.models.chat import ChatMessage
# from app.models.conversation import Conversation


# def get_conversation_history(db: Session, conversation_id: str) -> list:
#     rows = (
#         db.query(ChatMessage)
#         .filter(ChatMessage.conversation_id == conversation_id)
#         .order_by(ChatMessage.created_at)
#         .all()
#     )
#     return [
#         HumanMessage(content=r.content) if r.role == ChatRole.HUMAN else AIMessage(content=r.content)
#         for r in rows
#     ]


# def save_exchange(db: Session, conversation_id: str, human: str, ai: str) -> None:
#     db.add_all([
#         ChatMessage(conversation_id=conversation_id, role=ChatRole.HUMAN, content=human),
#         ChatMessage(conversation_id=conversation_id, role=ChatRole.AI, content=ai),
#     ])
#     db.query(Conversation).filter(Conversation.id == conversation_id).update(
#         {"updated_at": datetime.now(timezone.utc)}
#     )
#     db.commit()
