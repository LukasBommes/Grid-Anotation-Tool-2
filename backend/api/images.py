import os
import uuid
from typing import List

import filetype
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import event

from .. import models, schemas
from ..dependencies import get_db


images_to_delete = []


def create_router(settings):
    
    router = APIRouter()
    

    @router.get("/project/{project_id}/images/", response_model=List[schemas.Image], status_code=200)
    def get_images(project_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
        images = db.query(models.Image).filter(models.Image.project_id == project_id).offset(skip).limit(limit).all()
        return images


    @router.get("/image/{image_id}", response_model=schemas.Image, status_code=200)
    def get_image(image_id: int, db: Session = Depends(get_db)):
        db_image = db.query(models.Image).get(image_id)
        if not db_image:
            raise HTTPException(status_code=404, detail=f"Image with id {db_image} not found")
        return db_image


    @router.get("/image_file/{image_id}", response_class=FileResponse, status_code=200)
    def get_image_file(image_id: int, db: Session = Depends(get_db)):
        db_image = db.query(models.Image).get(image_id)
        if not db_image:
            raise HTTPException(status_code=404, detail=f"Image with id {db_image} not found")
        filepath = os.path.join(settings.MEDIA_ROOT, f"project_{db_image.project_id}", db_image.name)
        return filepath


    @router.delete("/image/{image_id}", response_model=schemas.Image, status_code=200)
    def delete_image(image_id: int, db: Session = Depends(get_db)):
        db_image = db.query(models.Image).get(image_id)
        if not db_image:
            raise HTTPException(status_code=404, detail=f"Image with id {db_image} not found")
        else:
            db.delete(db_image)
            db.commit()
        return db_image


    def save_image(name, project_id, data):
        filepath = os.path.join(settings.MEDIA_ROOT, f"project_{project_id}", name)
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        with open(filepath, 'wb') as f:
            f.write(data)


    def delete_image(name, project_id):
        image_dir = os.path.join(settings.MEDIA_ROOT, f"project_{project_id}")
        image_file = os.path.join(image_dir, name)
        try:
            os.remove(image_file)
        except FileNotFoundError:
            pass        
        try:
            os.rmdir(image_dir)
        except (OSError, FileNotFoundError):  # directory not empty or not found
            pass


    @router.post("/project/{project_id}/images/", response_model=List[schemas.Image], status_code=201)
    def create_image(project_id: int, files: List[UploadFile] = File(...), db: Session = Depends(get_db)):
        db_project = db.query(models.Project).get(project_id)
        if not db_project:
            raise HTTPException(status_code=404, detail=f"Project with id {project_id} not found")
        else:
            db_images = []
            for file in files:
                # unpack uploaded file
                _, filext = os.path.splitext(file.filename)
                filename = f"{str(uuid.uuid4())}{filext}"
                contents = file.file.read()

                # validate file is an image
                if not filetype.match(contents, matchers=filetype.image_matchers):
                    raise HTTPException(status_code=422, detail=f"Uploaded file is not a valid image.")

                # place file in MEDIA_ROOT
                save_image(filename, project_id, contents)

                # add image DB entry
                db_image = models.Image(name=filename, project_id=project_id)
                db.add(db_image)
                db.commit()

                # add annotation DB entry
                db_annotation = models.Annotation(id=db_image.id)
                db.add(db_annotation)
                db.commit()

                db.refresh(db_image)  # should probably instead go right after commit of db_image
                db_images.append(db_image)
        return db_images


    ##########################################################################################
    #
    # Hooks for automatic deletion of attached image files
    #
    ##########################################################################################

    @event.listens_for(models.Image, 'after_delete')
    def receive_after_delete(mapper, connection, target):
        """Register which image files must be deleted."""
        global images_to_delete
        images_to_delete.append((target.name, target.project_id))


    @event.listens_for(Session, 'after_commit')
    def receive_after_commit(session):
        """Delete registered image files."""
        global images_to_delete
        for image_name, project_id in images_to_delete:
            delete_image(image_name, project_id)
        images_to_delete = []


    @event.listens_for(Session, 'after_rollback')
    def receive_after_rollback(session):
        """Deregister image files."""
        global images_to_delete
        images_to_delete = []


    return router