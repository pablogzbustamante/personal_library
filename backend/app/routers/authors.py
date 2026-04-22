from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.user import User
from ..schemas.author import AuthorCreate, AuthorUpdate, AuthorResponse
from ..services.auth_service import get_current_user
from ..services.author_service import (
    create_author,
    delete_author,
    get_author,
    get_authors,
    update_author,
    update_author_cover,
    add_tag_to_author,
    remove_tag_from_author,
)

router = APIRouter()


@router.get("/", response_model=List[AuthorResponse])
def list_authors(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_authors(db, current_user.id)


@router.post("/", response_model=AuthorResponse, status_code=201)
def create_new_author(
    data: AuthorCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return create_author(db, current_user.id, data)


@router.get("/{author_id}", response_model=AuthorResponse)
def get_author_by_id(
    author_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_author(db, current_user.id, author_id)


@router.put("/{author_id}", response_model=AuthorResponse)
def update_author_by_id(
    author_id: UUID,
    data: AuthorUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return update_author(db, current_user.id, author_id, data)


@router.post("/{author_id}/cover", response_model=AuthorResponse)
async def upload_author_cover(
    author_id: UUID,
    cover: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return await update_author_cover(db, current_user.id, author_id, cover)


@router.delete("/{author_id}", status_code=204)
def delete_author_by_id(
    author_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    delete_author(db, current_user.id, author_id)


@router.post("/{author_id}/tags/{tag_id}", response_model=AuthorResponse)
def add_tag(
    author_id: UUID,
    tag_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return add_tag_to_author(db, current_user.id, author_id, tag_id)


@router.delete("/{author_id}/tags/{tag_id}", response_model=AuthorResponse)
def remove_tag(
    author_id: UUID,
    tag_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return remove_tag_from_author(db, current_user.id, author_id, tag_id)
