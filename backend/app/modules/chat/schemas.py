from pydantic import BaseModel


class SessionCreate(BaseModel):
    title: str = "New Chat"
    model_provider: str = "openai"
    model_name: str = "gpt-4o"


class SessionUpdate(BaseModel):
    title: str | None = None
    is_archived: bool | None = None


class SessionResponse(BaseModel):
    id: str
    title: str
    model_provider: str
    model_name: str
    is_archived: bool
    created_at: str
    updated_at: str


class MessageResponse(BaseModel):
    id: str
    session_id: str
    role: str
    content: str
    tool_calls: dict | None
    metadata_: dict | None
    ordering: int
    created_at: str
