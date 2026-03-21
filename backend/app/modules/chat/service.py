from fastapi import HTTPException, status

from app.db.repositories.message import MessageRepository
from app.db.repositories.session import SessionRepository


class ChatService:
    def __init__(self, session_repo: SessionRepository, message_repo: MessageRepository):
        self.session_repo = session_repo
        self.message_repo = message_repo

    async def create_session(
        self, user_id: str, title: str, model_provider: str, model_name: str
    ):
        session = await self.session_repo.create(
            user_id=user_id, title=title, model_provider=model_provider, model_name=model_name,
        )
        await self.session_repo.commit()
        return session

    async def get_sessions(self, user_id: str):
        return await self.session_repo.get_by_user(user_id)

    async def get_session(self, session_id: str, user_id: str):
        session = await self.session_repo.get_by_id(session_id)
        if not session or session.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
        return session

    async def update_session(self, session_id: str, user_id: str, **kwargs):
        session = await self.get_session(session_id, user_id)
        for key, value in kwargs.items():
            if value is not None:
                setattr(session, key, value)
        await self.session_repo.commit()
        return session

    async def delete_session(self, session_id: str, user_id: str):
        session = await self.get_session(session_id, user_id)
        await self.session_repo.delete(session)
        await self.session_repo.commit()

    async def get_messages(self, session_id: str, user_id: str):
        await self.get_session(session_id, user_id)
        return await self.message_repo.get_by_session(session_id)

    async def add_message(self, session_id: str, user_id: str, role: str, content: str, **kwargs):
        await self.get_session(session_id, user_id)
        message = await self.message_repo.create(
            session_id=session_id, role=role, content=content, **kwargs,
        )
        await self.message_repo.commit()
        return message
