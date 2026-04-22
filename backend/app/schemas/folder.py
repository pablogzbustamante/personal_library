from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional


class FolderCreate(BaseModel):
    name: str
    parent_id: Optional[UUID] = None


class FolderUpdate(BaseModel):
    name: Optional[str] = None
    parent_id: Optional[UUID] = None


class FolderResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    parent_id: Optional[UUID] = None
    created_at: datetime

    model_config = {"from_attributes": True}
