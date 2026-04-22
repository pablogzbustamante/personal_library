from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from ..database import get_db
from ..models.user import User
from ..models.bookmark import Bookmark
from ..models.tag import Tag
from ..schemas.bookmark import BookmarkCreate, BookmarkUpdate, BookmarkResponse
from ..services.auth_service import get_current_user

router = APIRouter()


@router.get("/", response_model=List[BookmarkResponse])
def list_bookmarks(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(Bookmark).filter(
        Bookmark.document_id == document_id,
        Bookmark.user_id == current_user.id,
    ).all()


@router.post("/", response_model=BookmarkResponse, status_code=201)
def create_bookmark(
    data: BookmarkCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bookmark = Bookmark(**data.model_dump(), user_id=current_user.id)
    db.add(bookmark)
    db.commit()
    db.refresh(bookmark)
    return bookmark


@router.put("/{bookmark_id}", response_model=BookmarkResponse)
def update_bookmark(
    bookmark_id: UUID,
    data: BookmarkUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bookmark = db.query(Bookmark).filter(
        Bookmark.id == bookmark_id,
        Bookmark.user_id == current_user.id,
    ).first()
    if not bookmark:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(bookmark, field, value)
    db.commit()
    db.refresh(bookmark)
    return bookmark


@router.delete("/{bookmark_id}", status_code=204)
def delete_bookmark(
    bookmark_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bookmark = db.query(Bookmark).filter(
        Bookmark.id == bookmark_id,
        Bookmark.user_id == current_user.id,
    ).first()
    if not bookmark:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    db.delete(bookmark)
    db.commit()


@router.post("/{bookmark_id}/tags/{tag_id}", response_model=BookmarkResponse)
def add_tag_to_bookmark(
    bookmark_id: UUID,
    tag_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bookmark = db.query(Bookmark).filter(
        Bookmark.id == bookmark_id,
        Bookmark.user_id == current_user.id,
    ).first()
    if not bookmark:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    tag = db.query(Tag).filter(Tag.id == tag_id, Tag.user_id == current_user.id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    if tag not in bookmark.tags:
        bookmark.tags.append(tag)
        db.commit()
        db.refresh(bookmark)
    return bookmark


@router.delete("/{bookmark_id}/tags/{tag_id}", response_model=BookmarkResponse)
def remove_tag_from_bookmark(
    bookmark_id: UUID,
    tag_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bookmark = db.query(Bookmark).filter(
        Bookmark.id == bookmark_id,
        Bookmark.user_id == current_user.id,
    ).first()
    if not bookmark:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    bookmark.tags = [t for t in bookmark.tags if str(t.id) != str(tag_id)]
    db.commit()
    db.refresh(bookmark)
    return bookmark
