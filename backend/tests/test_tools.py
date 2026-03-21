import pytest

from app.agent.registry import ToolRegistry
from app.agent.tools.base import BaseTool


class MockTool(BaseTool):
    name = "mock_tool"
    description = "A mock tool for testing"
    requires_confirmation = False

    async def execute(self, **kwargs) -> str:
        return f"mock result: {kwargs}"


def test_register_and_list_tools():
    registry = ToolRegistry()
    tool = MockTool()
    registry.register(tool)
    assert len(registry.list_tools()) == 1
    assert registry.get_tool("mock_tool") is tool


def test_unregister_tool():
    registry = ToolRegistry()
    tool = MockTool()
    registry.register(tool)
    registry.unregister("mock_tool")
    assert len(registry.list_tools()) == 0


@pytest.mark.asyncio
async def test_tool_execute():
    tool = MockTool()
    result = await tool.execute(city="Shanghai")
    assert "Shanghai" in result
