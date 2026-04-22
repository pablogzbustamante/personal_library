# Import all models so SQLAlchemy registers their tables with Base.metadata
from .user import User
from .document import Document
from .highlight import Highlight
from .annotation import Annotation
from .bookmark import Bookmark
from .folder import Folder
from .tag import Tag
from .author import Author
from .note import Note, NoteFolder

__all__ = ["User", "Document", "Highlight", "Annotation", "Bookmark", "Folder", "Tag", "Author", "Note", "NoteFolder"]
