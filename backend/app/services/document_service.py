import os
from uuid import UUID, uuid4
from typing import List, Optional

from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session, selectinload, contains_eager

from ..models.document import Document
from ..schemas.document import DocumentUpdate
from .pdf_service import extract_pdf_metadata

PDFS_DIR = os.path.join("storage", "pdfs")
COVERS_DIR = os.path.join("storage", "covers")

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}


def _ensure_user_dirs(user_id: str) -> None:
    os.makedirs(os.path.join(PDFS_DIR, user_id), exist_ok=True)


async def create_document(
    db: Session,
    user_id: UUID,
    title: str,
    file: UploadFile,
    author: Optional[str] = None,
    subject: Optional[str] = None,
    publisher: Optional[str] = None,
    year: Optional[int] = None,
    reference: Optional[str] = None,
    cover_file: Optional[UploadFile] = None,
) -> Document:
    _ensure_user_dirs(str(user_id))

    file_id = str(uuid4())
    safe_filename = f"{file_id}_{file.filename}"
    file_path = os.path.join(PDFS_DIR, str(user_id), safe_filename)

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    file_size = os.path.getsize(file_path)
    page_count, cover_path = extract_pdf_metadata(file_path, str(user_id), file_id)

    # Override cover with user-provided image if given
    if cover_file and cover_file.filename:
        ext = os.path.splitext(cover_file.filename)[1] or ".jpg"
        cover_dir = os.path.join(COVERS_DIR, str(user_id))
        os.makedirs(cover_dir, exist_ok=True)
        custom_cover_path = os.path.join(cover_dir, f"{file_id}_cover{ext}")
        cover_content = await cover_file.read()
        with open(custom_cover_path, "wb") as f:
            f.write(cover_content)
        # Remove auto-generated cover if it exists
        if cover_path and os.path.exists(cover_path) and cover_path != custom_cover_path:
            os.remove(cover_path)
        cover_path = custom_cover_path

    doc = Document(
        user_id=user_id,
        title=title,
        author=author,
        subject=subject,
        publisher=publisher,
        year=year,
        reference=reference,
        filename=file.filename,
        file_path=file_path,
        file_size=file_size,
        page_count=page_count,
        cover_image_path=cover_path,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


def get_documents(db: Session, user_id: UUID) -> List[Document]:
    return (
        db.query(Document)
        .options(selectinload(Document.tags), selectinload(Document.folders))
        .filter(Document.user_id == user_id)
        .all()
    )


def get_document(db: Session, user_id: UUID, document_id: UUID) -> Document:
    doc = (
        db.query(Document)
        .options(selectinload(Document.tags), selectinload(Document.folders))
        .filter(Document.id == document_id, Document.user_id == user_id)
        .first()
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


def update_document(
    db: Session, user_id: UUID, document_id: UUID, data: DocumentUpdate
) -> Document:
    doc = get_document(db, user_id, document_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(doc, field, value)
    db.commit()
    db.refresh(doc)
    return doc


async def update_cover_image(
    db: Session, user_id: UUID, document_id: UUID, cover_file: UploadFile
) -> Document:
    if cover_file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, WebP or GIF images are accepted")

    doc = get_document(db, user_id, document_id)

    # Remove old cover
    if doc.cover_image_path and os.path.exists(doc.cover_image_path):
        os.remove(doc.cover_image_path)

    ext = os.path.splitext(cover_file.filename or "cover.jpg")[1] or ".jpg"
    cover_dir = os.path.join(COVERS_DIR, str(user_id))
    os.makedirs(cover_dir, exist_ok=True)
    cover_path = os.path.join(cover_dir, f"{document_id}_cover{ext}")

    content = await cover_file.read()
    with open(cover_path, "wb") as f:
        f.write(content)

    doc.cover_image_path = cover_path
    db.commit()
    db.refresh(doc)
    return doc


def delete_document(db: Session, user_id: UUID, document_id: UUID) -> None:
    doc = get_document(db, user_id, document_id)
    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)
    if doc.cover_image_path and os.path.exists(doc.cover_image_path):
        os.remove(doc.cover_image_path)
    db.delete(doc)
    db.commit()
