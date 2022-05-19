from typing import List

from fastapi import APIRouter, Depends, HTTPException
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from sqlalchemy import and_

from .. import models, schemas
from ..dependencies import get_db
from ..auth import get_current_active_user


def create_router(settings):
    
    router = APIRouter()


    @router.get("/annotation_ids/", response_model=List[int], status_code=200)
    def get_annotation_ids(db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_active_user)):
        annotation_ids = []
        db_annotations = db.query(models.Annotation).filter(
            models.Annotation.username == current_user.username
        ).all()
        for db_annotation in db_annotations:
            if len(db_annotation.data):
                annotation_ids.append(db_annotation.id)
        return annotation_ids


    # @router.get("/annotations/", response_model=List[schemas.Annotation], status_code=200)
    # def get_annotations(db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_active_user)):
    #     annotation_ids = []
    #     db_annotations = db.query(models.Annotation).filter(
    #         models.Annotation.username == current_user.username
    #     ).all()
    #     return db_annotations


    @router.get("/annotation/{image_id}", response_model=schemas.Annotation, status_code=200)
    def get_annotation(image_id: int, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_active_user)):
        db_annotation = db.query(models.Annotation).filter(
            and_(
                models.Annotation.username == current_user.username,
                models.Annotation.id == image_id
            )
        ).first()
        if not db_annotation:
            raise HTTPException(status_code=404, detail=f"Annotation with id {image_id} not found")
        return db_annotation


    @router.put("/annotation/{image_id}", response_model=schemas.Annotation, status_code=200)
    def update_annotation(image_id: int, annotation: schemas.AnnotationCreate, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_active_user)):
        db_annotation_query = db.query(models.Annotation).filter(
            and_(
                models.Annotation.username == current_user.username,
                models.Annotation.id == image_id
            )
        )
        db_annotation = db_annotation_query.first()
        if not db_annotation:
            raise HTTPException(status_code=404, detail=f"Annotation with id {image_id} not found")
        else:
            annotation_dict = annotation.dict()
            db_annotation_query.update(annotation_dict, synchronize_session=False)
            db.commit()
            db.refresh(db_annotation)
            db_annotation = jsonable_encoder(db_annotation)
        return db_annotation


    return router