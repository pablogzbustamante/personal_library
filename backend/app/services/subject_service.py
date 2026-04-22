import os
from uuid import UUID
from typing import List

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session, selectinload

from ..models.subject import Subject
from ..models.tag import Tag
from ..schemas.subject import SubjectCreate, SubjectUpdate

COVERS_DIR = os.path.join("storage", "subject_covers")
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}


def get_subjects(db: Session, user_id: UUID) -> List[Subject]:
    return (
        db.query(Subject)
        .options(selectinload(Subject.tags))
        .filter(Subject.user_id == user_id)
        .order_by(Subject.name)
        .all()
    )


def get_subject(db: Session, user_id: UUID, subject_id: UUID) -> Subject:
    subject = (
        db.query(Subject)
        .options(selectinload(Subject.tags))
        .filter(Subject.id == subject_id, Subject.user_id == user_id)
        .first()
    )
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    return subject


def create_subject(db: Session, user_id: UUID, data: SubjectCreate) -> Subject:
    subject = Subject(user_id=user_id, name=data.name)
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject


def update_subject(db: Session, user_id: UUID, subject_id: UUID, data: SubjectUpdate) -> Subject:
    subject = get_subject(db, user_id, subject_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(subject, field, value)
    db.commit()
    db.refresh(subject)
    return subject


async def update_subject_cover(
    db: Session, user_id: UUID, subject_id: UUID, cover_file: UploadFile
) -> Subject:
    if cover_file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, WebP or GIF images are accepted")

    subject = get_subject(db, user_id, subject_id)

    if subject.cover_image_path and os.path.exists(subject.cover_image_path):
        os.remove(subject.cover_image_path)

    os.makedirs(COVERS_DIR, exist_ok=True)
    ext = os.path.splitext(cover_file.filename or "cover.jpg")[1] or ".jpg"
    cover_path = os.path.join(COVERS_DIR, f"{subject_id}_cover{ext}")

    content = await cover_file.read()
    with open(cover_path, "wb") as f:
        f.write(content)

    subject.cover_image_path = cover_path
    db.commit()
    db.refresh(subject)
    return subject


def delete_subject(db: Session, user_id: UUID, subject_id: UUID) -> None:
    subject = get_subject(db, user_id, subject_id)
    if subject.cover_image_path and os.path.exists(subject.cover_image_path):
        os.remove(subject.cover_image_path)
    db.delete(subject)
    db.commit()


def add_tag_to_subject(db: Session, user_id: UUID, subject_id: UUID, tag_id: UUID) -> Subject:
    subject = get_subject(db, user_id, subject_id)
    tag = db.query(Tag).filter(Tag.id == tag_id, Tag.user_id == user_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    if tag not in subject.tags:
        subject.tags.append(tag)
        db.commit()
        db.refresh(subject)
    return subject


def remove_tag_from_subject(db: Session, user_id: UUID, subject_id: UUID, tag_id: UUID) -> Subject:
    subject = get_subject(db, user_id, subject_id)
    subject.tags = [t for t in subject.tags if str(t.id) != str(tag_id)]
    db.commit()
    db.refresh(subject)
    return subject
