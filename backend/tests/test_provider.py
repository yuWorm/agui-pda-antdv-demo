from app.agent.provider import ModelProviderManager


def test_get_default_provider():
    manager = ModelProviderManager()
    model_str = manager.get_model_string("openai", "gpt-4o")
    assert model_str == "openai:gpt-4o"


def test_get_provider_with_custom_base_url():
    manager = ModelProviderManager()
    manager.register_provider("deepseek", api_key="sk-test", base_url="https://api.deepseek.com/v1")
    config = manager.get_provider_config("deepseek")
    assert config is not None
    assert config["base_url"] == "https://api.deepseek.com/v1"
