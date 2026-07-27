from functools import lru_cache

from langchain_ollama import ChatOllama

OLLAMA_MODEL = "gemma4:e2b"


@lru_cache
def get_llm(temperature: float = 0.7) -> ChatOllama:
    return ChatOllama(model=OLLAMA_MODEL, temperature=temperature, timeout=600)
