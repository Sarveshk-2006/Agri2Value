# backend/app/core/config.py
"""
Application configuration using pydantic-settings.
All values are loaded from environment variables or .env file.
"""
from functools import lru_cache
from typing import List
import os

from dotenv import load_dotenv
load_dotenv(".env", override=True)

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ---- Application ----
    APP_NAME: str = "Agri2Value"
    APP_ENV: str = "development"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"

    # ---- Database ----
    DATABASE_URL: str
    DATABASE_URL_SYNC: str = ""  # Used by Alembic; derived below if empty

    # ---- Authentication ----
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ---- Demo Auth ----
    DEMO_OTP_CODE: str = "123456"
    DEMO_MODE: bool = True

    # ---- CORS ----
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @field_validator("JWT_SECRET_KEY")
    @classmethod
    def secret_must_not_be_placeholder(cls, v: str) -> str:
        if v.startswith("CHANGE_ME"):
            import warnings
            warnings.warn(
                "JWT_SECRET_KEY is set to a placeholder value. "
                "This is insecure. Generate a real secret for staging/production.",
                stacklevel=2,
            )
        return v


@lru_cache
def get_settings() -> Settings:
    """Return cached application settings instance."""
    return Settings()
