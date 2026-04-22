from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from ..database import get_db
from ..models.user import User
from ..models.highlight import Highlight
from ..schemas.highlight import HighlightCreate, HighlightUpdate, HighlightResponse
from ..services.auth_service import get_current_user

router = APIRouter()


@router.get("/", response_model=List[HighlightResponse])
def list_highlights(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(Highlight).filter(
        Highlight.document_id == document_id,
        Highlight.user_id == current_user.id,
    ).all()


@router.post("/", response_model=HighlightResponse, status_code=201)
def create_highlight(
    data: HighlightCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    highlight = Highlight(**data.model_dump(), user_id=current_user.id)
    db.add(highlight)
    db.commit()
    db.refresh(highlight)
    return highlight


@router.put("/{highlight_id}", response_model=HighlightResponse)
def update_highlight(
    highlight_id: UUID,
    data: HighlightUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    highlight = db.query(Highlight).filter(
        Highlight.id == highlight_id,
        Highlight.user_id == current_user.id,
    ).first()
    if not highlight:
        raise HTTPException(status_code=404, detail="Highlight not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(highlight, field, value)
    db.commit()
    db.refresh(highlight)
    return highlight


@router.delete("/{highlight_id}", status_code=204)
def delete_highlight(
    highlight_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    highlight = db.query(Highlight).filter(
        Highlight.id == highlight_id,
        Highlight.user_id == current_user.id,
    ).first()
    if not highlight:
        raise HTTPException(status_code=404, detail="Highlight not found")
    db.delete(highlight)
    db.commit()
