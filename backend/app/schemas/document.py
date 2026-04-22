from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional

from .tag import TagResponse


class DocumentCreate(BaseModel):
    title: str
    author: Optional[str] = None
    subject: Optional[str] = None
    publisher: Optional[str] = None
    year: Optional[int] = None
    reference: Optional[str] = None


class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    subject: Optional[str] = None
    publisher: Optional[str] = None
    year: Optional[int] = None
    reference: Optional[str] = None
    last_page_read: Optional[int] = None
    progress: Optional[float] = None


class DocumentResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    author: Optional[str] = None
    subject: Optional[str] = None
    publisher: Optional[str] = None
    year: Optional[int] = None
    reference: Optional[str] = None
    filename: str
    file_size: Optional[int] = None
    page_count: Optional[int] = None
    last_page_read: int
    progress: float
    cover_image_path: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    tags: list[TagResponse] = []
    folder_ids: list[UUID] = []

    model_config = {"from_attributes": True}
