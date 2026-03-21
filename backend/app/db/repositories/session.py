from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.session import Session
from app.db.repositories.base import BaseRepository


class SessionRepository(BaseRepository[Session]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Session)

    async def create(
        self,
        *,
        user_id: str,
        title: str = "New Chat",
        model_provider: str = "openai",
        model_name: str = "gpt-4o",
    ) -> Session:
        entity = Session(
            user_id=user_id,
            title=title,
            model_provider=model_provider,
            model_name=model_name,
        )
        return await self.add(entity)

    async def get_by_user(self, user_id: str, *, include_archived: bool = False) -> list[Session]:
        stmt = select(Session).where(Session.user_id == user_id)
        if not include_archived:
            stmt = stmt.where(Session.is_archived == False)  # noqa: E712
        stmt = stmt.order_by(Session.updated_at.desc())
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
