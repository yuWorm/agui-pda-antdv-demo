from fastapi import APIRouter, Depends

from app.core.dependencies import get_current_user_id, get_message_repo, get_session_repo
from app.db.repositories.message import MessageRepository
from app.db.repositories.session import SessionRepository
from pydantic import BaseModel as BaseModel
from app.modules.chat.schemas import (
    GenerateTitleResponse,
    MessageResponse,
    SessionCreate,
    SessionResponse,
    SessionUpdate,
)
from app.modules.chat.service import ChatService

router = APIRouter(prefix="/api/chat", tags=["chat"])


def get_chat_service(
    session_repo: SessionRepository = Depends(get_session_repo),
    message_repo: MessageRepository = Depends(get_message_repo),
) -> ChatService:
    return ChatService(session_repo, message_repo)


@router.post("/sessions", response_model=SessionResponse)
async def create_session(
    body: SessionCreate,
    user_id: str = Depends(get_current_user_id),
    service: ChatService = Depends(get_chat_service),
):
    session = await service.create_session(user_id, body.title, body.model_provider, body.model_name)
    return _session_response(session)


@router.get("/sessions", response_model=list[SessionResponse])
async def list_sessions(
    user_id: str = Depends(get_current_user_id),
    service: ChatService = Depends(get_chat_service),
):
    sessions = await service.get_sessions(user_id)
    return [_session_response(s) for s in sessions]


@router.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: str,
    user_id: str = Depends(get_current_user_id),
    service: ChatService = Depends(get_chat_service),
):
    session = await service.get_session(session_id, user_id)
    return _session_response(session)


@router.patch("/sessions/{session_id}", response_model=SessionResponse)
async def update_session(
    session_id: str,
    body: SessionUpdate,
    user_id: str = Depends(get_current_user_id),
    service: ChatService = Depends(get_chat_service),
):
    session = await service.update_session(session_id, user_id, **body.model_dump(exclude_unset=True))
    return _session_response(session)


@router.post("/sessions/{session_id}/generate-title", response_model=GenerateTitleResponse)
async def generate_title(
    session_id: str,
    user_id: str = Depends(get_current_user_id),
    service: ChatService = Depends(get_chat_service),
):
    title = await service.generate_title(session_id, user_id)
    return GenerateTitleResponse(title=title)


@router.delete("/sessions/{session_id}", status_code=204)
async def delete_session(
    session_id: str,
    user_id: str = Depends(get_current_user_id),
    service: ChatService = Depends(get_chat_service),
):
    await service.delete_session(session_id, user_id)


@router.get("/sessions/{session_id}/messages", response_model=list[MessageResponse])
async def get_messages(
    session_id: str,
    user_id: str = Depends(get_current_user_id),
    service: ChatService = Depends(get_chat_service),
):
    messages = await service.get_messages(session_id, user_id)
    return [_message_response(m) for m in messages]


class MessageCreate(BaseModel):
    role: str
    content: str
    tool_calls: list | dict | None = None
    attachments: list | None = None


@router.post("/sessions/{session_id}/messages", response_model=MessageResponse)
async def create_message(
    session_id: str,
    body: MessageCreate,
    user_id: str = Depends(get_current_user_id),
    service: ChatService = Depends(get_chat_service),
):
    msg = await service.add_message(
        session_id, user_id, body.role, body.content,
        tool_calls=body.tool_calls, attachments=body.attachments,
    )
    return _message_response(msg)


def _session_response(session) -> SessionResponse:
    return SessionResponse(
        id=session.id,
        title=session.title,
        model_provider=session.model_provider,
        model_name=session.model_name,
        is_archived=session.is_archived,
        created_at=session.created_at.isoformat(),
        updated_at=session.updated_at.isoformat(),
    )


def _message_response(message) -> MessageResponse:
    return MessageResponse(
        id=message.id,
        session_id=message.session_id,
        role=message.role,
        content=message.content,
        tool_calls=message.tool_calls,
        attachments=message.attachments,
        metadata_=message.metadata_,
        ordering=message.ordering,
        created_at=message.created_at.isoformat(),
    )
