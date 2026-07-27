from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import SecretStr

class Settings(BaseSettings):
    IS_LLM_LIMIT: bool = True
    LLM_REQUESTS_PER_DAY: int = 100

    DATABASE_URL: SecretStr

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings() # type: ignore
