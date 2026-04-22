from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.user import User
from ..schemas.subject import SubjectCreate, SubjectUpdate, SubjectResponse
from ..services.auth_service import get_current_user
from ..services.subject_service import (
    create_subject,
    delete_subject,
    get_subject,
    get_subjects,
    update_subject,
    update_subject_cover,
    add_tag_to_subject,
    remove_tag_from_subject,
)

router = APIRouter()


@router.get("/", response_model=List[SubjectResponse])
def list_subjects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_subjects(db, current_user.id)


@router.post("/", response_model=SubjectResponse, status_code=201)
def create_new_subject(
    data: SubjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return create_subject(db, current_user.id, data)


@router.get("/{subject_id}", response_model=SubjectResponse)
def get_subject_by_id(
    subject_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_subject(db, current_user.id, subject_id)


@router.put("/{subject_id}", response_model=SubjectResponse)
def update_subject_by_id(
    subject_id: UUID,
    data: SubjectUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return update_subject(db, current_user.id, subject_id, data)


@router.post("/{subject_id}/cover", response_model=SubjectResponse)
async def upload_subject_cover(
    subject_id: UUID,
    cover: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return await update_subject_cover(db, current_user.id, subject_id, cover)


@router.delete("/{subject_id}", status_code=204)
def delete_subject_by_id(
    subject_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    delete_subject(db, current_user.id, subject_id)


@router.post("/{subject_id}/tags/{tag_id}", response_model=SubjectResponse)
def add_tag(
    subject_id: UUID,
    tag_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return add_tag_to_subject(db, current_user.id, subject_id, tag_id)


@router.delete("/{subject_id}/tags/{tag_id}", response_model=SubjectResponse)
def remove_tag(
    subject_id: UUID,
    tag_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return remove_tag_from_subject(db, current_user.id, subject_id, tag_id)
