from pydantic import BaseModel


class FileUploadResponse(BaseModel):
    id: str
    filename: str
    url: str
    mime_type: str
    size: int
