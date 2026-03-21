from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "AG-UI Demo"
    debug: bool = False

    # Database
    database_url: str = "sqlite+aiosqlite:///./data/agui_demo.db"

    # JWT
    jwt_secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # CORS
    cors_origins: list[str] = ["http://localhost:5173"]

    # Default model provider
    default_model_provider: str = "openai"
    default_model_name: str = "gpt-4o"

    # Model provider configs (JSON string, parsed at runtime)
    model_providers_json: str = "{}"

    @property
    def db_path(self) -> Path:
        url = self.database_url.replace("sqlite+aiosqlite:///", "")
        return Path(url).parent


settings = Settings()
