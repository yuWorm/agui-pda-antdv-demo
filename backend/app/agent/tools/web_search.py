import httpx

from app.agent.tools.base import BaseTool


class WebSearchTool(BaseTool):
    name = "web_search"
    description = "Search the web for information. Parameter: query (string)"
    requires_confirmation = True

    async def execute(self, *, query: str = "", **kwargs) -> str:
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(
                    "https://html.duckduckgo.com/html/",
                    params={"q": query},
                    headers={"User-Agent": "AGUIDemo/1.0"},
                )
                if resp.status_code == 200:
                    text = resp.text[:2000]
                    return f"Search results for '{query}':\n{text}"
                return f"Search failed: HTTP {resp.status_code}"
        except Exception as e:
            return f"Search failed: {e}"
