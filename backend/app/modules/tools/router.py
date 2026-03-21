from fastapi import APIRouter, Depends

from app.agent.registry import tool_registry
from app.core.dependencies import get_current_user_id
from app.modules.tools.schemas import ToolSchema

router = APIRouter(prefix="/api/tools", tags=["tools"])


@router.get("/", response_model=list[ToolSchema])
async def list_tools(_user_id: str = Depends(get_current_user_id)):
    return [
        ToolSchema(
            name=t.name,
            description=t.description,
            requires_confirmation=t.requires_confirmation,
        )
        for t in tool_registry.list_tools()
    ]
