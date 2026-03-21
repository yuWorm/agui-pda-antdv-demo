from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_token
from app.db.base import get_async_session
from app.db.repositories import MessageRepository, SessionRepository, UserRepository

security_scheme = HTTPBearer()


async def get_user_repo(session: AsyncSession = Depends(get_async_session)) -> UserRepository:
    return UserRepository(session)


async def get_session_repo(session: AsyncSession = Depends(get_async_session)) -> SessionRepository:
    return SessionRepository(session)


async def get_message_repo(session: AsyncSession = Depends(get_async_session)) -> MessageRepository:
    return MessageRepository(session)


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
) -> str:
    payload = decode_token(credentials.credentials)
    if payload is None or payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return user_id
