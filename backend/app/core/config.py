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

    @property
    def async_database_url(self) -> str:
        """Ensure connection string uses asyncpg driver and clean SSL params for Neon."""
        url = self.DATABASE_URL.strip()
        if url.startswith("postgres://"):
            url = "postgresql+asyncpg://" + url[len("postgres://"):]
        elif url.startswith("postgresql://") and not url.startswith("postgresql+asyncpg://"):
            url = "postgresql+asyncpg://" + url[len("postgresql://"):]
        return url

    @property
    def sync_database_url(self) -> str:
        """Ensure sync connection string for Alembic and migration utilities."""
        if self.DATABASE_URL_SYNC.strip():
            return self.DATABASE_URL_SYNC.strip()
        url = self.DATABASE_URL.strip()
        if "sqlite" in url:
            return url.replace("sqlite+aiosqlite://", "sqlite://")
        if "asyncpg" in url:
            return url.replace("postgresql+asyncpg://", "postgresql+psycopg2://")
        if url.startswith("postgres://"):
            return "postgresql+psycopg2://" + url[len("postgres://"):]
        if url.startswith("postgresql://"):
            return "postgresql+psycopg2://" + url[len("postgresql://"):]
        return url

    # ---- Authentication ----
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ---- Demo Auth ----
    DEMO_OTP_CODE: str = "123456"
    DEMO_MODE: bool = True

    # ---- MSG91 Real SMS OTP Provider (Phase 2) ----
    MSG91_AUTH_KEY: str = ""
    MSG91_TEMPLATE_ID: str = ""
    MSG91_SENDER_ID: str = "AGRVAL"
    MSG91_BASE_URL: str = "https://control.msg91.com/api/v5"
    OTP_EXPIRY_MINUTES: int = 10
    OTP_MAX_ATTEMPTS: int = 3

    # ---- External Data Integrations (Phase 2.6) ----
    OPEN_METEO_BASE_URL: str = "https://api.open-meteo.com/v1"
    DATA_GOV_IN_API_KEY: str = ""
    DATA_GOV_IN_RESOURCE_ID: str = "9ef84268-d588-465a-a308-a864a43d0070"
    DATA_GOV_IN_BASE_URL: str = "https://api.data.gov.in/resource"

    # ---- CORS ----
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,https://agri2value.vercel.app"

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
