from datetime import date
from functools import lru_cache

from fastapi import HTTPException
from langchain_openai import ChatOpenAI

from app.config import settings

_counter: dict = {"count": 0, "day": date.today()}


def llm_rate_limit() -> None:
    if not settings.IS_LLM_LIMIT:
        return
    
    today = date.today()
    if _counter["day"] != today:
        _counter["count"] = 0
        _counter["day"] = today
    if _counter["count"] >= settings.LLM_REQUESTS_PER_DAY:
        raise HTTPException(status_code=429, detail="AI limit reached. Try again tomorrow.")
    _counter["count"] += 1


@lru_cache
def get_llm(temperature: float = 0.7) -> ChatOpenAI:
    return ChatOpenAI(
        api_key=settings.OPENAI_API_KEY,
        model=settings.LLM_MODEL,
        temperature=temperature,
    )
