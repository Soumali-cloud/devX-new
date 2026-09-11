"""Central application settings loaded from environment variables and .env."""

from typing import List, Optional

try:
    from pydantic_settings import BaseSettings, SettingsConfigDict
except ImportError:  # pragma: no cover - dependency is required in production
    from pydantic import BaseSettings  # type: ignore
    SettingsConfigDict = None  # type: ignore


class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "HimYatra: Antarctic Sea Ice & Navigation DSS"
    API_KEY: Optional[str] = None
    JWT_SECRET: Optional[str] = None
    NASA_EARTHDATA_USER: Optional[str] = None
    NASA_EARTHDATA_PASS: Optional[str] = None
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    API_KEYS: List[str] = []

    if SettingsConfigDict is not None:
        model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    else:
        class Config:
            env_file = ".env"
            extra = "ignore"


settings = Settings()
