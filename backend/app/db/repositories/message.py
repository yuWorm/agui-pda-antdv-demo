from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.message import Message
from app.db.repositories.base import BaseRepository


class MessageRepository(BaseRepository[Message]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Message)

    async def create(
        self,
        *,
        session_id: str,
        role: str,
        content: str = "",
        tool_calls: dict | None = None,
        metadata_: dict | None = None,
    ) -> Message:
        next_order = await self._next_ordering(session_id)
        entity = Message(
            session_id=session_id,
            role=role,
            content=content,
            tool_calls=tool_calls,
            metadata_=metadata_,
            ordering=next_order,
        )
        return await self.add(entity)

    async def get_by_session(self, session_id: str) -> list[Message]:
        stmt = (
            select(Message)
            .where(Message.session_id == session_id)
            .order_by(Message.ordering.asc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def _next_ordering(self, session_id: str) -> int:
        stmt = select(func.coalesce(func.max(Message.ordering), 0)).where(
            Message.session_id == session_id
        )
        result = await self.session.execute(stmt)
        return (result.scalar() or 0) + 1
