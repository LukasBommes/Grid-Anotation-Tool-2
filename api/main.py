import uuid
import os

from datetime import datetime
from typing import List

from fastapi import Depends, FastAPI, HTTPException, File, UploadFile
from sqlalchemy import event
from sqlalchemy.orm import Session

from . import config, models, schemas
from .database import SessionLocal, engine

models.Base.metadata.create_all(bind=engine)

app = FastAPI()


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
def get_projects(project_id: int, db: Session = Depends(get_db)):
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


@app.post("/project/{project_id}/images/", response_model=schemas.Image)
def create_image(project_id: int, image: schemas.ImageCreate, db: Session = Depends(get_db)):
    db_project = db.query(models.Project).get(project_id)
    if not db_project:
        raise HTTPException(status_code=404, detail=f"Project with id {project_id} not found")
    else:
        db_image = models.Image(**image.dict(), project_id=project_id)
        db.add(db_image)
        db.commit()
        db.refresh(db_image)
    return db_image


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


@app.delete("/image/{image_id}", response_model=schemas.Image)
def delete_image(image_id: int, db: Session = Depends(get_db)):
    db_image = db.query(models.Image).get(image_id)
    if not db_image:
        raise HTTPException(status_code=404, detail=f"Image with id {db_image} not found")
    else:
        db.delete(db_image)
        db.commit()
    return db_image


##########################################################################################
#
# File Upload API
#
##########################################################################################

def save_file(filename, data):
    with open(filename, 'wb') as f:
        f.write(data)


def delete_image(filename):
    if os.path.exists(filename):
        os.remove(filename)


# TODO:
# - write tests for this method
@app.post("/project123/{project_id}/images/", response_model=List[schemas.Image])
def create_image_file(project_id: int, files: List[UploadFile] = File(...), db: Session = Depends(get_db)):
    db_project = db.query(models.Project).get(project_id)
    if not db_project:
        raise HTTPException(status_code=404, detail=f"Project with id {project_id} not found")
    else:
        filenames = []
        db_images = []
        for file in files:
            # upload file to MEDIA_ROOT
            _, filext = os.path.splitext(file.filename)
            filename = os.path.join(config.MEDIA_ROOT, f"{str(uuid.uuid4())}{filext}")
            filenames.append(filename)
            contents = file.file.read()
            save_file(filename, contents)

            # add DB entry with file path
            db_image = models.Image(name=filename, project_id=project_id)
            db.add(db_image)
            db.commit()
            db.refresh(db_image)
            db_images.append(db_image)
    return db_images


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



# @app.get("/")
# async def main():
#     content = """
# <body>
# <form action="/files/" enctype="multipart/form-data" method="post">
# <input name="files" type="file" multiple>
# <input type="submit">
# </form>
# <form action="/uploadfiles/" enctype="multipart/form-data" method="post">
# <input name="files" type="file" multiple>
# <input type="submit">
# </form>
# </body>
#     """
#     return HTMLResponse(content=content)