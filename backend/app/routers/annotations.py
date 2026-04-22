from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from ..database import get_db
from ..models.user import User
from ..models.annotation import Annotation
from ..schemas.annotation import AnnotationCreate, AnnotationUpdate, AnnotationResponse
from ..services.auth_service import get_current_user

router = APIRouter()


@router.get("/", response_model=List[AnnotationResponse])
def list_annotations(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(Annotation).filter(
        Annotation.document_id == document_id,
        Annotation.user_id == current_user.id,
    ).all()


@router.post("/", response_model=AnnotationResponse, status_code=201)
def create_annotation(
    data: AnnotationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    annotation = Annotation(**data.model_dump(), user_id=current_user.id)
    db.add(annotation)
    db.commit()
    db.refresh(annotation)
    return annotation


@router.put("/{annotation_id}", response_model=AnnotationResponse)
def update_annotation(
    annotation_id: UUID,
    data: AnnotationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    annotation = db.query(Annotation).filter(
        Annotation.id == annotation_id,
        Annotation.user_id == current_user.id,
    ).first()
    if not annotation:
        raise HTTPException(status_code=404, detail="Annotation not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(annotation, field, value)
    db.commit()
    db.refresh(annotation)
    return annotation


@router.delete("/{annotation_id}", status_code=204)
def delete_annotation(
    annotation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    annotation = db.query(Annotation).filter(
        Annotation.id == annotation_id,
        Annotation.user_id == current_user.id,
    ).first()
    if not annotation:
        raise HTTPException(status_code=404, detail="Annotation not found")
    db.delete(annotation)
    db.commit()
