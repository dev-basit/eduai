from enum import Enum


class ChatRole(str, Enum):
    HUMAN = "human"
    AI = "ai"


class AIModel(str, Enum):
    GPT_4O_MINI = "gpt-4o-mini"
    EMBEDDING = "text-embedding-3-small"
