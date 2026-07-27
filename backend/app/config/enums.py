from enum import Enum


class ChatRole(str, Enum):
    HUMAN = "human"
    AI = "ai"


class AIModel(str, Enum):
    GEMMA4_E2B = "gemma4:e2b"
    EMBEDDING = "gemma4:e2b"
