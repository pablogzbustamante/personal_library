from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from ..database import get_db
from ..models.user import User
from ..schemas.folder import FolderCreate, FolderUpdate, FolderResponse
from ..services.auth_service import get_current_user
from ..services.folder_service import (
    add_document_to_folder,
    create_folder,
    delete_folder,
    get_folder,
    get_folders,
    remove_document_from_folder,
    update_folder,
)

router = APIRouter()


@router.get("/", response_model=List[FolderResponse])
def list_folders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_folders(db, current_user.id)


@router.post("/", response_model=FolderResponse, status_code=201)
def create_new_folder(
    data: FolderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return create_folder(db, current_user.id, data)


@router.get("/{folder_id}", response_model=FolderResponse)
def get_folder_by_id(
    folder_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_folder(db, current_user.id, folder_id)


@router.put("/{folder_id}", response_model=FolderResponse)
def update_folder_by_id(
    folder_id: UUID,
    data: FolderUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return update_folder(db, current_user.id, folder_id, data)


@router.delete("/{folder_id}", status_code=204)
def delete_folder_by_id(
    folder_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    delete_folder(db, current_user.id, folder_id)


@router.post("/{folder_id}/documents/{document_id}", status_code=204)
def add_doc_to_folder(
    folder_id: UUID,
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    add_document_to_folder(db, current_user.id, folder_id, document_id)


@router.delete("/{folder_id}/documents/{document_id}", status_code=204)
def remove_doc_from_folder(
    folder_id: UUID,
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    remove_document_from_folder(db, current_user.id, folder_id, document_id)
