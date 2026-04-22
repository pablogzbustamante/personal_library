from sqlalchemy import create_engine, Table, Column, ForeignKey
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    class Config:
        env_file = ".env"


settings = Settings()

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


# Association tables (defined here to avoid circular imports between models)
document_tags = Table(
    "document_tags",
    Base.metadata,
    Column(
        "document_id",
        PGUUID(as_uuid=True),
        ForeignKey("documents.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "tag_id",
        PGUUID(as_uuid=True),
        ForeignKey("tags.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)

author_tags = Table(
    "author_tags",
    Base.metadata,
    Column(
        "author_id",
        PGUUID(as_uuid=True),
        ForeignKey("authors.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "tag_id",
        PGUUID(as_uuid=True),
        ForeignKey("tags.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)

document_folders = Table(
    "document_folders",
    Base.metadata,
    Column(
        "document_id",
        PGUUID(as_uuid=True),
        ForeignKey("documents.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "folder_id",
        PGUUID(as_uuid=True),
        ForeignKey("folders.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)

note_tags = Table(
    "note_tags",
    Base.metadata,
    Column("note_id", PGUUID(as_uuid=True), ForeignKey("notes.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", PGUUID(as_uuid=True), ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)

note_folder_notes = Table(
    "note_folder_notes",
    Base.metadata,
    Column("note_id", PGUUID(as_uuid=True), ForeignKey("notes.id", ondelete="CASCADE"), primary_key=True),
    Column("folder_id", PGUUID(as_uuid=True), ForeignKey("note_folders.id", ondelete="CASCADE"), primary_key=True),
)

subject_tags = Table(
    "subject_tags",
    Base.metadata,
    Column(
        "subject_id",
        PGUUID(as_uuid=True),
        ForeignKey("subjects.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "tag_id",
        PGUUID(as_uuid=True),
        ForeignKey("tags.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
