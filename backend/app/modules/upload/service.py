import uuid
from pathlib import Path

import aiofiles
from fastapi import HTTPException, UploadFile, status

from app.core.config import settings


class UploadService:
    def __init__(self):
        self.upload_dir = settings.upload_path
        self.max_size = settings.max_upload_size_mb * 1024 * 1024
        self.allowed_types = settings.allowed_upload_types

    async def save_file(self, file: UploadFile) -> dict:
        if file.content_type not in self.allowed_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type '{file.content_type}' is not allowed",
            )

        content = await file.read()
        if len(content) > self.max_size:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File exceeds maximum size of {settings.max_upload_size_mb}MB",
            )

        file_id = str(uuid.uuid4())
        safe_name = Path(file.filename or "upload").name
        dest_dir = self.upload_dir / file_id
        dest_dir.mkdir(parents=True, exist_ok=True)
        dest_path = dest_dir / safe_name

        async with aiofiles.open(dest_path, "wb") as f:
            await f.write(content)

        return {
            "id": file_id,
            "filename": safe_name,
            "url": f"/api/upload/{file_id}/{safe_name}",
            "mime_type": file.content_type or "application/octet-stream",
            "size": len(content),
        }
