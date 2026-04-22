import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .routers import auth, documents, highlights, annotations, bookmarks, folders, tags, authors, notes, subjects

app = FastAPI(title="FOLIO API", version="1.0.0", description="Personal Library Platform API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded files (PDFs, covers)
os.makedirs("storage", exist_ok=True)
app.mount("/storage", StaticFiles(directory="storage"), name="storage")

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
app.include_router(highlights.router, prefix="/api/highlights", tags=["highlights"])
app.include_router(annotations.router, prefix="/api/annotations", tags=["annotations"])
app.include_router(bookmarks.router, prefix="/api/bookmarks", tags=["bookmarks"])
app.include_router(folders.router, prefix="/api/folders", tags=["folders"])
app.include_router(tags.router, prefix="/api/tags", tags=["tags"])
app.include_router(authors.router, prefix="/api/authors", tags=["authors"])
app.include_router(notes.router, prefix="/api/notes", tags=["notes"])
app.include_router(subjects.router, prefix="/api/subjects", tags=["subjects"])


@app.get("/")
def root():
    return {"message": "FOLIO API is running"}
