from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional, Any


class HighlightCreate(BaseModel):
    document_id: UUID
    page_number: int
    selected_text: str
    color: str = "#FFFF00"
    position_data: Optional[Any] = None


class HighlightUpdate(BaseModel):
    color: Optional[str] = None
    position_data: Optional[Any] = None


class HighlightResponse(BaseModel):
    id: UUID
    document_id: UUID
    user_id: UUID
    page_number: int
    selected_text: str
    color: str
    position_data: Optional[Any] = None
    created_at: datetime

    model_config = {"from_attributes": True}
