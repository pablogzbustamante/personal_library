from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional


class TagCreate(BaseModel):
    name: str
    color: str = "#3B82F6"


class TagUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None


class TagResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    color: str
    created_at: datetime

    model_config = {"from_attributes": True}
