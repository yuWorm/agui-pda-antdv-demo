from pydantic import BaseModel


class ToolSchema(BaseModel):
    name: str
    description: str
    requires_confirmation: bool
