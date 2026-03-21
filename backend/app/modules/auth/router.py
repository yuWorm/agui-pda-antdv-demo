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
