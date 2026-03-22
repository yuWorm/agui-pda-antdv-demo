from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

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


class ToolExecuteRequest(BaseModel):
    name: str
    arguments: dict


class ToolExecuteResponse(BaseModel):
    result: str


@router.post("/execute", response_model=ToolExecuteResponse)
async def execute_tool(
    body: ToolExecuteRequest,
    _user_id: str = Depends(get_current_user_id),
):
    tool = tool_registry.get_tool(body.name)
    if not tool:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Tool '{body.name}' not found")
    try:
        result = await tool.execute(**body.arguments)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
    return ToolExecuteResponse(result=result)
