from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from fastapi.responses import FileResponse

from app.core.config import settings
from app.core.dependencies import get_current_user_id
from app.modules.upload.schemas import FileUploadResponse
from app.modules.upload.service import UploadService

router = APIRouter(prefix="/api/upload", tags=["upload"])


def get_upload_service() -> UploadService:
    return UploadService()


@router.post("", response_model=FileUploadResponse)
async def upload_file(
    file: UploadFile,
    _user_id: str = Depends(get_current_user_id),
    service: UploadService = Depends(get_upload_service),
):
    result = await service.save_file(file)
    return FileUploadResponse(**result)


@router.get("/{file_id}/{filename}")
async def serve_file(file_id: str, filename: str):
    safe_name = Path(filename).name
    file_path = settings.upload_path / file_id / safe_name
    if not file_path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    return FileResponse(file_path)
