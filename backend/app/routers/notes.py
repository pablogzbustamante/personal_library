from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from ..database import get_db
from ..models.user import User
from ..models.note import Note, NoteFolder
from ..models.tag import Tag
from ..schemas.note import NoteCreate, NoteUpdate, NoteResponse, NoteFolderCreate, NoteFolderUpdate, NoteFolderResponse
from ..services.auth_service import get_current_user

router = APIRouter()


# ── Note Folders CRUD (must be registered BEFORE /{note_id} routes) ──────────

@router.get("/folders/", response_model=List[NoteFolderResponse])
def list_note_folders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(NoteFolder).filter(NoteFolder.user_id == current_user.id).order_by(NoteFolder.name).all()


@router.post("/folders/", response_model=NoteFolderResponse, status_code=201)
def create_note_folder(
    data: NoteFolderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    folder = NoteFolder(**data.model_dump(), user_id=current_user.id)
    db.add(folder)
    db.commit()
    db.refresh(folder)
    return folder


@router.put("/folders/{folder_id}", response_model=NoteFolderResponse)
def update_note_folder(
    folder_id: UUID,
    data: NoteFolderUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    folder = db.query(NoteFolder).filter(NoteFolder.id == folder_id, NoteFolder.user_id == current_user.id).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(folder, field, value)
    db.commit()
    db.refresh(folder)
    return folder


@router.delete("/folders/{folder_id}", status_code=204)
def delete_note_folder(
    folder_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    folder = db.query(NoteFolder).filter(NoteFolder.id == folder_id, NoteFolder.user_id == current_user.id).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    db.delete(folder)
    db.commit()


# ── Notes CRUD ────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[NoteResponse])
def list_notes(
    document_id: Optional[UUID] = Query(None),
    folder_id: Optional[UUID] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Note).filter(Note.user_id == current_user.id)
    if document_id:
        q = q.filter(Note.document_id == document_id)
    if folder_id:
        q = q.join(Note.folders).filter(NoteFolder.id == folder_id)
    return q.order_by(Note.created_at.desc()).all()


@router.post("/", response_model=NoteResponse, status_code=201)
def create_note(
    data: NoteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    note = Note(**data.model_dump(), user_id=current_user.id)
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@router.get("/{note_id}", response_model=NoteResponse)
def get_note(
    note_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


@router.put("/{note_id}", response_model=NoteResponse)
def update_note(
    note_id: UUID,
    data: NoteUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(note, field, value)
    db.commit()
    db.refresh(note)
    return note


@router.delete("/{note_id}", status_code=204)
def delete_note(
    note_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    db.delete(note)
    db.commit()


# ── Note tags ─────────────────────────────────────────────────────────────────

@router.post("/{note_id}/tags/{tag_id}", response_model=NoteResponse)
def add_tag_to_note(
    note_id: UUID,
    tag_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    tag = db.query(Tag).filter(Tag.id == tag_id, Tag.user_id == current_user.id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    if tag not in note.tags:
        note.tags.append(tag)
        db.commit()
        db.refresh(note)
    return note


@router.delete("/{note_id}/tags/{tag_id}", response_model=NoteResponse)
def remove_tag_from_note(
    note_id: UUID,
    tag_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    note.tags = [t for t in note.tags if str(t.id) != str(tag_id)]
    db.commit()
    db.refresh(note)
    return note


# ── Note folders membership ───────────────────────────────────────────────────

@router.post("/{note_id}/folders/{folder_id}", response_model=NoteResponse)
def add_note_to_folder(
    note_id: UUID,
    folder_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    folder = db.query(NoteFolder).filter(NoteFolder.id == folder_id, NoteFolder.user_id == current_user.id).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    if folder not in note.folders:
        note.folders.append(folder)
        db.commit()
        db.refresh(note)
    return note


@router.delete("/{note_id}/folders/{folder_id}", response_model=NoteResponse)
def remove_note_from_folder(
    note_id: UUID,
    folder_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    note.folders = [f for f in note.folders if str(f.id) != str(folder_id)]
    db.commit()
    db.refresh(note)
    return note
