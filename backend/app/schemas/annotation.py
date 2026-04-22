from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional


class AnnotationCreate(BaseModel):
    document_id: UUID
    page_number: int
    content: str
    highlight_id: Optional[UUID] = None
    position_x: Optional[float] = None
    position_y: Optional[float] = None


class AnnotationUpdate(BaseModel):
    content: Optional[str] = None
    position_x: Optional[float] = None
    position_y: Optional[float] = None


class AnnotationResponse(BaseModel):
    id: UUID
    document_id: UUID
    user_id: UUID
    page_number: int
    content: str
    highlight_id: Optional[UUID] = None
    position_x: Optional[float] = None
    position_y: Optional[float] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
