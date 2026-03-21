import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.db.base import Base
from app.db.models import User
from app.db.repositories.user import UserRepository

TEST_DB_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture
async def db_session():
    engine = create_async_engine(TEST_DB_URL)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as session:
        yield session
    await engine.dispose()


@pytest.mark.asyncio
async def test_user_repository_create_and_get(db_session: AsyncSession):
    repo = UserRepository(db_session)
    user = await repo.create(username="testuser", hashed_password="hashed", display_name="Test")
    assert user.username == "testuser"
    fetched = await repo.get_by_id(user.id)
    assert fetched is not None
    assert fetched.username == "testuser"


@pytest.mark.asyncio
async def test_user_repository_get_by_username(db_session: AsyncSession):
    repo = UserRepository(db_session)
    await repo.create(username="alice", hashed_password="hashed", display_name="Alice")
    user = await repo.get_by_username("alice")
    assert user is not None
    assert user.display_name == "Alice"
    assert await repo.get_by_username("nonexistent") is None
