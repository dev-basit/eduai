from functools import lru_cache

from langchain_openai import OpenAIEmbeddings

from app.config import settings


@lru_cache
def get_embeddings() -> OpenAIEmbeddings:
    return OpenAIEmbeddings(
        api_key=settings.OPENAI_API_KEY,
        model=settings.EMBEDDING_MODEL,
    )
