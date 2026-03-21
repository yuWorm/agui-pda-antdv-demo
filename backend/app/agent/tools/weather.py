import httpx

from app.agent.tools.base import BaseTool


class WeatherTool(BaseTool):
    name = "weather_query"
    description = "Query current weather for a city. Parameter: city (string)"
    requires_confirmation = True

    async def execute(self, *, city: str = "Beijing", **kwargs) -> str:
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(
                    "https://wttr.in",
                    params={"q": city, "format": "j1"},
                    headers={"Accept": "application/json"},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    current = data.get("current_condition", [{}])[0]
                    return (
                        f"Weather in {city}: "
                        f"{current.get('weatherDesc', [{}])[0].get('value', 'N/A')}, "
                        f"Temperature: {current.get('temp_C', 'N/A')}°C, "
                        f"Humidity: {current.get('humidity', 'N/A')}%, "
                        f"Wind: {current.get('windspeedKmph', 'N/A')} km/h"
                    )
                return f"Failed to get weather for {city}: HTTP {resp.status_code}"
        except Exception as e:
            return f"Weather query failed: {e}"
