from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional, List


class TagRef(BaseModel):
    id: UUID
    name: str
    color: str
    model_config = {"from_attributes": True}


class NoteFolderRef(BaseModel):
    id: UUID
    name: str
    model_config = {"from_attributes": True}


class DocumentRef(BaseModel):
    id: UUID
    title: str
    author: Optional[str] = None
    model_config = {"from_attributes": True}


# ── Note ─────────────────────────────────────────────────────────────────────
class NoteCreate(BaseModel):
    document_id: Optional[UUID] = None
    page_number: Optional[int] = None
    quote: Optional[str] = None
    content: str = ""


class NoteUpdate(BaseModel):
    document_id: Optional[UUID] = None
    page_number: Optional[int] = None
    quote: Optional[str] = None
    content: Optional[str] = None


class NoteResponse(BaseModel):
    id: UUID
    user_id: UUID
    document_id: Optional[UUID] = None
    page_number: Optional[int] = None
    quote: Optional[str] = None
    content: str
    tags: List[TagRef] = []
    folders: List[NoteFolderRef] = []
    document: Optional[DocumentRef] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ── NoteFolder ────────────────────────────────────────────────────────────────
class NoteFolderCreate(BaseModel):
    name: str
    parent_id: Optional[UUID] = None


class NoteFolderUpdate(BaseModel):
    name: Optional[str] = None
    parent_id: Optional[UUID] = None


class NoteFolderResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    parent_id: Optional[UUID] = None
    created_at: datetime

    model_config = {"from_attributes": True}
