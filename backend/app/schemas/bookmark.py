from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional, List


class TagRef(BaseModel):
    id: UUID
    name: str
    color: str

    model_config = {"from_attributes": True}


class BookmarkCreate(BaseModel):
    document_id: UUID
    page_number: int
    label: Optional[str] = None
    color: Optional[str] = None


class BookmarkUpdate(BaseModel):
    label: Optional[str] = None
    color: Optional[str] = None


class BookmarkResponse(BaseModel):
    id: UUID
    document_id: UUID
    user_id: UUID
    page_number: int
    label: Optional[str] = None
    color: Optional[str] = None
    tags: List[TagRef] = []
    created_at: datetime

    model_config = {"from_attributes": True}
