from app.agent.tools.weather import WeatherTool
from app.agent.tools.web_search import WebSearchTool


def register_default_tools():
    from app.agent.registry import tool_registry

    tool_registry.register(WeatherTool())
    tool_registry.register(WebSearchTool())
