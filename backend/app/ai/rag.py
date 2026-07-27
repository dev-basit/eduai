from langchain_classic.chains import create_history_aware_retriever, create_retrieval_chain
from langchain_classic.chains.combine_documents import create_stuff_documents_chain
from langchain_core.messages import BaseMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_postgres import PGVector

from app.ai.embeddings import get_embeddings
from app.ai.llm import get_llm
from app.config import settings

_COLLECTION = "pdf_documents"

_CONTEXTUALIZE_PROMPT = ChatPromptTemplate.from_messages([
    (
        "system",
        "Given the chat history and the latest user question, reformulate the question "
        "to be standalone and self-contained. Do NOT answer it — only reformulate if needed, "
        "otherwise return it as is.",
    ),
    MessagesPlaceholder("chat_history"),
    ("human", "{input}"),
])

_QA_PROMPT = ChatPromptTemplate.from_messages([
    (
        "system",
        "You are a helpful assistant for answering questions about PDF documents. "
        "Use the retrieved context below to answer. If the context is empty or irrelevant, "
        "rely on your general knowledge and say so.\n\nContext:\n{context}",
    ),
    MessagesPlaceholder("chat_history"),
    ("human", "{input}"),
])


def get_vector_store() -> PGVector:
    return PGVector(
        embeddings=get_embeddings(),
        collection_name=_COLLECTION,
        connection=str(settings.DATABASE_URL),
        use_jsonb=True,
    )


def _build_rag_chain(conversation_id: str):
    llm = get_llm()
    vector_store = get_vector_store()
    retriever = vector_store.as_retriever(
        search_kwargs={"k": 4, "filter": {"conversation_id": conversation_id}},
    )
    history_aware_retriever = create_history_aware_retriever(llm, retriever, _CONTEXTUALIZE_PROMPT)
    qa_chain = create_stuff_documents_chain(llm, _QA_PROMPT)
    return create_retrieval_chain(history_aware_retriever, qa_chain)


async def run_rag_chain(
    prompt: str,
    conversation_id: str,
    chat_history: list[BaseMessage],
) -> str:
    import asyncio

    rag_chain = _build_rag_chain(conversation_id)
    result = await asyncio.to_thread(
        rag_chain.invoke, {"input": prompt, "chat_history": chat_history}
    )
    return result["answer"]


async def stream_rag_chain(
    prompt: str,
    conversation_id: str,
    chat_history: list[BaseMessage],
):
    import asyncio
    import queue

    rag_chain = _build_rag_chain(conversation_id)
    chunk_queue: queue.Queue = queue.Queue()

    def _stream():
        for chunk in rag_chain.stream({"input": prompt, "chat_history": chat_history}):
            token = chunk.get("answer", "")
            if token:
                chunk_queue.put(token)
        chunk_queue.put(None)

    asyncio.get_event_loop().run_in_executor(None, _stream)

    while True:
        token = await asyncio.to_thread(chunk_queue.get)
        if token is None:
            break
        yield token
