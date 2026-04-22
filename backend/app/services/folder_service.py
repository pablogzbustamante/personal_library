from uuid import UUID
from typing import List

from fastapi import HTTPException
from sqlalchemy.orm import Session

from ..models.folder import Folder
from ..models.document import Document
from ..schemas.folder import FolderCreate, FolderUpdate


def create_folder(db: Session, user_id: UUID, data: FolderCreate) -> Folder:
    if data.parent_id:
        parent = db.query(Folder).filter(
            Folder.id == data.parent_id,
            Folder.user_id == user_id,
        ).first()
        if not parent:
            raise HTTPException(status_code=404, detail="Parent folder not found")

    folder = Folder(user_id=user_id, name=data.name, parent_id=data.parent_id)
    db.add(folder)
    db.commit()
    db.refresh(folder)
    return folder


def get_folders(db: Session, user_id: UUID) -> List[Folder]:
    return db.query(Folder).filter(Folder.user_id == user_id).all()


def get_folder(db: Session, user_id: UUID, folder_id: UUID) -> Folder:
    folder = db.query(Folder).filter(
        Folder.id == folder_id,
        Folder.user_id == user_id,
    ).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    return folder


def update_folder(
    db: Session, user_id: UUID, folder_id: UUID, data: FolderUpdate
) -> Folder:
    folder = get_folder(db, user_id, folder_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(folder, field, value)
    db.commit()
    db.refresh(folder)
    return folder


def delete_folder(db: Session, user_id: UUID, folder_id: UUID) -> None:
    folder = get_folder(db, user_id, folder_id)
    db.delete(folder)
    db.commit()


def add_document_to_folder(
    db: Session, user_id: UUID, folder_id: UUID, document_id: UUID
) -> None:
    folder = get_folder(db, user_id, folder_id)
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == user_id,
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc not in folder.documents:
        folder.documents.append(doc)
        db.commit()


def remove_document_from_folder(
    db: Session, user_id: UUID, folder_id: UUID, document_id: UUID
) -> None:
    folder = get_folder(db, user_id, folder_id)
    doc = db.query(Document).filter(Document.id == document_id).first()
    if doc and doc in folder.documents:
        folder.documents.remove(doc)
        db.commit()
