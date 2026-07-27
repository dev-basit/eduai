from functools import lru_cache

from langchain_ollama import OllamaEmbeddings

OLLAMA_MODEL = "gemma4:e2b"


@lru_cache
def get_embeddings() -> OllamaEmbeddings:
    return OllamaEmbeddings(model=OLLAMA_MODEL)
