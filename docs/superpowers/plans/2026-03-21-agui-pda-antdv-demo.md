# AG-UI + pydantic-ai + antdv-next Agent Demo Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-quality Agent interaction prototype with chat, session management, tool calling, and multiple presentation modes using pydantic-ai, AG-UI protocol, and antdv-next.

**Architecture:** Monorepo with `backend/` (FastAPI + pydantic-ai + SQLAlchemy) and `frontend/` (Vue 3 + antdv-next + Pinia). Frontend communicates with backend via AG-UI protocol over SSE. AG-UI TypeScript SDK (`@ag-ui/client` HttpAgent) handles protocol parsing; Vue composables adapt it to reactive state.

**Tech Stack:** Python/FastAPI/pydantic-ai/SQLAlchemy/uv (backend), Bun/Vue3/TypeScript/Vite/antdv-next/Pinia/markstream-vue (frontend), AG-UI protocol (communication)

---

## Chunk 0: Repository Init

### Task 0: Initialize Git Repository

- [ ] **Step 1: Initialize git repo and create .gitignore**

```bash
cd /Volumes/WorkSpace/Projects/Idea/agui-pda-antdv-demo
git init
```

Write `.gitignore`:

```
node_modules/
dist/
.env
*.db
__pycache__/
.pytest_cache/
.ruff_cache/
.venv/
data/
.superpowers/
```

- [ ] **Step 2: Initial commit**

```bash
git add .gitignore IDEA.md docs/
git commit -m "chore: initial project setup with IDEA and design docs"
```

---

## Chunk 1: Backend Foundation

### Task 1: Backend Project Scaffolding

**Files:**
- Create: `backend/pyproject.toml` (via `uv init`, then modify)
- Create: `backend/app/__init__.py`
- Create: `backend/app/main.py`

- [ ] **Step 1: Initialize backend project with uv**

```bash
cd /Volumes/WorkSpace/Projects/Idea/agui-pda-antdv-demo
mkdir -p backend
cd backend
uv init --name agui-demo-backend --python 3.12
```

- [ ] **Step 2: Add dependencies**

```bash
cd /Volumes/WorkSpace/Projects/Idea/agui-pda-antdv-demo/backend
uv add fastapi uvicorn[standard] sqlalchemy[asyncio] aiosqlite alembic \
  pydantic-ai-slim[ag-ui] pyjwt[crypto] bcrypt httpx \
  pydantic-settings python-multipart
uv add --dev pytest pytest-asyncio pytest-httpx ruff
```

- [ ] **Step 3: Create directory structure**

```bash
cd /Volumes/WorkSpace/Projects/Idea/agui-pda-antdv-demo/backend
mkdir -p app/{core,db/{repositories,models},modules/{auth,chat,tools},agent/tools}
touch app/__init__.py app/core/__init__.py app/db/__init__.py \
  app/db/repositories/__init__.py app/db/models/__init__.py \
  app/modules/__init__.py app/modules/auth/__init__.py \
  app/modules/chat/__init__.py app/modules/tools/__init__.py \
  app/agent/__init__.py app/agent/tools/__init__.py
mkdir -p tests
touch tests/__init__.py
```

- [ ] **Step 4: Create minimal FastAPI entry point**

Write `backend/app/main.py`:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="AG-UI Demo", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {"status": "ok"}
```

- [ ] **Step 5: Verify server starts**

```bash
cd /Volumes/WorkSpace/Projects/Idea/agui-pda-antdv-demo/backend
uv run uvicorn app.main:app --reload --port 8000
```

Expected: Server starts, `GET http://localhost:8000/health` returns `{"status":"ok"}`

- [ ] **Step 6: Commit**

```bash
git add backend/
git commit -m "feat: scaffold backend project with FastAPI and uv"
```

---

### Task 2: Core Configuration

**Files:**
- Create: `backend/app/core/config.py`
- Create: `backend/.env.example`

- [ ] **Step 1: Write config module**

Write `backend/app/core/config.py`:

```python
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "AG-UI Demo"
    debug: bool = False

    # Database
    database_url: str = "sqlite+aiosqlite:///./data/agui_demo.db"

    # JWT
    jwt_secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # CORS
    cors_origins: list[str] = ["http://localhost:5173"]

    # Default model provider
    default_model_provider: str = "openai"
    default_model_name: str = "gpt-4o"

    # Model provider configs (JSON string, parsed at runtime)
    # Format: {"openai": {"api_key": "sk-...", "base_url": null}, "deepseek": {"api_key": "sk-...", "base_url": "https://api.deepseek.com/v1"}}
    model_providers_json: str = "{}"

    @property
    def db_path(self) -> Path:
        url = self.database_url.replace("sqlite+aiosqlite:///", "")
        return Path(url).parent


settings = Settings()
```

- [ ] **Step 2: Create .env.example**

Write `backend/.env.example`:

```env
DEBUG=true
DATABASE_URL=sqlite+aiosqlite:///./data/agui_demo.db
JWT_SECRET_KEY=change-me-in-production
DEFAULT_MODEL_PROVIDER=openai
DEFAULT_MODEL_NAME=gpt-4o
MODEL_PROVIDERS_JSON={"openai": {"api_key": "sk-xxx", "base_url": null}}
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/core/config.py backend/.env.example
git commit -m "feat: add core configuration with pydantic-settings"
```

---

### Task 3: Database Setup & Models

**Files:**
- Create: `backend/app/db/base.py`
- Create: `backend/app/db/models/user.py`
- Create: `backend/app/db/models/session.py`
- Create: `backend/app/db/models/message.py`

- [ ] **Step 1: Write database engine & session factory**

Write `backend/app/db/base.py`:

```python
import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, String, func
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from app.core.config import settings

engine = create_async_engine(settings.database_url, echo=settings.debug)
async_session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
    )


class UUIDPrimaryKey:
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )


async def get_async_session():
    async with async_session_factory() as session:
        yield session


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
```

- [ ] **Step 2: Write User model**

Write `backend/app/db/models/user.py`:

```python
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKey


class User(Base, UUIDPrimaryKey, TimestampMixin):
    __tablename__ = "users"

    username: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(256))
    display_name: Mapped[str] = mapped_column(String(128), default="")

    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")
```

- [ ] **Step 3: Write Session model**

Write `backend/app/db/models/session.py`:

```python
from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKey


class Session(Base, UUIDPrimaryKey, TimestampMixin):
    __tablename__ = "sessions"

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(256), default="New Chat")
    model_provider: Mapped[str] = mapped_column(String(64), default="openai")
    model_name: Mapped[str] = mapped_column(String(128), default="gpt-4o")
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False)

    user = relationship("User", back_populates="sessions")
    messages = relationship("Message", back_populates="session", cascade="all, delete-orphan")
```

- [ ] **Step 4: Write Message model**

Write `backend/app/db/models/message.py`:

```python
from sqlalchemy import ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKey


class Message(Base, UUIDPrimaryKey, TimestampMixin):
    __tablename__ = "messages"

    session_id: Mapped[str] = mapped_column(String(36), ForeignKey("sessions.id"), index=True)
    role: Mapped[str] = mapped_column(String(16))  # user, assistant, system, tool
    content: Mapped[str] = mapped_column(Text, default="")
    tool_calls: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSON, nullable=True)
    ordering: Mapped[int] = mapped_column(Integer, default=0)

    session = relationship("Session", back_populates="messages")
```

- [ ] **Step 5: Register models and wire up db init**

Update `backend/app/db/models/__init__.py`:

```python
from app.db.models.message import Message
from app.db.models.session import Session
from app.db.models.user import User

__all__ = ["User", "Session", "Message"]
```

Update `backend/app/main.py` to add startup event:

```python
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.base import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="AG-UI Demo", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {"status": "ok"}
```

- [ ] **Step 6: Verify database creates on startup**

```bash
cd /Volumes/WorkSpace/Projects/Idea/agui-pda-antdv-demo/backend
mkdir -p data
uv run uvicorn app.main:app --reload --port 8000
```

Expected: Server starts, `data/agui_demo.db` is created with tables.

- [ ] **Step 7: Commit**

```bash
git add backend/app/db/ backend/app/main.py
git commit -m "feat: add database models (User, Session, Message) with SQLAlchemy"
```

---

### Task 4: Repository Layer

**Files:**
- Create: `backend/app/db/repositories/base.py`
- Create: `backend/app/db/repositories/user.py`
- Create: `backend/app/db/repositories/session.py`
- Create: `backend/app/db/repositories/message.py`
- Create: `backend/tests/test_repositories.py`

- [ ] **Step 1: Write test for base repository pattern**

Write `backend/tests/test_repositories.py`:

```python
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Volumes/WorkSpace/Projects/Idea/agui-pda-antdv-demo/backend
uv run pytest tests/test_repositories.py -v
```

Expected: FAIL — `UserRepository` not found.

- [ ] **Step 3: Write BaseRepository**

Write `backend/app/db/repositories/base.py`:

```python
from typing import Generic, TypeVar

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import Base

T = TypeVar("T", bound=Base)


class BaseRepository(Generic[T]):
    def __init__(self, session: AsyncSession, model_class: type[T]):
        self.session = session
        self.model_class = model_class

    async def get_by_id(self, entity_id: str) -> T | None:
        return await self.session.get(self.model_class, entity_id)

    async def get_all(self, *, limit: int = 100, offset: int = 0) -> list[T]:
        stmt = select(self.model_class).limit(limit).offset(offset)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def add(self, entity: T) -> T:
        self.session.add(entity)
        await self.session.flush()
        await self.session.refresh(entity)
        return entity

    async def delete(self, entity: T) -> None:
        await self.session.delete(entity)
        await self.session.flush()

    async def commit(self) -> None:
        await self.session.commit()
```

- [ ] **Step 4: Write UserRepository**

Write `backend/app/db/repositories/user.py`:

```python
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.user import User
from app.db.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, User)

    async def create(self, *, username: str, hashed_password: str, display_name: str = "") -> User:
        user = User(username=username, hashed_password=hashed_password, display_name=display_name)
        return await self.add(user)

    async def get_by_username(self, username: str) -> User | None:
        stmt = select(User).where(User.username == username)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd /Volumes/WorkSpace/Projects/Idea/agui-pda-antdv-demo/backend
uv run pytest tests/test_repositories.py -v
```

Expected: PASS

- [ ] **Step 6: Write SessionRepository**

Write `backend/app/db/repositories/session.py`:

```python
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
```

- [ ] **Step 7: Write MessageRepository**

Write `backend/app/db/repositories/message.py`:

```python
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
```

- [ ] **Step 8: Update repositories __init__**

Write `backend/app/db/repositories/__init__.py`:

```python
from app.db.repositories.message import MessageRepository
from app.db.repositories.session import SessionRepository
from app.db.repositories.user import UserRepository

__all__ = ["UserRepository", "SessionRepository", "MessageRepository"]
```

- [ ] **Step 9: Run all tests**

```bash
cd /Volumes/WorkSpace/Projects/Idea/agui-pda-antdv-demo/backend
uv run pytest tests/ -v
```

Expected: All tests PASS.

- [ ] **Step 10: Commit**

```bash
git add backend/app/db/repositories/ backend/tests/
git commit -m "feat: add repository layer (User, Session, Message) with base pattern"
```

---

## Chunk 2: Backend Auth, Chat & Security

### Task 5: Security Utilities

**Files:**
- Create: `backend/app/core/security.py`
- Create: `backend/tests/test_security.py`

- [ ] **Step 1: Write test for security utilities**

Write `backend/tests/test_security.py`:

```python
from app.core.security import create_access_token, create_refresh_token, decode_token, hash_password, verify_password


def test_password_hash_and_verify():
    hashed = hash_password("mysecretpassword")
    assert verify_password("mysecretpassword", hashed)
    assert not verify_password("wrongpassword", hashed)


def test_create_and_decode_access_token():
    token = create_access_token(user_id="user-123")
    payload = decode_token(token)
    assert payload is not None
    assert payload["sub"] == "user-123"
    assert payload["type"] == "access"


def test_create_and_decode_refresh_token():
    token = create_refresh_token(user_id="user-456")
    payload = decode_token(token)
    assert payload is not None
    assert payload["sub"] == "user-456"
    assert payload["type"] == "refresh"
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Volumes/WorkSpace/Projects/Idea/agui-pda-antdv-demo/backend
uv run pytest tests/test_security.py -v
```

Expected: FAIL

- [ ] **Step 3: Implement security module**

Write `backend/app/core/security.py`:

```python
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from app.core.config import settings


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"sub": user_id, "exp": expire, "type": "access"}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def create_refresh_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
    payload = {"sub": user_id, "exp": expire, "type": "refresh"}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    except jwt.PyJWTError:
        return None
```

- [ ] **Step 4: Run tests**

```bash
uv run pytest tests/test_security.py -v
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/core/security.py backend/tests/test_security.py
git commit -m "feat: add JWT and password hashing security utilities"
```

---

### Task 6: FastAPI Dependencies

**Files:**
- Create: `backend/app/core/dependencies.py`

- [ ] **Step 1: Write dependencies module**

Write `backend/app/core/dependencies.py`:

```python
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
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/core/dependencies.py
git commit -m "feat: add FastAPI dependency injection (auth, repositories)"
```

---

### Task 7: Auth Module

**Files:**
- Create: `backend/app/modules/auth/schemas.py`
- Create: `backend/app/modules/auth/service.py`
- Create: `backend/app/modules/auth/router.py`
- Modify: `backend/app/main.py` (register router)

- [ ] **Step 1: Write auth schemas**

Write `backend/app/modules/auth/schemas.py`:

```python
from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=64)
    password: str = Field(min_length=6, max_length=128)
    display_name: str = Field(default="", max_length=128)


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: str
    username: str
    display_name: str
```

- [ ] **Step 2: Write auth service**

Write `backend/app/modules/auth/service.py`:

```python
from fastapi import HTTPException, status

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.db.repositories.user import UserRepository
from app.modules.auth.schemas import TokenResponse


class AuthService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def register(self, username: str, password: str, display_name: str = "") -> TokenResponse:
        existing = await self.user_repo.get_by_username(username)
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already exists")
        hashed = hash_password(password)
        user = await self.user_repo.create(
            username=username, hashed_password=hashed, display_name=display_name or username,
        )
        await self.user_repo.commit()
        return TokenResponse(
            access_token=create_access_token(user.id),
            refresh_token=create_refresh_token(user.id),
        )

    async def login(self, username: str, password: str) -> TokenResponse:
        user = await self.user_repo.get_by_username(username)
        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        return TokenResponse(
            access_token=create_access_token(user.id),
            refresh_token=create_refresh_token(user.id),
        )

    async def refresh(self, refresh_token: str) -> TokenResponse:
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
        user_id = payload["sub"]
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        return TokenResponse(
            access_token=create_access_token(user.id),
            refresh_token=create_refresh_token(user.id),
        )

    async def get_user(self, user_id: str):
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return user
```

- [ ] **Step 3: Write auth router**

Write `backend/app/modules/auth/router.py`:

```python
from fastapi import APIRouter, Depends

from app.core.dependencies import get_current_user_id, get_user_repo
from app.db.repositories.user import UserRepository
from app.modules.auth.schemas import (
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.modules.auth.service import AuthService

router = APIRouter(prefix="/api/auth", tags=["auth"])


def get_auth_service(user_repo: UserRepository = Depends(get_user_repo)) -> AuthService:
    return AuthService(user_repo)


@router.post("/register", response_model=TokenResponse)
async def register(body: RegisterRequest, service: AuthService = Depends(get_auth_service)):
    return await service.register(body.username, body.password, body.display_name)


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, service: AuthService = Depends(get_auth_service)):
    return await service.login(body.username, body.password)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(body: RefreshRequest, service: AuthService = Depends(get_auth_service)):
    return await service.refresh(body.refresh_token)


@router.get("/me", response_model=UserResponse)
async def get_me(
    user_id: str = Depends(get_current_user_id),
    service: AuthService = Depends(get_auth_service),
):
    user = await service.get_user(user_id)
    return UserResponse(id=user.id, username=user.username, display_name=user.display_name)
```

- [ ] **Step 4: Register auth router in main.py**

Add to `backend/app/main.py` after the `app` definition:

```python
from app.modules.auth.router import router as auth_router

app.include_router(auth_router)
```

- [ ] **Step 5: Verify auth endpoints**

```bash
cd /Volumes/WorkSpace/Projects/Idea/agui-pda-antdv-demo/backend
uv run uvicorn app.main:app --reload --port 8000
# In another terminal:
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test123456"}'
```

Expected: Returns `{"access_token":"...","refresh_token":"...","token_type":"bearer"}`

- [ ] **Step 6: Commit**

```bash
git add backend/app/modules/auth/ backend/app/main.py
git commit -m "feat: add auth module (register, login, refresh, me)"
```

---

### Task 8: Chat Module

**Files:**
- Create: `backend/app/modules/chat/schemas.py`
- Create: `backend/app/modules/chat/service.py`
- Create: `backend/app/modules/chat/router.py`
- Modify: `backend/app/main.py` (register router)

- [ ] **Step 1: Write chat schemas**

Write `backend/app/modules/chat/schemas.py`:

```python
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
```

- [ ] **Step 2: Write chat service**

Write `backend/app/modules/chat/service.py`:

```python
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
```

- [ ] **Step 3: Write chat router**

Write `backend/app/modules/chat/router.py`:

```python
from fastapi import APIRouter, Depends

from app.core.dependencies import get_current_user_id, get_message_repo, get_session_repo
from app.db.repositories.message import MessageRepository
from app.db.repositories.session import SessionRepository
from pydantic import BaseModel as BaseModel
from app.modules.chat.schemas import (
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
    tool_calls: dict | None = None


@router.post("/sessions/{session_id}/messages", response_model=MessageResponse)
async def create_message(
    session_id: str,
    body: MessageCreate,
    user_id: str = Depends(get_current_user_id),
    service: ChatService = Depends(get_chat_service),
):
    msg = await service.add_message(session_id, user_id, body.role, body.content, tool_calls=body.tool_calls)
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
        metadata_=message.metadata_,
        ordering=message.ordering,
        created_at=message.created_at.isoformat(),
    )
```

- [ ] **Step 4: Register chat router in main.py**

Add to `backend/app/main.py`:

```python
from app.modules.chat.router import router as chat_router

app.include_router(chat_router)
```

- [ ] **Step 5: Verify chat endpoints**

```bash
uv run uvicorn app.main:app --reload --port 8000
```

Test creating a session with the access token from earlier registration.

- [ ] **Step 6: Commit**

```bash
git add backend/app/modules/chat/ backend/app/main.py
git commit -m "feat: add chat module (session CRUD, message history)"
```

---

## Chunk 3: Backend Agent, Tools & AG-UI Integration

### Task 9: Tools Module (API for listing tools)

**Files:**
- Create: `backend/app/modules/tools/router.py`
- Create: `backend/app/modules/tools/schemas.py`
- Modify: `backend/app/main.py` (register router)

Note: `core/middleware.py` from the spec is not needed as a separate file — CORS is configured directly in `main.py`, and auth is handled via FastAPI dependencies. The spec's Alembic entry is deferred: this prototype uses `Base.metadata.create_all()` for simplicity. Add Alembic when schema migrations become necessary.

- [ ] **Step 1: Write tools schemas**

Write `backend/app/modules/tools/schemas.py`:

```python
from pydantic import BaseModel


class ToolSchema(BaseModel):
    name: str
    description: str
    requires_confirmation: bool
```

- [ ] **Step 2: Write tools router**

Write `backend/app/modules/tools/router.py`:

```python
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
```

- [ ] **Step 3: Register tools router in main.py**

Add to `backend/app/main.py`:

```python
from app.modules.tools.router import router as tools_router

app.include_router(tools_router)
```

- [ ] **Step 4: Commit**

```bash
git add backend/app/modules/tools/ backend/app/main.py
git commit -m "feat: add tools module with list endpoint"
```

---

### Task 10: Model Provider Abstraction (was Task 9)

**Files:**
- Create: `backend/app/agent/provider.py`
- Create: `backend/tests/test_provider.py`

- [ ] **Step 1: Write test**

Write `backend/tests/test_provider.py`:

```python
from app.agent.provider import ModelProviderManager


def test_get_default_provider():
    manager = ModelProviderManager()
    model_str = manager.get_model_string("openai", "gpt-4o")
    assert model_str == "openai:gpt-4o"


def test_get_provider_with_custom_base_url():
    manager = ModelProviderManager()
    manager.register_provider("deepseek", api_key="sk-test", base_url="https://api.deepseek.com/v1")
    config = manager.get_provider_config("deepseek")
    assert config is not None
    assert config["base_url"] == "https://api.deepseek.com/v1"
```

- [ ] **Step 2: Run test to verify it fails**

```bash
uv run pytest tests/test_provider.py -v
```

Expected: FAIL

- [ ] **Step 3: Implement model provider manager**

Write `backend/app/agent/provider.py`:

```python
import json
import os
from dataclasses import dataclass, field

from app.core.config import settings


@dataclass
class ProviderConfig:
    api_key: str
    base_url: str | None = None


class ModelProviderManager:
    def __init__(self):
        self._providers: dict[str, ProviderConfig] = {}
        self._load_from_config()

    def _load_from_config(self):
        try:
            providers_data = json.loads(settings.model_providers_json)
            for name, config in providers_data.items():
                self._providers[name] = ProviderConfig(
                    api_key=config.get("api_key", ""),
                    base_url=config.get("base_url"),
                )
        except (json.JSONDecodeError, AttributeError):
            pass

    def register_provider(self, name: str, api_key: str, base_url: str | None = None):
        self._providers[name] = ProviderConfig(api_key=api_key, base_url=base_url)

    def get_provider_config(self, name: str) -> dict | None:
        config = self._providers.get(name)
        if not config:
            return None
        return {"api_key": config.api_key, "base_url": config.base_url}

    def get_model_string(self, provider: str, model: str) -> str:
        return f"{provider}:{model}"

    def configure_env(self, provider: str):
        """Set environment variables for pydantic-ai model provider."""
        config = self._providers.get(provider)
        if not config:
            return
        env_map = {
            "openai": "OPENAI_API_KEY",
            "anthropic": "ANTHROPIC_API_KEY",
            "gemini": "GEMINI_API_KEY",
        }
        env_key = env_map.get(provider, f"{provider.upper()}_API_KEY")
        os.environ[env_key] = config.api_key
        if config.base_url:
            os.environ[f"{provider.upper()}_BASE_URL"] = config.base_url

    def list_providers(self) -> list[dict]:
        return [
            {"name": name, "has_base_url": config.base_url is not None}
            for name, config in self._providers.items()
        ]


provider_manager = ModelProviderManager()
```

- [ ] **Step 4: Run tests**

```bash
uv run pytest tests/test_provider.py -v
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/agent/provider.py backend/tests/test_provider.py
git commit -m "feat: add model provider manager with multi-provider support"
```

---

### Task 10: Tool Registry & Demo Tools

**Files:**
- Create: `backend/app/agent/tools/base.py`
- Create: `backend/app/agent/registry.py`
- Create: `backend/app/agent/tools/weather.py`
- Create: `backend/app/agent/tools/web_search.py`
- Create: `backend/tests/test_tools.py`

- [ ] **Step 1: Write test for tool registry**

Write `backend/tests/test_tools.py`:

```python
import pytest

from app.agent.registry import ToolRegistry
from app.agent.tools.base import BaseTool


class MockTool(BaseTool):
    name = "mock_tool"
    description = "A mock tool for testing"
    requires_confirmation = False

    async def execute(self, **kwargs) -> str:
        return f"mock result: {kwargs}"


def test_register_and_list_tools():
    registry = ToolRegistry()
    tool = MockTool()
    registry.register(tool)
    assert len(registry.list_tools()) == 1
    assert registry.get_tool("mock_tool") is tool


def test_unregister_tool():
    registry = ToolRegistry()
    tool = MockTool()
    registry.register(tool)
    registry.unregister("mock_tool")
    assert len(registry.list_tools()) == 0


@pytest.mark.asyncio
async def test_tool_execute():
    tool = MockTool()
    result = await tool.execute(city="Shanghai")
    assert "Shanghai" in result
```

- [ ] **Step 2: Run tests — should fail**

```bash
uv run pytest tests/test_tools.py -v
```

- [ ] **Step 3: Implement BaseTool**

Write `backend/app/agent/tools/base.py`:

```python
from abc import ABC, abstractmethod


class BaseTool(ABC):
    name: str
    description: str
    requires_confirmation: bool = False

    @abstractmethod
    async def execute(self, **kwargs) -> str:
        ...

    def get_schema(self) -> dict:
        return {
            "name": self.name,
            "description": self.description,
            "requires_confirmation": self.requires_confirmation,
        }
```

- [ ] **Step 4: Implement ToolRegistry**

Write `backend/app/agent/registry.py`:

```python
from app.agent.tools.base import BaseTool


class ToolRegistry:
    def __init__(self):
        self._tools: dict[str, BaseTool] = {}

    def register(self, tool: BaseTool):
        self._tools[tool.name] = tool

    def unregister(self, name: str):
        self._tools.pop(name, None)

    def get_tool(self, name: str) -> BaseTool | None:
        return self._tools.get(name)

    def list_tools(self) -> list[BaseTool]:
        return list(self._tools.values())

    def list_schemas(self) -> list[dict]:
        return [tool.get_schema() for tool in self._tools.values()]


tool_registry = ToolRegistry()
```

- [ ] **Step 5: Run tests — should pass**

```bash
uv run pytest tests/test_tools.py -v
```

- [ ] **Step 6: Implement weather tool**

Write `backend/app/agent/tools/weather.py`:

```python
import httpx

from app.agent.tools.base import BaseTool


class WeatherTool(BaseTool):
    name = "weather_query"
    description = "Query current weather for a city. Parameter: city (string)"
    requires_confirmation = True

    async def execute(self, *, city: str = "Beijing", **kwargs) -> str:
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(
                    "https://wttr.in",
                    params={"q": city, "format": "j1"},
                    headers={"Accept": "application/json"},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    current = data.get("current_condition", [{}])[0]
                    return (
                        f"Weather in {city}: "
                        f"{current.get('weatherDesc', [{}])[0].get('value', 'N/A')}, "
                        f"Temperature: {current.get('temp_C', 'N/A')}°C, "
                        f"Humidity: {current.get('humidity', 'N/A')}%, "
                        f"Wind: {current.get('windspeedKmph', 'N/A')} km/h"
                    )
                return f"Failed to get weather for {city}: HTTP {resp.status_code}"
        except Exception as e:
            return f"Weather query failed: {e}"
```

- [ ] **Step 7: Implement web search tool**

Write `backend/app/agent/tools/web_search.py`:

```python
import httpx

from app.agent.tools.base import BaseTool


class WebSearchTool(BaseTool):
    name = "web_search"
    description = "Search the web for information. Parameter: query (string)"
    requires_confirmation = True

    async def execute(self, *, query: str = "", **kwargs) -> str:
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(
                    "https://html.duckduckgo.com/html/",
                    params={"q": query},
                    headers={"User-Agent": "AGUIDemo/1.0"},
                )
                if resp.status_code == 200:
                    text = resp.text[:2000]
                    return f"Search results for '{query}':\n{text}"
                return f"Search failed: HTTP {resp.status_code}"
        except Exception as e:
            return f"Search failed: {e}"
```

- [ ] **Step 8: Register demo tools**

Update `backend/app/agent/tools/__init__.py`:

```python
from app.agent.registry import tool_registry
from app.agent.tools.weather import WeatherTool
from app.agent.tools.web_search import WebSearchTool


def register_default_tools():
    tool_registry.register(WeatherTool())
    tool_registry.register(WebSearchTool())
```

- [ ] **Step 9: Commit**

```bash
git add backend/app/agent/ backend/tests/test_tools.py
git commit -m "feat: add tool registry with weather and web search demo tools"
```

---

### Task 11: pydantic-ai Agent & AG-UI Endpoint

**Files:**
- Create: `backend/app/agent/setup.py`
- Modify: `backend/app/main.py` (register AG-UI route + tool init)

- [ ] **Step 1: Implement agent setup with AG-UI adapter**

Write `backend/app/agent/setup.py`:

```python
from fastapi import Depends, Request
from starlette.responses import Response

from pydantic_ai import Agent, RunContext, Tool
from pydantic_ai.ui.ag_ui import AGUIAdapter

from app.agent.provider import provider_manager
from app.agent.registry import tool_registry
from app.core.config import settings
from app.core.dependencies import get_current_user_id


def create_agent(provider: str | None = None, model: str | None = None) -> Agent:
    provider = provider or settings.default_model_provider
    model = model or settings.default_model_name
    model_string = provider_manager.get_model_string(provider, model)
    provider_manager.configure_env(provider)

    agent = Agent(
        model_string,
        instructions="You are a helpful AI assistant. Be concise and clear in your responses.",
    )

    for tool_def in tool_registry.list_tools():
        _register_tool_on_agent(agent, tool_def)

    return agent


def _register_tool_on_agent(agent: Agent, tool_def):
    """Dynamically register a BaseTool as a pydantic-ai tool."""

    async def tool_fn(**kwargs) -> str:
        return await tool_def.execute(**kwargs)

    tool_fn.__name__ = tool_def.name
    tool_fn.__doc__ = tool_def.description

    agent.tools.append(
        Tool(function=tool_fn, takes_ctx=False, name=tool_def.name, description=tool_def.description)
    )


async def agui_endpoint(request: Request) -> Response:
    """AG-UI endpoint — requires JWT auth via Authorization header.
    The token is verified before dispatching to the agent."""
    from app.core.security import decode_token

    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        from starlette.responses import JSONResponse
        return JSONResponse({"detail": "Not authenticated"}, status_code=401)
    token = auth_header.removeprefix("Bearer ")
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        from starlette.responses import JSONResponse
        return JSONResponse({"detail": "Invalid token"}, status_code=401)

    agent = create_agent()
    return await AGUIAdapter.dispatch_request(request, agent=agent)
```

- [ ] **Step 2: Register AG-UI route and tool init in main.py**

Replace `backend/app/main.py` with (includes ALL routers — auth, chat, tools, and AG-UI):

```python
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.agent.setup import agui_endpoint
from app.agent.tools import register_default_tools
from app.core.config import settings
from app.db.base import init_db
from app.modules.auth.router import router as auth_router
from app.modules.chat.router import router as chat_router
from app.modules.tools.router import router as tools_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    register_default_tools()
    yield


app = FastAPI(title="AG-UI Demo", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(tools_router)
app.add_route("/api/agui", agui_endpoint, methods=["POST"])


@app.get("/health")
async def health_check():
    return {"status": "ok"}
```

- [ ] **Step 3: Verify server starts with all routes**

```bash
cd /Volumes/WorkSpace/Projects/Idea/agui-pda-antdv-demo/backend
uv run uvicorn app.main:app --reload --port 8000
```

Expected: Server starts. Check `http://localhost:8000/docs` shows all API endpoints including `/api/agui`.

- [ ] **Step 4: Run all backend tests**

```bash
uv run pytest tests/ -v
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add backend/app/agent/setup.py backend/app/main.py
git commit -m "feat: add pydantic-ai agent with AG-UI adapter endpoint"
```

---

## Chunk 4: Frontend Foundation

### Task 12: Frontend Project Scaffolding

**Files:**
- Create: `frontend/` (Vite + Vue 3 + TypeScript project)

- [ ] **Step 1: Create Vue project with Vite**

```bash
cd /Volumes/WorkSpace/Projects/Idea/agui-pda-antdv-demo
bunx create-vite frontend --template vue-ts
cd frontend
```

- [ ] **Step 2: Install dependencies**

```bash
cd /Volumes/WorkSpace/Projects/Idea/agui-pda-antdv-demo/frontend
bun add antdv-next vue-router@4 pinia axios @ag-ui/client markstream-vue
bun add -d @types/node sass
```

- [ ] **Step 3: Create directory structure**

```bash
cd /Volumes/WorkSpace/Projects/Idea/agui-pda-antdv-demo/frontend/src
mkdir -p router stores composables services components/{chat,common} \
  features/{chat,auth,assistant} layouts types
```

- [ ] **Step 4: Configure Vite proxy**

Replace `frontend/vite.config.ts`:

```typescript
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
```

- [ ] **Step 5: Configure TypeScript path alias**

Update `frontend/tsconfig.json` to include:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

- [ ] **Step 6: Verify dev server starts**

```bash
cd /Volumes/WorkSpace/Projects/Idea/agui-pda-antdv-demo/frontend
bun run dev
```

Expected: Dev server starts at `http://localhost:5173`

- [ ] **Step 7: Commit**

```bash
git add frontend/
git commit -m "feat: scaffold frontend with Vite, Vue 3, TypeScript, antdv-next"
```

---

### Task 13: Types, Router & Layouts

**Files:**
- Create: `frontend/src/types/auth.ts`
- Create: `frontend/src/types/chat.ts`
- Create: `frontend/src/types/agui.ts`
- Create: `frontend/src/router/index.ts`
- Create: `frontend/src/layouts/AuthLayout.vue`
- Create: `frontend/src/layouts/MainLayout.vue`

- [ ] **Step 1: Write TypeScript types**

Write `frontend/src/types/auth.ts`:

```typescript
export interface User {
  id: string;
  username: string;
  display_name: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  display_name?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}
```

Write `frontend/src/types/chat.ts`:

```typescript
export interface Session {
  id: string;
  title: string;
  model_provider: string;
  model_name: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  session_id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  tool_calls: ToolCallRecord[] | null;
  metadata_: Record<string, unknown> | null;
  ordering: number;
  created_at: string;
}

export interface ToolCallRecord {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: string;
  status: "pending" | "confirmed" | "rejected" | "completed" | "error";
  confirmed_by_user?: boolean;
}

export type StreamingStatus = "idle" | "streaming" | "error";
```

Write `frontend/src/types/agui.ts`:

```typescript
export interface AguiConfig {
  url: string;
  headers?: Record<string, string>;
}

export interface SharedState {
  [key: string]: unknown;
}
```

- [ ] **Step 2: Write router**

Write `frontend/src/router/index.ts`:

```typescript
import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/login",
      name: "login",
      component: () => import("@/features/auth/LoginPage.vue"),
      meta: { layout: "auth", requiresAuth: false },
    },
    {
      path: "/register",
      name: "register",
      component: () => import("@/features/auth/RegisterPage.vue"),
      meta: { layout: "auth", requiresAuth: false },
    },
    {
      path: "/chat",
      name: "chat",
      component: () => import("@/features/chat/ChatPage.vue"),
      meta: { layout: "main", requiresAuth: true },
    },
    {
      path: "/chat/:sessionId",
      name: "chat-session",
      component: () => import("@/features/chat/ChatPage.vue"),
      meta: { layout: "main", requiresAuth: true },
    },
    {
      path: "/",
      redirect: "/chat",
    },
  ],
});

router.beforeEach((to) => {
  const token = localStorage.getItem("access_token");
  if (to.meta.requiresAuth && !token) {
    return { name: "login" };
  }
  if (!to.meta.requiresAuth && token && (to.name === "login" || to.name === "register")) {
    return { name: "chat" };
  }
});

export default router;
```

- [ ] **Step 3: Write layouts**

Write `frontend/src/layouts/AuthLayout.vue`:

```vue
<template>
  <div class="auth-layout">
    <div class="auth-container">
      <div class="auth-header">
        <h1>AG-UI Demo</h1>
        <p>Agent Interaction Platform</p>
      </div>
      <slot />
    </div>
  </div>
</template>

<style scoped>
.auth-layout {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.auth-container {
  width: 100%;
  max-width: 400px;
  padding: 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.auth-header {
  text-align: center;
  margin-bottom: 32px;
}

.auth-header h1 {
  font-size: 24px;
  color: #1a1a2e;
  margin-bottom: 8px;
}

.auth-header p {
  color: #666;
  font-size: 14px;
}
</style>
```

Write `frontend/src/layouts/MainLayout.vue`:

```vue
<template>
  <div class="main-layout">
    <slot />
  </div>
</template>

<style scoped>
.main-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
```

- [ ] **Step 4: Wire up App.vue**

Replace `frontend/src/App.vue`:

```vue
<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import AuthLayout from "@/layouts/AuthLayout.vue";
import MainLayout from "@/layouts/MainLayout.vue";

const route = useRoute();
const layout = computed(() => (route.meta.layout === "auth" ? AuthLayout : MainLayout));
const showFloating = computed(() => route.meta.layout === "main" && route.name !== "chat" && route.name !== "chat-session");
</script>

<template>
  <component :is="layout">
    <router-view />
  </component>
</template>
```

- [ ] **Step 5: Wire up main.ts**

Replace `frontend/src/main.ts`:

```typescript
import { createApp } from "vue";
import { createPinia } from "pinia";
import Antd from "antdv-next";
import App from "./App.vue";
import router from "./router";

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(Antd);
app.mount("#app");
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/
git commit -m "feat: add types, router, layouts, and app wiring"
```

---

### Task 14: API Service Layer

**Files:**
- Create: `frontend/src/services/api.ts`
- Create: `frontend/src/services/auth.ts`
- Create: `frontend/src/services/chat.ts`

- [ ] **Step 1: Write Axios instance with interceptors**

Write `frontend/src/services/api.ts`:

```typescript
import axios from "axios";
import type { TokenResponse } from "@/types/auth";

const api = axios.create({
  baseURL: "/api",
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        try {
          const { data } = await axios.post<TokenResponse>("/api/auth/refresh", {
            refresh_token: refreshToken,
          });
          localStorage.setItem("access_token", data.access_token);
          localStorage.setItem("refresh_token", data.refresh_token);
          originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
          return api(originalRequest);
        } catch {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

- [ ] **Step 2: Write auth service**

Write `frontend/src/services/auth.ts`:

```typescript
import api from "./api";
import type { LoginRequest, RegisterRequest, TokenResponse, User } from "@/types/auth";

export const authApi = {
  register(data: RegisterRequest) {
    return api.post<TokenResponse>("/auth/register", data);
  },
  login(data: LoginRequest) {
    return api.post<TokenResponse>("/auth/login", data);
  },
  refresh(refreshToken: string) {
    return api.post<TokenResponse>("/auth/refresh", { refresh_token: refreshToken });
  },
  getMe() {
    return api.get<User>("/auth/me");
  },
};
```

- [ ] **Step 3: Write chat service**

Write `frontend/src/services/chat.ts`:

```typescript
import api from "./api";
import type { Message, Session } from "@/types/chat";

export const chatApi = {
  createSession(data: { title?: string; model_provider?: string; model_name?: string }) {
    return api.post<Session>("/chat/sessions", data);
  },
  listSessions() {
    return api.get<Session[]>("/chat/sessions");
  },
  getSession(sessionId: string) {
    return api.get<Session>(`/chat/sessions/${sessionId}`);
  },
  updateSession(sessionId: string, data: { title?: string; is_archived?: boolean }) {
    return api.patch<Session>(`/chat/sessions/${sessionId}`, data);
  },
  deleteSession(sessionId: string) {
    return api.delete(`/chat/sessions/${sessionId}`);
  },
  getMessages(sessionId: string) {
    return api.get<Message[]>(`/chat/sessions/${sessionId}/messages`);
  },
};
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/services/
git commit -m "feat: add API service layer with Axios interceptors"
```

---

### Task 15: Auth Store, Composable & Pages

**Files:**
- Create: `frontend/src/stores/auth.ts`
- Create: `frontend/src/composables/useAuth.ts`
- Create: `frontend/src/features/auth/LoginPage.vue`
- Create: `frontend/src/features/auth/RegisterPage.vue`

- [ ] **Step 1: Write auth store**

Write `frontend/src/stores/auth.ts`:

```typescript
import { defineStore } from "pinia";
import { ref } from "vue";
import type { User } from "@/types/auth";

export const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(null);
  const isAuthenticated = ref(!!localStorage.getItem("access_token"));

  function setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("refresh_token", refreshToken);
    isAuthenticated.value = true;
  }

  function setUser(u: User) {
    user.value = u;
  }

  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    user.value = null;
    isAuthenticated.value = false;
  }

  return { user, isAuthenticated, setTokens, setUser, logout };
});
```

- [ ] **Step 2: Write auth composable**

Write `frontend/src/composables/useAuth.ts`:

```typescript
import { ref } from "vue";
import { useRouter } from "vue-router";
import { authApi } from "@/services/auth";
import { useAuthStore } from "@/stores/auth";

export function useAuth() {
  const store = useAuthStore();
  const router = useRouter();
  const loading = ref(false);
  const error = ref("");

  async function login(username: string, password: string) {
    loading.value = true;
    error.value = "";
    try {
      const { data } = await authApi.login({ username, password });
      store.setTokens(data.access_token, data.refresh_token);
      const { data: user } = await authApi.getMe();
      store.setUser(user);
      await router.push("/chat");
    } catch (e: any) {
      error.value = e.response?.data?.detail || "Login failed";
    } finally {
      loading.value = false;
    }
  }

  async function register(username: string, password: string, displayName?: string) {
    loading.value = true;
    error.value = "";
    try {
      const { data } = await authApi.register({ username, password, display_name: displayName });
      store.setTokens(data.access_token, data.refresh_token);
      const { data: user } = await authApi.getMe();
      store.setUser(user);
      await router.push("/chat");
    } catch (e: any) {
      error.value = e.response?.data?.detail || "Registration failed";
    } finally {
      loading.value = false;
    }
  }

  async function fetchUser() {
    if (!store.isAuthenticated) return;
    try {
      const { data } = await authApi.getMe();
      store.setUser(data);
    } catch {
      store.logout();
    }
  }

  function logout() {
    store.logout();
    router.push("/login");
  }

  return { loading, error, login, register, fetchUser, logout };
}
```

- [ ] **Step 3: Write LoginPage**

Write `frontend/src/features/auth/LoginPage.vue`:

```vue
<script setup lang="ts">
import { reactive } from "vue";
import { useAuth } from "@/composables/useAuth";

const { login, loading, error } = useAuth();
const form = reactive({ username: "", password: "" });

async function handleSubmit() {
  await login(form.username, form.password);
}
</script>

<template>
  <a-form layout="vertical" @finish="handleSubmit">
    <a-alert v-if="error" type="error" :message="error" show-icon style="margin-bottom: 16px" />
    <a-form-item label="Username" name="username" :rules="[{ required: true }]">
      <a-input v-model:value="form.username" size="large" placeholder="Enter username" />
    </a-form-item>
    <a-form-item label="Password" name="password" :rules="[{ required: true }]">
      <a-input-password v-model:value="form.password" size="large" placeholder="Enter password" />
    </a-form-item>
    <a-form-item>
      <a-button type="primary" html-type="submit" :loading="loading" block size="large">
        Login
      </a-button>
    </a-form-item>
    <div style="text-align: center">
      Don't have an account?
      <router-link to="/register">Register</router-link>
    </div>
  </a-form>
</template>
```

- [ ] **Step 4: Write RegisterPage**

Write `frontend/src/features/auth/RegisterPage.vue`:

```vue
<script setup lang="ts">
import { reactive } from "vue";
import { useAuth } from "@/composables/useAuth";

const { register, loading, error } = useAuth();
const form = reactive({ username: "", password: "", display_name: "" });

async function handleSubmit() {
  await register(form.username, form.password, form.display_name);
}
</script>

<template>
  <a-form layout="vertical" @finish="handleSubmit">
    <a-alert v-if="error" type="error" :message="error" show-icon style="margin-bottom: 16px" />
    <a-form-item label="Username" name="username" :rules="[{ required: true, min: 3 }]">
      <a-input v-model:value="form.username" size="large" placeholder="Choose a username" />
    </a-form-item>
    <a-form-item label="Display Name" name="display_name">
      <a-input v-model:value="form.display_name" size="large" placeholder="Your display name" />
    </a-form-item>
    <a-form-item label="Password" name="password" :rules="[{ required: true, min: 6 }]">
      <a-input-password v-model:value="form.password" size="large" placeholder="Choose a password" />
    </a-form-item>
    <a-form-item>
      <a-button type="primary" html-type="submit" :loading="loading" block size="large">
        Register
      </a-button>
    </a-form-item>
    <div style="text-align: center">
      Already have an account?
      <router-link to="/login">Login</router-link>
    </div>
  </a-form>
</template>
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/stores/auth.ts frontend/src/composables/useAuth.ts frontend/src/features/auth/
git commit -m "feat: add auth store, composable, login and register pages"
```

---

## Chunk 5: Frontend Chat Core

### Task 16: Chat Store & AG-UI Composable

**Files:**
- Create: `frontend/src/stores/chat.ts`
- Create: `frontend/src/stores/settings.ts`
- Create: `frontend/src/composables/useAgui.ts`
- Create: `frontend/src/composables/useChat.ts`
- Create: `frontend/src/composables/useSessions.ts`

- [ ] **Step 1: Write settings store**

Write `frontend/src/stores/settings.ts`:

```typescript
import { defineStore } from "pinia";
import { ref } from "vue";

export const useSettingsStore = defineStore("settings", () => {
  const modelProvider = ref(localStorage.getItem("model_provider") || "openai");
  const modelName = ref(localStorage.getItem("model_name") || "gpt-4o");

  function setModel(provider: string, name: string) {
    modelProvider.value = provider;
    modelName.value = name;
    localStorage.setItem("model_provider", provider);
    localStorage.setItem("model_name", name);
  }

  return { modelProvider, modelName, setModel };
});
```

- [ ] **Step 2: Write chat store**

Write `frontend/src/stores/chat.ts`:

```typescript
import { defineStore } from "pinia";
import { ref } from "vue";
import type { Message, Session, StreamingStatus } from "@/types/chat";

export const useChatStore = defineStore("chat", () => {
  const sessions = ref<Session[]>([]);
  const currentSessionId = ref<string | null>(null);
  const messages = ref<Message[]>([]);
  const streamingStatus = ref<StreamingStatus>("idle");
  const streamingContent = ref("");
  const sharedState = ref<Record<string, unknown>>({});

  function setSessions(list: Session[]) {
    sessions.value = list;
  }

  function addSession(session: Session) {
    sessions.value.unshift(session);
  }

  function removeSession(id: string) {
    sessions.value = sessions.value.filter((s) => s.id !== id);
  }

  function setCurrentSession(id: string | null) {
    currentSessionId.value = id;
  }

  function setMessages(list: Message[]) {
    messages.value = list;
  }

  function addMessage(msg: Message) {
    messages.value.push(msg);
  }

  function updateLastAssistantContent(content: string) {
    streamingContent.value = content;
  }

  function finalizeAssistantMessage(content: string, meta?: Partial<Message>) {
    const msg: Message = {
      id: crypto.randomUUID(),
      session_id: currentSessionId.value || "",
      role: "assistant",
      content,
      tool_calls: meta?.tool_calls ?? null,
      metadata_: meta?.metadata_ ?? null,
      ordering: messages.value.length + 1,
      created_at: new Date().toISOString(),
    };
    messages.value.push(msg);
    streamingContent.value = "";
    streamingStatus.value = "idle";
  }

  function setStreamingStatus(status: StreamingStatus) {
    streamingStatus.value = status;
  }

  function updateSharedState(state: Record<string, unknown>) {
    sharedState.value = state;
  }

  function mergeSharedState(delta: Record<string, unknown>) {
    sharedState.value = { ...sharedState.value, ...delta };
  }

  return {
    sessions, currentSessionId, messages, streamingStatus, streamingContent, sharedState,
    setSessions, addSession, removeSession, setCurrentSession,
    setMessages, addMessage, updateLastAssistantContent, finalizeAssistantMessage,
    setStreamingStatus, updateSharedState, mergeSharedState,
  };
});
```

- [ ] **Step 3: Write AG-UI composable**

Write `frontend/src/composables/useAgui.ts`:

```typescript
import { HttpAgent } from "@ag-ui/client";
import { ref } from "vue";
import { useChatStore } from "@/stores/chat";
import type { ToolCallRecord } from "@/types/chat";

export function useAgui() {
  const chatStore = useChatStore();
  const pendingToolCalls = ref<ToolCallRecord[]>([]);
  const currentAgent = ref<HttpAgent | null>(null);

  function createAgent(): HttpAgent {
    const token = localStorage.getItem("access_token") || "";
    const agent = new HttpAgent({
      url: "/api/agui",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    currentAgent.value = agent;
    return agent;
  }

  async function sendMessage(content: string, threadId: string, messageHistory: Array<{ role: string; content: string }>) {
    const agent = createAgent();
    chatStore.setStreamingStatus("streaming");
    chatStore.updateLastAssistantContent("");
    pendingToolCalls.value = [];

    let fullContent = "";
    let currentToolCall: ToolCallRecord | null = null;

    try {
      const result = await agent.runAgent(
        {
          threadId,
          messages: messageHistory.map((m) => ({
            id: crypto.randomUUID(),
            role: m.role as any,
            content: m.content,
          })),
        },
        {
          onTextMessageContent(event: any) {
            fullContent += event.delta || "";
            chatStore.updateLastAssistantContent(fullContent);
          },
          onToolCallStart(event: any) {
            currentToolCall = {
              id: event.toolCallId || crypto.randomUUID(),
              name: event.toolCallName || "",
              arguments: {},
              status: "pending",
            };
            // Push to reactive pendingToolCalls so HilConfirm can render
            pendingToolCalls.value.push(currentToolCall);
          },
          onToolCallArgs(event: any) {
            if (currentToolCall && event.delta) {
              try {
                const parsed = JSON.parse(event.delta);
                currentToolCall.arguments = { ...currentToolCall.arguments, ...parsed };
              } catch {
                // partial JSON, accumulate
              }
            }
          },
          onToolCallEnd(event: any) {
            if (currentToolCall) {
              currentToolCall.status = "completed";
              currentToolCall = null;
            }
          },
          onStateSnapshot(event: any) {
            if (event.snapshot) {
              chatStore.updateSharedState(event.snapshot);
            }
          },
          onStateDelta(event: any) {
            if (event.delta) {
              chatStore.mergeSharedState(event.delta);
            }
          },
          onRunError(event: any) {
            chatStore.setStreamingStatus("error");
          },
        }
      );

      const completedToolCalls = pendingToolCalls.value.filter((t) => t.status !== "pending");
      chatStore.finalizeAssistantMessage(fullContent, {
        tool_calls: completedToolCalls.length > 0 ? completedToolCalls : null,
      });
    } catch (err) {
      chatStore.setStreamingStatus("error");
      if (fullContent) {
        chatStore.finalizeAssistantMessage(fullContent);
      }
    }
  }

  function abortRun() {
    currentAgent.value?.abortRun();
    chatStore.setStreamingStatus("idle");
  }

  return { sendMessage, abortRun, pendingToolCalls };
}
```

- [ ] **Step 4: Write chat composable**

Write `frontend/src/composables/useChat.ts`:

Note: `useStream.ts` from the spec is intentionally merged into `useAgui.ts` — they serve the same purpose. No separate file needed.

```typescript
import { computed } from "vue";
import { useAgui } from "./useAgui";
import { chatApi } from "@/services/chat";
import { useChatStore } from "@/stores/chat";
import api from "@/services/api";

export function useChat() {
  const store = useChatStore();
  const { sendMessage: aguiSend, abortRun, pendingToolCalls } = useAgui();

  const isStreaming = computed(() => store.streamingStatus === "streaming");

  async function loadMessages(sessionId: string) {
    const { data } = await chatApi.getMessages(sessionId);
    store.setMessages(data);
  }

  async function send(content: string) {
    if (!store.currentSessionId || !content.trim()) return;

    const userMsg = {
      id: crypto.randomUUID(),
      session_id: store.currentSessionId,
      role: "user" as const,
      content,
      tool_calls: null,
      metadata_: null,
      ordering: store.messages.length + 1,
      created_at: new Date().toISOString(),
    };
    store.addMessage(userMsg);

    // Persist user message to backend
    await api.post(`/chat/sessions/${store.currentSessionId}/messages`, {
      role: "user",
      content,
    }).catch((err) => console.warn("Failed to persist user message:", err));

    const history = store.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    await aguiSend(content, store.currentSessionId, history);

    // Persist assistant message to backend after streaming completes
    const lastMsg = store.messages[store.messages.length - 1];
    if (lastMsg?.role === "assistant") {
      await api.post(`/chat/sessions/${store.currentSessionId}/messages`, {
        role: "assistant",
        content: lastMsg.content,
        tool_calls: lastMsg.tool_calls,
      }).catch((err) => console.warn("Failed to persist assistant message:", err));
    }
  }

  function stop() {
    abortRun();
  }

  return {
    messages: computed(() => store.messages),
    streamingContent: computed(() => store.streamingContent),
    streamingStatus: computed(() => store.streamingStatus),
    isStreaming,
    pendingToolCalls,
    loadMessages,
    send,
    stop,
  };
}
```

- [ ] **Step 5: Write sessions composable**

Write `frontend/src/composables/useSessions.ts`:

```typescript
import { useRouter } from "vue-router";
import { chatApi } from "@/services/chat";
import { useChatStore } from "@/stores/chat";
import { useSettingsStore } from "@/stores/settings";

export function useSessions() {
  const chatStore = useChatStore();
  const settingsStore = useSettingsStore();
  const router = useRouter();

  async function loadSessions() {
    const { data } = await chatApi.listSessions();
    chatStore.setSessions(data);
  }

  async function createSession(title?: string) {
    const { data } = await chatApi.createSession({
      title: title || "New Chat",
      model_provider: settingsStore.modelProvider,
      model_name: settingsStore.modelName,
    });
    chatStore.addSession(data);
    chatStore.setCurrentSession(data.id);
    chatStore.setMessages([]);
    await router.push(`/chat/${data.id}`);
  }

  async function selectSession(sessionId: string) {
    chatStore.setCurrentSession(sessionId);
    await router.push(`/chat/${sessionId}`);
  }

  async function deleteSession(sessionId: string) {
    await chatApi.deleteSession(sessionId);
    chatStore.removeSession(sessionId);
    if (chatStore.currentSessionId === sessionId) {
      chatStore.setCurrentSession(null);
      chatStore.setMessages([]);
      await router.push("/chat");
    }
  }

  async function renameSession(sessionId: string, title: string) {
    await chatApi.updateSession(sessionId, { title });
    await loadSessions();
  }

  return { sessions: chatStore.sessions, loadSessions, createSession, selectSession, deleteSession, renameSession };
}
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/stores/ frontend/src/composables/
git commit -m "feat: add chat/settings stores and AG-UI/chat/sessions composables"
```

---

### Task 17: Chat Components

**Files:**
- Create: `frontend/src/components/chat/MarkdownViewer.vue`
- Create: `frontend/src/components/chat/UserMessage.vue`
- Create: `frontend/src/components/chat/AssistantMessage.vue`
- Create: `frontend/src/components/chat/ToolCallCard.vue`
- Create: `frontend/src/components/chat/HilConfirm.vue`
- Create: `frontend/src/components/chat/MessageList.vue`
- Create: `frontend/src/components/chat/ChatInput.vue`
- Create: `frontend/src/components/chat/ChatRenderer.vue`

- [ ] **Step 1: Write MarkdownViewer**

Write `frontend/src/components/chat/MarkdownViewer.vue`:

markstream-vue provides Mermaid diagrams, KaTeX math, and Shiki syntax highlighting out of the box. The `:typewriter` prop enables streaming-friendly token-by-token rendering. Refer to markstream-vue docs (https://markstream-vue-docs.simonhe.me/) for additional configuration options if specific features need tuning.

```vue
<script setup lang="ts">
import MarkdownRender from "markstream-vue";

defineProps<{
  content: string;
  streaming?: boolean;
}>();
</script>

<template>
  <MarkdownRender :content="content" :typewriter="streaming" class="markdown-viewer" />
</template>

<style scoped>
.markdown-viewer {
  line-height: 1.7;
  word-wrap: break-word;
}

.markdown-viewer :deep(pre) {
  border-radius: 8px;
  overflow-x: auto;
}

.markdown-viewer :deep(table) {
  border-collapse: collapse;
  width: 100%;
}

.markdown-viewer :deep(th),
.markdown-viewer :deep(td) {
  border: 1px solid #e8e8e8;
  padding: 8px 12px;
}
</style>
```

- [ ] **Step 2: Write UserMessage and AssistantMessage**

Write `frontend/src/components/chat/UserMessage.vue`:

```vue
<script setup lang="ts">
defineProps<{ content: string }>();
</script>

<template>
  <div class="user-message">
    <div class="user-bubble">{{ content }}</div>
  </div>
</template>

<style scoped>
.user-message {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}

.user-bubble {
  max-width: 70%;
  padding: 12px 16px;
  background: #1677ff;
  color: #fff;
  border-radius: 16px 16px 4px 16px;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
```

Write `frontend/src/components/chat/AssistantMessage.vue`:

```vue
<script setup lang="ts">
import MarkdownViewer from "./MarkdownViewer.vue";
import ToolCallCard from "./ToolCallCard.vue";
import type { ToolCallRecord } from "@/types/chat";

defineProps<{
  content: string;
  streaming?: boolean;
  toolCalls?: ToolCallRecord[] | null;
}>();
</script>

<template>
  <div class="assistant-message">
    <div class="assistant-bubble">
      <ToolCallCard v-for="tc in toolCalls" :key="tc.id" :tool-call="tc" />
      <MarkdownViewer :content="content" :streaming="streaming" />
      <span v-if="streaming" class="cursor-blink" />
    </div>
  </div>
</template>

<style scoped>
.assistant-message {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 16px;
}

.assistant-bubble {
  max-width: 80%;
  padding: 12px 16px;
  background: #f5f5f5;
  border-radius: 16px 16px 16px 4px;
}

.cursor-blink {
  display: inline-block;
  width: 2px;
  height: 1em;
  background: #333;
  margin-left: 2px;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}
</style>
```

- [ ] **Step 3: Write ToolCallCard and HilConfirm**

Write `frontend/src/components/chat/ToolCallCard.vue`:

```vue
<script setup lang="ts">
import type { ToolCallRecord } from "@/types/chat";

defineProps<{ toolCall: ToolCallRecord }>();
</script>

<template>
  <div class="tool-call-card">
    <div class="tool-header">
      <a-tag color="blue">{{ toolCall.name }}</a-tag>
      <a-tag v-if="toolCall.status === 'completed'" color="green">Done</a-tag>
      <a-tag v-else-if="toolCall.status === 'error'" color="red">Error</a-tag>
      <a-tag v-else-if="toolCall.status === 'pending'" color="orange">Pending</a-tag>
    </div>
    <div v-if="Object.keys(toolCall.arguments).length" class="tool-args">
      <code>{{ JSON.stringify(toolCall.arguments, null, 2) }}</code>
    </div>
    <div v-if="toolCall.result" class="tool-result">
      <span class="result-label">Result:</span>
      <code>{{ toolCall.result }}</code>
    </div>
  </div>
</template>

<style scoped>
.tool-call-card {
  background: #fafafa;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 8px;
  font-size: 13px;
}

.tool-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.tool-args, .tool-result {
  background: #f0f0f0;
  border-radius: 4px;
  padding: 6px 8px;
  margin-top: 4px;
  overflow-x: auto;
}

.result-label {
  font-weight: 600;
  margin-right: 4px;
}
</style>
```

Write `frontend/src/components/chat/HilConfirm.vue`:

```vue
<script setup lang="ts">
import type { ToolCallRecord } from "@/types/chat";

const props = defineProps<{ toolCall: ToolCallRecord }>();
const emit = defineEmits<{
  confirm: [id: string];
  reject: [id: string];
}>();
</script>

<template>
  <div class="hil-confirm">
    <div class="hil-header">
      <a-tag color="orange">Confirmation Required</a-tag>
      <strong>{{ props.toolCall.name }}</strong>
    </div>
    <div class="hil-body">
      <p>The agent wants to execute this tool. Do you approve?</p>
      <code>{{ JSON.stringify(props.toolCall.arguments, null, 2) }}</code>
    </div>
    <div class="hil-actions">
      <a-button type="primary" size="small" @click="emit('confirm', props.toolCall.id)">
        Approve
      </a-button>
      <a-button danger size="small" @click="emit('reject', props.toolCall.id)">
        Reject
      </a-button>
    </div>
  </div>
</template>

<style scoped>
.hil-confirm {
  background: #fffbe6;
  border: 1px solid #ffe58f;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}

.hil-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.hil-body {
  margin-bottom: 12px;
}

.hil-body code {
  display: block;
  background: #f5f5f5;
  padding: 8px;
  border-radius: 4px;
  margin-top: 8px;
}

.hil-actions {
  display: flex;
  gap: 8px;
}
</style>
```

- [ ] **Step 4: Write MessageList, ChatInput, ChatRenderer**

Write `frontend/src/components/chat/MessageList.vue`:

Note: `MessageBubble.vue` from the spec is not needed as a separate file — `UserMessage.vue` and `AssistantMessage.vue` directly serve as the bubble wrappers for each role. This avoids an unnecessary abstraction layer.

```vue
<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import AssistantMessage from "./AssistantMessage.vue";
import HilConfirm from "./HilConfirm.vue";
import UserMessage from "./UserMessage.vue";
import type { Message, ToolCallRecord } from "@/types/chat";

const props = defineProps<{
  messages: Message[];
  streamingContent: string;
  isStreaming: boolean;
  pendingConfirmations: ToolCallRecord[];
}>();

const emit = defineEmits<{
  confirmTool: [id: string];
  rejectTool: [id: string];
}>();

const listRef = ref<HTMLDivElement>();

watch(
  () => [props.messages.length, props.streamingContent],
  () => nextTick(() => listRef.value?.scrollTo({ top: listRef.value.scrollHeight, behavior: "smooth" })),
);
</script>

<template>
  <div ref="listRef" class="message-list">
    <template v-for="msg in messages" :key="msg.id">
      <UserMessage v-if="msg.role === 'user'" :content="msg.content" />
      <AssistantMessage v-else-if="msg.role === 'assistant'" :content="msg.content" :tool-calls="msg.tool_calls" />
    </template>
    <HilConfirm
      v-for="tc in pendingConfirmations"
      :key="tc.id"
      :tool-call="tc"
      @confirm="emit('confirmTool', tc.id)"
      @reject="emit('rejectTool', tc.id)"
    />
    <AssistantMessage v-if="isStreaming && streamingContent" :content="streamingContent" :streaming="true" />
    <div v-if="isStreaming && !streamingContent" class="thinking">
      <a-spin size="small" /> <span>Thinking...</span>
    </div>
  </div>
</template>

<style scoped>
.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px;
}

.thinking {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  color: #999;
}
</style>
```

Write `frontend/src/components/chat/ChatInput.vue`:

```vue
<script setup lang="ts">
import { ref } from "vue";

defineProps<{ disabled?: boolean }>();
const emit = defineEmits<{
  send: [content: string];
  stop: [];
}>();

const input = ref("");

function handleSend() {
  const content = input.value.trim();
  if (!content) return;
  emit("send", content);
  input.value = "";
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
}
</script>

<template>
  <div class="chat-input">
    <a-textarea
      v-model:value="input"
      :auto-size="{ minRows: 1, maxRows: 6 }"
      placeholder="Type a message... (Shift+Enter for new line)"
      @keydown="handleKeydown"
    />
    <a-button v-if="!disabled" type="primary" @click="handleSend" :disabled="!input.trim()">
      Send
    </a-button>
    <a-button v-else danger @click="emit('stop')">
      Stop
    </a-button>
  </div>
</template>

<style scoped>
.chat-input {
  display: flex;
  gap: 8px;
  padding: 12px 24px;
  border-top: 1px solid #f0f0f0;
  background: #fff;
  align-items: flex-end;
}

.chat-input :deep(.ant-input) {
  border-radius: 20px;
  padding: 8px 16px;
}
</style>
```

Write `frontend/src/components/chat/ChatRenderer.vue`:

```vue
<script setup lang="ts">
import { watch } from "vue";
import ChatInput from "./ChatInput.vue";
import MessageList from "./MessageList.vue";
import { useChat } from "@/composables/useChat";

const props = defineProps<{ sessionId: string | null }>();
const { messages, streamingContent, isStreaming, pendingToolCalls, loadMessages, send, stop } = useChat();

watch(
  () => props.sessionId,
  async (id) => {
    if (id) await loadMessages(id);
  },
  { immediate: true },
);

// HiL: AG-UI's full Human-in-the-Loop requires the frontend to send a
// confirmation event back to the backend (via a follow-up HTTP POST or
// a dedicated AG-UI confirmation endpoint). pydantic-ai's AGUIAdapter
// does not yet expose a built-in HiL pause/resume API, so for v1 we:
// 1. Show the confirmation UI (HilConfirm renders for pending tool calls)
// 2. Mark the tool call status locally
// 3. Tool execution proceeds server-side automatically
// TODO: When pydantic-ai adds HiL support, wire confirm/reject to send
// AG-UI confirmation events back to the backend to actually gate execution.
function handleConfirmTool(toolCallId: string) {
  const tc = pendingToolCalls.value.find((t) => t.id === toolCallId);
  if (tc) tc.status = "confirmed";
}

function handleRejectTool(toolCallId: string) {
  const tc = pendingToolCalls.value.find((t) => t.id === toolCallId);
  if (tc) tc.status = "rejected";
}
</script>

<template>
  <div class="chat-renderer">
    <div v-if="!sessionId" class="empty-state">
      <h2>Start a conversation</h2>
      <p>Create a new session or select one from the sidebar.</p>
    </div>
    <template v-else>
      <MessageList
        :messages="messages"
        :streaming-content="streamingContent"
        :is-streaming="isStreaming"
        :pending-confirmations="pendingToolCalls.filter((t) => t.status === 'pending')"
        @confirm-tool="handleConfirmTool"
        @reject-tool="handleRejectTool"
      />
      <ChatInput :disabled="isStreaming" @send="send" @stop="stop" />
    </template>
  </div>
</template>

<style scoped>
.chat-renderer {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
}
</style>
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/chat/
git commit -m "feat: add chat components (MessageList, ChatRenderer, MarkdownViewer, ToolCallCard)"
```

---

### Task 18: Chat Page & Session List

**Files:**
- Create: `frontend/src/components/common/SessionList.vue`
- Create: `frontend/src/components/common/ModelSelector.vue`
- Create: `frontend/src/components/common/AppHeader.vue`
- Create: `frontend/src/features/chat/ChatPage.vue`

- [ ] **Step 1: Write SessionList**

Write `frontend/src/components/common/SessionList.vue`:

```vue
<script setup lang="ts">
import { useSessions } from "@/composables/useSessions";
import { useChatStore } from "@/stores/chat";

const chatStore = useChatStore();
const { sessions, createSession, selectSession, deleteSession } = useSessions();
</script>

<template>
  <div class="session-list">
    <a-button type="primary" block @click="createSession()" style="margin-bottom: 12px">
      + New Chat
    </a-button>
    <div class="sessions-scroll">
      <div
        v-for="session in sessions"
        :key="session.id"
        class="session-item"
        :class="{ active: chatStore.currentSessionId === session.id }"
        @click="selectSession(session.id)"
      >
        <div class="session-title">{{ session.title }}</div>
        <a-button type="text" size="small" danger @click.stop="deleteSession(session.id)">
          &times;
        </a-button>
      </div>
      <div v-if="sessions.length === 0" class="empty">No conversations yet</div>
    </div>
  </div>
</template>

<style scoped>
.session-list {
  padding: 12px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.sessions-scroll {
  flex: 1;
  overflow-y: auto;
}

.session-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 4px;
  transition: background 0.2s;
}

.session-item:hover {
  background: #f5f5f5;
}

.session-item.active {
  background: #e6f4ff;
}

.session-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
}

.empty {
  text-align: center;
  color: #999;
  padding: 24px;
}
</style>
```

- [ ] **Step 2: Write ModelSelector**

Write `frontend/src/components/common/ModelSelector.vue`:

```vue
<script setup lang="ts">
import { useSettingsStore } from "@/stores/settings";

const store = useSettingsStore();

const models = [
  { label: "GPT-4o", provider: "openai", name: "gpt-4o" },
  { label: "GPT-4o Mini", provider: "openai", name: "gpt-4o-mini" },
  { label: "DeepSeek V3", provider: "deepseek", name: "deepseek-chat" },
  { label: "Qwen Max", provider: "qwen", name: "qwen-max" },
];

function handleChange(value: string) {
  const model = models.find((m) => `${m.provider}:${m.name}` === value);
  if (model) store.setModel(model.provider, model.name);
}
</script>

<template>
  <a-select
    :value="`${store.modelProvider}:${store.modelName}`"
    @change="handleChange"
    style="width: 180px"
    size="small"
  >
    <a-select-option v-for="m in models" :key="`${m.provider}:${m.name}`" :value="`${m.provider}:${m.name}`">
      {{ m.label }}
    </a-select-option>
  </a-select>
</template>
```

- [ ] **Step 3: Write AppHeader**

Write `frontend/src/components/common/AppHeader.vue`:

```vue
<script setup lang="ts">
import { useAuth } from "@/composables/useAuth";
import { useAuthStore } from "@/stores/auth";
import ModelSelector from "./ModelSelector.vue";

const authStore = useAuthStore();
const { logout } = useAuth();
</script>

<template>
  <div class="app-header">
    <div class="header-left">
      <h3>AG-UI Demo</h3>
    </div>
    <div class="header-right">
      <ModelSelector />
      <span class="username">{{ authStore.user?.display_name }}</span>
      <a-button type="text" size="small" @click="logout">Logout</a-button>
    </div>
  </div>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 48px;
  border-bottom: 1px solid #f0f0f0;
  background: #fff;
}

.header-left h3 {
  margin: 0;
  font-size: 16px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.username {
  font-size: 14px;
  color: #666;
}
</style>
```

- [ ] **Step 4: Write ChatPage**

Write `frontend/src/features/chat/ChatPage.vue`:

```vue
<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import ChatRenderer from "@/components/chat/ChatRenderer.vue";
import AppHeader from "@/components/common/AppHeader.vue";
import SessionList from "@/components/common/SessionList.vue";
import { useAuth } from "@/composables/useAuth";
import { useSessions } from "@/composables/useSessions";
import { useChatStore } from "@/stores/chat";

const route = useRoute();
const chatStore = useChatStore();
const { loadSessions } = useSessions();
const { fetchUser } = useAuth();

const sessionId = computed(() => (route.params.sessionId as string) || null);

onMounted(async () => {
  await fetchUser();
  await loadSessions();
  if (sessionId.value) {
    chatStore.setCurrentSession(sessionId.value);
  }
});
</script>

<template>
  <div class="chat-page">
    <AppHeader />
    <div class="chat-body">
      <aside class="sidebar">
        <SessionList />
      </aside>
      <main class="main-area">
        <ChatRenderer :session-id="sessionId" />
      </main>
    </div>
  </div>
</template>

<style scoped>
.chat-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.chat-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.sidebar {
  width: 260px;
  border-right: 1px solid #f0f0f0;
  background: #fafafa;
  overflow-y: auto;
}

.main-area {
  flex: 1;
  overflow: hidden;
}
</style>
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/common/ frontend/src/features/chat/
git commit -m "feat: add ChatPage with SessionList, AppHeader, ModelSelector"
```

---

## Chunk 6: Frontend Assistant Modes & Polish

### Task 19: Floating Button, Popup & Drawer

**Files:**
- Create: `frontend/src/features/assistant/FloatingButton.vue`
- Create: `frontend/src/features/assistant/PopupChat.vue`
- Create: `frontend/src/features/assistant/DrawerChat.vue`

- [ ] **Step 1: Write FloatingButton**

Write `frontend/src/features/assistant/FloatingButton.vue`:

```vue
<script setup lang="ts">
import { ref } from "vue";
import DrawerChat from "./DrawerChat.vue";
import PopupChat from "./PopupChat.vue";

const mode = ref<"closed" | "popup" | "drawer">("closed");

function toggle() {
  mode.value = mode.value === "closed" ? "popup" : "closed";
}

function expandToDrawer() {
  mode.value = "drawer";
}

function close() {
  mode.value = "closed";
}
</script>

<template>
  <div class="floating-assistant">
    <Transition name="popup">
      <PopupChat v-if="mode === 'popup'" @close="close" @expand="expandToDrawer" />
    </Transition>
    <DrawerChat :open="mode === 'drawer'" @close="close" />
    <a-float-button
      type="primary"
      :style="{ right: '24px', bottom: '24px' }"
      @click="toggle"
    >
      <template #icon>
        <span style="font-size: 20px">AI</span>
      </template>
    </a-float-button>
  </div>
</template>

<style scoped>
.popup-enter-active,
.popup-leave-active {
  transition: all 0.3s ease;
}

.popup-enter-from,
.popup-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}
</style>
```

- [ ] **Step 2: Write PopupChat**

Write `frontend/src/features/assistant/PopupChat.vue`:

```vue
<script setup lang="ts">
import { onMounted, ref } from "vue";
import ChatRenderer from "@/components/chat/ChatRenderer.vue";
import { useSessions } from "@/composables/useSessions";
import { useChatStore } from "@/stores/chat";

const emit = defineEmits<{
  close: [];
  expand: [];
}>();

const chatStore = useChatStore();
const { createSession } = useSessions();

onMounted(async () => {
  if (!chatStore.currentSessionId) {
    await createSession("Quick Chat");
  }
});
</script>

<template>
  <div class="popup-chat">
    <div class="popup-header">
      <span>AI Assistant</span>
      <div class="popup-actions">
        <a-button type="text" size="small" @click="emit('expand')">Expand</a-button>
        <a-button type="text" size="small" @click="emit('close')">&times;</a-button>
      </div>
    </div>
    <div class="popup-body">
      <ChatRenderer :session-id="chatStore.currentSessionId" />
    </div>
  </div>
</template>

<style scoped>
.popup-chat {
  position: fixed;
  right: 24px;
  bottom: 80px;
  width: 380px;
  height: 520px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1000;
}

.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  font-weight: 600;
}

.popup-actions {
  display: flex;
  gap: 4px;
}

.popup-body {
  flex: 1;
  overflow: hidden;
}
</style>
```

- [ ] **Step 3: Write DrawerChat**

Write `frontend/src/features/assistant/DrawerChat.vue`:

```vue
<script setup lang="ts">
import ChatRenderer from "@/components/chat/ChatRenderer.vue";
import { useChatStore } from "@/stores/chat";

defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: [] }>();

const chatStore = useChatStore();
</script>

<template>
  <a-drawer
    title="AI Assistant"
    placement="right"
    :open="open"
    :width="480"
    :body-style="{ padding: 0, height: '100%' }"
    @close="emit('close')"
  >
    <ChatRenderer :session-id="chatStore.currentSessionId" />
  </a-drawer>
</template>
```

- [ ] **Step 4: Mount FloatingButton in App.vue**

Update `frontend/src/App.vue`:

```vue
<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import FloatingButton from "@/features/assistant/FloatingButton.vue";
import AuthLayout from "@/layouts/AuthLayout.vue";
import MainLayout from "@/layouts/MainLayout.vue";
import { useAuthStore } from "@/stores/auth";

const route = useRoute();
const authStore = useAuthStore();
const layout = computed(() => (route.meta.layout === "auth" ? AuthLayout : MainLayout));
const showFloating = computed(
  () => authStore.isAuthenticated && route.name !== "chat" && route.name !== "chat-session",
);
</script>

<template>
  <component :is="layout">
    <router-view />
  </component>
  <FloatingButton v-if="showFloating" />
</template>
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/assistant/ frontend/src/App.vue
git commit -m "feat: add floating button, popup chat, and drawer assistant modes"
```

---

### Task 20: Global Styles & Final Wiring

**Files:**
- Create: `frontend/src/styles/global.css`
- Modify: `frontend/src/main.ts` (import global styles)

- [ ] **Step 1: Write global styles**

Write `frontend/src/styles/global.css`:

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #d9d9d9;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #bfbfbf;
}
```

- [ ] **Step 2: Import global styles in main.ts**

Add to `frontend/src/main.ts` before `app.mount`:

```typescript
import "./styles/global.css";
```

- [ ] **Step 3: Verify full frontend dev server**

```bash
cd /Volumes/WorkSpace/Projects/Idea/agui-pda-antdv-demo/frontend
bun run dev
```

Expected: Dev server at http://localhost:5173, login page renders with antdv-next components.

- [ ] **Step 4: Verify full stack (backend + frontend)**

Terminal 1:
```bash
cd /Volumes/WorkSpace/Projects/Idea/agui-pda-antdv-demo/backend
uv run uvicorn app.main:app --reload --port 8000
```

Terminal 2:
```bash
cd /Volumes/WorkSpace/Projects/Idea/agui-pda-antdv-demo/frontend
bun run dev
```

Expected: Can register, login, create session, send message, see streaming response.

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "feat: add global styles, gitignore, finalize full stack wiring"
```
