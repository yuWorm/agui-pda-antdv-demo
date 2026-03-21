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
