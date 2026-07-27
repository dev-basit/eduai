from functools import lru_cache

from langchain_openai import ChatOpenAI

from app.config import settings


@lru_cache
def get_llm(temperature: float = 0.7) -> ChatOpenAI:
    return ChatOpenAI(
        api_key=settings.OPENAI_API_KEY,
        model=settings.LLM_MODEL,
        temperature=temperature,
    )
