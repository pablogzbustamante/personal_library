from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional, List

from .tag import TagResponse


class AuthorCreate(BaseModel):
    name: str
    year: Optional[int] = None


class AuthorUpdate(BaseModel):
    name: Optional[str] = None
    year: Optional[int] = None


class AuthorResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    year: Optional[int] = None
    cover_image_path: Optional[str] = None
    created_at: datetime
    tags: List[TagResponse] = []

    model_config = {"from_attributes": True}
