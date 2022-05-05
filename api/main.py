import uuid
import os

from datetime import datetime
from typing import List

from fastapi import Depends, FastAPI, HTTPException, File, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy import event
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware

from . import config, models, schemas
from .database import SessionLocal, engine

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# to fix CORS access error
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


##########################################################################################
#
# Project API
#
##########################################################################################


@app.post("/projects/", response_model=schemas.Project)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db)):
    now = datetime.now()
    db_project = models.Project(**project.dict(), created=now, edited=now)
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project


@app.get("/projects/", response_model=List[schemas.Project])
def get_projects(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    db_projects = db.query(models.Project).offset(skip).limit(limit).all()
    return db_projects


@app.get("/project/{project_id}", response_model=schemas.Project)
def get_project(project_id: int, db: Session = Depends(get_db)):
    db_project = db.query(models.Project).get(project_id)
    if not db_project:
        raise HTTPException(status_code=404, detail=f"Project with id {project_id} not found")
    return db_project


@app.delete("/project/{project_id}", response_model=schemas.Project)
def delete_project(project_id: int, db: Session = Depends(get_db)):
    db_project = db.query(models.Project).get(project_id)
    if not db_project:
        raise HTTPException(status_code=404, detail=f"Project with id {project_id} not found")
    else:
        db.delete(db_project)
        db.commit()
    return db_project


@app.put("/project/{project_id}", response_model=schemas.Project)
def update_project(project_id: int, project: schemas.ProjectCreate, db: Session = Depends(get_db)):
    db_project_query = db.query(models.Project).filter(models.Project.id == project_id)
    db_project = db_project_query.first()
    if not db_project:
        raise HTTPException(status_code=404, detail=f"Project with id {project_id} not found")
    else:
        project_dict = project.dict()
        project_dict.update({"edited": datetime.now()})
        db_project_query.update(project_dict, synchronize_session=False)
        db.commit()
    return db_project


##########################################################################################
#
# Image API
#
##########################################################################################


@app.get("/project/{project_id}/images/", response_model=List[schemas.Image])
def get_images(project_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    images = db.query(models.Image).filter(models.Image.project_id == project_id).offset(skip).limit(limit).all()
    return images


@app.get("/image/{image_id}", response_model=schemas.Image)
def get_image(image_id: int, db: Session = Depends(get_db)):
    db_image = db.query(models.Image).get(image_id)
    if not db_image:
        raise HTTPException(status_code=404, detail=f"Image with id {db_image} not found")
    return db_image


@app.get("/image_file/{image_id}", response_class=FileResponse)
def get_image_file(image_id: int, db: Session = Depends(get_db)):
    db_image = db.query(models.Image).get(image_id)
    if not db_image:
        raise HTTPException(status_code=404, detail=f"Image with id {db_image} not found")
    filepath = os.path.join(config.MEDIA_ROOT, db_image.name)
    return filepath


@app.delete("/image/{image_id}", response_model=schemas.Image)
def delete_image(image_id: int, db: Session = Depends(get_db)):
    db_image = db.query(models.Image).get(image_id)
    if not db_image:
        raise HTTPException(status_code=404, detail=f"Image with id {db_image} not found")
    else:
        db.delete(db_image)
        db.commit()
    return db_image


def save_image(name, data):
    filepath = os.path.join(config.MEDIA_ROOT, name)
    with open(filepath, 'wb') as f:
        f.write(data)


def delete_image(name):
    filepath = os.path.join(config.MEDIA_ROOT, name)
    if os.path.exists(filepath):
        os.remove(filepath)


@app.post("/project/{project_id}/images/", response_model=List[schemas.Image])
def create_image(project_id: int, files: List[UploadFile] = File(...), db: Session = Depends(get_db)):
    db_project = db.query(models.Project).get(project_id)
    if not db_project:
        raise HTTPException(status_code=404, detail=f"Project with id {project_id} not found")
    else:
        db_images = []
        for file in files:
            # upload file to MEDIA_ROOT
            _, filext = os.path.splitext(file.filename)
            filename = f"{str(uuid.uuid4())}{filext}"
            contents = file.file.read()
            save_image(filename, contents)

            # add image DB entry
            db_image = models.Image(name=filename, project_id=project_id)
            db.add(db_image)
            db.commit()

            # add annotation DB entry
            db_annotation = models.Annotation(id=db_image.id)
            db.add(db_annotation)
            db.commit()

            db.refresh(db_image)
            db_images.append(db_image)
    return db_images


##########################################################################################
#
# Hooks for automatic deletion of attached image files
#
##########################################################################################

images_to_delete = []

@event.listens_for(models.Image, 'after_delete')
def receive_after_delete(mapper, connection, target):
    """Register which image files must be deleted."""
    global images_to_delete
    images_to_delete.append(target.name)


@event.listens_for(Session, 'after_commit')
def receive_after_commit(session):
    """Delete registered image files."""
    global images_to_delete
    for image_name in images_to_delete:
        delete_image(image_name)
    images_to_delete = []


@event.listens_for(Session, 'after_rollback')
def receive_after_rollback(session):
    """Deregister image files."""
    global images_to_delete
    images_to_delete = []


##########################################################################################
#
# Annotation API
#
##########################################################################################


@app.get("/annotation_ids/", response_model=List[int])
def get_annotation_ids(db: Session = Depends(get_db)):
    annotation_ids = []
    db_annotations = db.query(models.Annotation).all()
    for db_annotation in db_annotations:
        if len(db_annotation.data):
            annotation_ids.append(db_annotation.id)
    return annotation_ids


@app.get("/annotation/{image_id}", response_model=schemas.Annotation)
def get_annotation(image_id: int, db: Session = Depends(get_db)):
    db_annotation = db.query(models.Annotation).get(image_id)
    if not db_annotation:
        raise HTTPException(status_code=404, detail=f"Annotation with id {image_id} not found")
    return db_annotation


from fastapi.encoders import jsonable_encoder
@app.put("/annotation/{image_id}", response_model=schemas.Annotation)
def update_annotation(image_id: int, annotation: schemas.AnnotationCreate, db: Session = Depends(get_db)):
    db_annotation_query = db.query(models.Annotation).filter(models.Annotation.id == image_id)
    db_annotation = db_annotation_query.first()
    if not db_annotation:
        raise HTTPException(status_code=404, detail=f"Annotation with id {image_id} not found")
    else:
        annotation_dict = annotation.dict()
        db_annotation_query.update(annotation_dict, synchronize_session=False)
        db.commit()
        db.refresh(db_annotation)
        db_annotation = jsonable_encoder(db_annotation)
    print("db_annotation", db_annotation)
    return db_annotation