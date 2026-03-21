from fastapi import Request
from starlette.responses import JSONResponse, Response

from pydantic_ai import Agent, Tool
from pydantic_ai.ag_ui import AGUIAdapter

from app.agent.provider import provider_manager
from app.agent.registry import tool_registry
from app.core.config import settings


def create_agent(provider: str | None = None, model: str | None = None) -> Agent:
    provider = provider or settings.default_model_provider
    model = model or settings.default_model_name
    model_string = provider_manager.get_model_string(provider, model)
    provider_manager.configure_env(provider)

    agent = Agent(
        model_string,
        instructions="You are a helpful AI assistant. Be concise and clear in your responses.",
    )

    for tool_def in tool_registry.list_tools():
        _register_tool_on_agent(agent, tool_def)

    return agent


def _register_tool_on_agent(agent: Agent, tool_def):
    """Dynamically register a BaseTool as a pydantic-ai tool."""

    async def tool_fn(**kwargs) -> str:
        return await tool_def.execute(**kwargs)

    tool_fn.__name__ = tool_def.name
    tool_fn.__doc__ = tool_def.description

    agent.tools.append(
        Tool(function=tool_fn, takes_ctx=False, name=tool_def.name, description=tool_def.description)
    )


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

    agent = create_agent()
    return await AGUIAdapter.dispatch_request(request, agent=agent)
