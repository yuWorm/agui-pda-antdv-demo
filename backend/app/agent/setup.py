import inspect
from typing import Any

from fastapi import Request
from starlette.responses import JSONResponse, Response

from pydantic_ai import Agent, DeferredToolRequests
from pydantic_ai.ag_ui import AGUIAdapter
from pydantic_ai.settings import ModelSettings

from app.agent.provider import provider_manager
from app.agent.registry import tool_registry
from app.core.config import settings

OPENAI_REASONING_MODELS = ("o1", "o3", "o4", "gpt-5")

INSTRUCTIONS = "You are a helpful AI assistant. Be concise and clear in your responses."


def _build_openai_model_and_settings(model: str) -> tuple[Any, ModelSettings | None]:
    """Build an OpenAIResponsesModel with web search and optional reasoning."""
    provider_config = provider_manager.get_provider_config("openai")
    has_custom_base = provider_config and provider_config.get("base_url")

    if has_custom_base:
        return f"openai:{model}", None

    from openai.types.responses import WebSearchToolParam
    from pydantic_ai.models.openai import OpenAIResponsesModel, OpenAIResponsesModelSettings

    model_instance = OpenAIResponsesModel(model)

    kwargs: dict[str, Any] = {
        "openai_builtin_tools": [WebSearchToolParam(type="web_search_preview")],
    }
    if any(model.startswith(p) for p in OPENAI_REASONING_MODELS):
        kwargs["openai_reasoning_effort"] = "high"
        kwargs["openai_reasoning_summary"] = "auto"

    return model_instance, OpenAIResponsesModelSettings(**kwargs)


def _get_thinking_settings(provider: str, model: str) -> ModelSettings | None:
    """Return model settings that enable thinking/reasoning for the given provider."""
    if provider == "anthropic":
        from pydantic_ai.models.anthropic import AnthropicModelSettings

        if "opus-4-6" in model or "opus-4-7" in model:
            return AnthropicModelSettings(
                anthropic_thinking={"type": "adaptive"},
            )
        return AnthropicModelSettings(
            anthropic_thinking={"type": "enabled", "budget_tokens": 10000},
        )

    if provider in ("gemini", "google"):
        from pydantic_ai.models.google import GoogleModelSettings

        return GoogleModelSettings(
            google_thinking_config={"include_thoughts": True},
        )

    if provider == "groq":
        from pydantic_ai.models.groq import GroqModelSettings

        return GroqModelSettings(groq_reasoning_format="parsed")

    if provider == "openrouter":
        from pydantic_ai.models.openrouter import OpenRouterModelSettings

        return OpenRouterModelSettings(openrouter_reasoning={"effort": "high"})

    return None


def create_agent(
    provider: str | None = None, model: str | None = None
) -> tuple[Agent, ModelSettings | None]:
    provider = provider or settings.default_model_provider
    model = model or settings.default_model_name
    provider_manager.configure_env(provider)

    if provider == "openai":
        model_ref, model_settings = _build_openai_model_and_settings(model)
    else:
        model_ref = provider_manager.get_model_string(provider, model)
        model_settings = _get_thinking_settings(provider, model)

    has_approval_tools = any(t.requires_confirmation for t in tool_registry.list_tools())
    output_type: list | str = [str, DeferredToolRequests] if has_approval_tools else str

    agent = Agent(model_ref, instructions=INSTRUCTIONS, output_type=output_type)

    for tool_def in tool_registry.list_tools():
        _register_tool_on_agent(agent, tool_def)

    return agent, model_settings


def _register_tool_on_agent(agent: Agent, tool_def):
    """Dynamically register a BaseTool as a pydantic-ai tool."""

    async def tool_fn(**kwargs) -> str:
        return await tool_def.execute(**kwargs)

    tool_fn.__name__ = tool_def.name
    tool_fn.__doc__ = tool_def.description

    exec_sig = inspect.signature(tool_def.execute)
    params = [
        p for p in exec_sig.parameters.values()
        if p.kind not in (inspect.Parameter.VAR_KEYWORD, inspect.Parameter.VAR_POSITIONAL)
    ]
    tool_fn.__signature__ = inspect.Signature(parameters=params, return_annotation=str)
    tool_fn.__annotations__ = {
        p.name: p.annotation for p in params if p.annotation is not inspect.Parameter.empty
    }
    tool_fn.__annotations__["return"] = str

    agent.tool_plain(
        name=tool_def.name,
        description=tool_def.description,
        requires_approval=tool_def.requires_confirmation,
    )(tool_fn)


async def agui_endpoint(request: Request) -> Response:
    """AG-UI endpoint — requires JWT auth via Authorization header."""
    from app.core.security import decode_token

    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        return JSONResponse({"detail": "Not authenticated"}, status_code=401)
    token = auth_header.removeprefix("Bearer ")
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        return JSONResponse({"detail": "Invalid token"}, status_code=401)

    agent, model_settings = create_agent()
    return await AGUIAdapter.dispatch_request(
        request, agent=agent, model_settings=model_settings,
    )
