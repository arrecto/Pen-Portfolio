from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    API_V1: str
    MCP_HOST: str
    MCP_PORT: str
    MISTRAL_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    SQLITE_DB_PATH: str = "./pen.db"

    class Config:
        env_file = ".env"

settings = Settings()