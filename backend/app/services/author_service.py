import os
from uuid import UUID
from typing import List

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session, selectinload

from ..models.author import Author
from ..models.tag import Tag
from ..schemas.author import AuthorCreate, AuthorUpdate

COVERS_DIR = os.path.join("storage", "author_covers")
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}


def get_authors(db: Session, user_id: UUID) -> List[Author]:
    return (
        db.query(Author)
        .options(selectinload(Author.tags))
        .filter(Author.user_id == user_id)
        .order_by(Author.name)
        .all()
    )


def get_author(db: Session, user_id: UUID, author_id: UUID) -> Author:
    author = (
        db.query(Author)
        .options(selectinload(Author.tags))
        .filter(Author.id == author_id, Author.user_id == user_id)
        .first()
    )
    if not author:
        raise HTTPException(status_code=404, detail="Author not found")
    return author


def create_author(db: Session, user_id: UUID, data: AuthorCreate) -> Author:
    author = Author(user_id=user_id, name=data.name, year=data.year)
    db.add(author)
    db.commit()
    db.refresh(author)
    return author


def update_author(db: Session, user_id: UUID, author_id: UUID, data: AuthorUpdate) -> Author:
    author = get_author(db, user_id, author_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(author, field, value)
    db.commit()
    db.refresh(author)
    return author


async def update_author_cover(
    db: Session, user_id: UUID, author_id: UUID, cover_file: UploadFile
) -> Author:
    if cover_file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, WebP or GIF images are accepted")

    author = get_author(db, user_id, author_id)

    if author.cover_image_path and os.path.exists(author.cover_image_path):
        os.remove(author.cover_image_path)

    os.makedirs(COVERS_DIR, exist_ok=True)
    ext = os.path.splitext(cover_file.filename or "cover.jpg")[1] or ".jpg"
    cover_path = os.path.join(COVERS_DIR, f"{author_id}_cover{ext}")

    content = await cover_file.read()
    with open(cover_path, "wb") as f:
        f.write(content)

    author.cover_image_path = cover_path
    db.commit()
    db.refresh(author)
    return author


def delete_author(db: Session, user_id: UUID, author_id: UUID) -> None:
    author = get_author(db, user_id, author_id)
    if author.cover_image_path and os.path.exists(author.cover_image_path):
        os.remove(author.cover_image_path)
    db.delete(author)
    db.commit()


def add_tag_to_author(db: Session, user_id: UUID, author_id: UUID, tag_id: UUID) -> Author:
    author = get_author(db, user_id, author_id)
    tag = db.query(Tag).filter(Tag.id == tag_id, Tag.user_id == user_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    if tag not in author.tags:
        author.tags.append(tag)
        db.commit()
        db.refresh(author)
    return author


def remove_tag_from_author(db: Session, user_id: UUID, author_id: UUID, tag_id: UUID) -> Author:
    author = get_author(db, user_id, author_id)
    author.tags = [t for t in author.tags if str(t.id) != str(tag_id)]
    db.commit()
    db.refresh(author)
    return author
