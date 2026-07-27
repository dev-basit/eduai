import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.config import get_db
from app.schemas.conversation import AskRequest, ConversationCreate, ConversationResponse, MessageResponse
from app.services.doubt_service import ask_doubt, create_conversation, get_conversation, list_conversations

router = APIRouter(prefix="/conversations", tags=["Doubt Solver"])


@router.post("/", response_model=ConversationResponse, status_code=201)
def new_conversation(body: ConversationCreate, db: Session = Depends(get_db)):
    return create_conversation(body, db)


@router.get("/", response_model=list[ConversationResponse])
def list_convs(db: Session = Depends(get_db)):
    return list_conversations(db)


@router.get("/{conversation_id}", response_model=ConversationResponse)
def get_conv(conversation_id: uuid.UUID, db: Session = Depends(get_db)):
    return get_conversation(conversation_id, db)


@router.post("/{conversation_id}/ask", response_model=MessageResponse)
def ask(conversation_id: uuid.UUID, body: AskRequest, db: Session = Depends(get_db)):
    return ask_doubt(conversation_id, body, db)
