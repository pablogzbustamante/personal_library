from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from uuid import UUID

from ..database import get_db
from ..models.user import User
from ..schemas.document import DocumentResponse, DocumentUpdate
from ..services.auth_service import get_current_user
from ..services.document_service import (
    create_document,
    delete_document,
    get_document,
    get_documents,
    update_document,
    update_cover_image,
)

router = APIRouter()


@router.get("/", response_model=List[DocumentResponse])
def list_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_documents(db, current_user.id)


@router.post("/", response_model=DocumentResponse, status_code=201)
async def upload_document(
    title: str = Form(...),
    file: UploadFile = File(...),
    author: Optional[str] = Form(None),
    subject: Optional[str] = Form(None),
    publisher: Optional[str] = Form(None),
    year: Optional[int] = Form(None),
    reference: Optional[str] = Form(None),
    cover: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")
    return await create_document(db, current_user.id, title, file, author, subject, publisher, year, reference, cover or None)


@router.get("/{document_id}", response_model=DocumentResponse)
def get_doc(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_document(db, current_user.id, document_id)


@router.put("/{document_id}", response_model=DocumentResponse)
def update_doc(
    document_id: UUID,
    data: DocumentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return update_document(db, current_user.id, document_id, data)


@router.post("/{document_id}/cover", response_model=DocumentResponse)
async def upload_cover(
    document_id: UUID,
    cover: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return await update_cover_image(db, current_user.id, document_id, cover)


@router.delete("/{document_id}", status_code=204)
def delete_doc(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    delete_document(db, current_user.id, document_id)


@router.get("/{document_id}/file")
def serve_document(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = get_document(db, current_user.id, document_id)
    return FileResponse(doc.file_path, media_type="application/pdf", filename=doc.filename)
