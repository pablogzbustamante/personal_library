from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional, List

from .tag import TagResponse


class SubjectCreate(BaseModel):
    name: str


class SubjectUpdate(BaseModel):
    name: Optional[str] = None


class SubjectResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    cover_image_path: Optional[str] = None
    created_at: datetime
    tags: List[TagResponse] = []

    model_config = {"from_attributes": True}
