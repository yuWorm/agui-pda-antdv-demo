from abc import ABC, abstractmethod


class BaseTool(ABC):
    name: str
    description: str
    requires_confirmation: bool = False

    @abstractmethod
    async def execute(self, **kwargs) -> str:
        ...

    def get_schema(self) -> dict:
        return {
            "name": self.name,
            "description": self.description,
            "requires_confirmation": self.requires_confirmation,
        }
