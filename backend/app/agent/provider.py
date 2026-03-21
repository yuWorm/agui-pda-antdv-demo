import json
import os
from dataclasses import dataclass

from app.core.config import settings


@dataclass
class ProviderConfig:
    api_key: str
    base_url: str | None = None


class ModelProviderManager:
    def __init__(self):
        self._providers: dict[str, ProviderConfig] = {}
        self._load_from_config()

    def _load_from_config(self):
        try:
            providers_data = json.loads(settings.model_providers_json)
            for name, config in providers_data.items():
                self._providers[name] = ProviderConfig(
                    api_key=config.get("api_key", ""),
                    base_url=config.get("base_url"),
                )
        except (json.JSONDecodeError, AttributeError):
            pass

    def register_provider(self, name: str, api_key: str, base_url: str | None = None):
        self._providers[name] = ProviderConfig(api_key=api_key, base_url=base_url)

    def get_provider_config(self, name: str) -> dict | None:
        config = self._providers.get(name)
        if not config:
            return None
        return {"api_key": config.api_key, "base_url": config.base_url}

    def get_model_string(self, provider: str, model: str) -> str:
        return f"{provider}:{model}"

    def configure_env(self, provider: str):
        """Set environment variables for pydantic-ai model provider."""
        config = self._providers.get(provider)
        if not config:
            return
        env_map = {
            "openai": "OPENAI_API_KEY",
            "anthropic": "ANTHROPIC_API_KEY",
            "gemini": "GEMINI_API_KEY",
        }
        env_key = env_map.get(provider, f"{provider.upper()}_API_KEY")
        os.environ[env_key] = config.api_key
        if config.base_url:
            os.environ[f"{provider.upper()}_BASE_URL"] = config.base_url

    def list_providers(self) -> list[dict]:
        return [
            {"name": name, "has_base_url": config.base_url is not None}
            for name, config in self._providers.items()
        ]


provider_manager = ModelProviderManager()
