from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import SecretStr

class Settings(BaseSettings):
    OPENAI_API_KEY: SecretStr
    LLM_MODEL: str
    EMBEDDING_MODEL: str
    IS_LLM_LIMIT: bool
    LLM_REQUESTS_PER_DAY: int

    DATABASE_URL: SecretStr

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings() # type: ignore
