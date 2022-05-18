import uuid
import os
import tempfile
import zipfile
import json
import shutil
import copy
import io
import re

from datetime import datetime
from typing import List
from functools import lru_cache

import filetype
from fastapi import Depends, FastAPI, HTTPException, File, UploadFile, BackgroundTasks, Request
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.encoders import jsonable_encoder
from sqlalchemy import event
from sqlalchemy.orm import Session
from sqlalchemy.exc import NoResultFound
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from . import models, schemas
from .database import SessionLocal, engine
from .config import config

models.Base.metadata.create_all(bind=engine)

images_to_delete = []

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_app(config):
    app = FastAPI()
    app.state.config = config

    # to fix CORS access error
    app.add_middleware(
        CORSMiddleware,
        allow_origins=config["cors_origins"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    ##########################################################################################
    #
    # Frontend
    #
    ##########################################################################################

    from fastapi.encoders import jsonable_encoder
    from fastapi.responses import JSONResponse


    app.mount("/static", StaticFiles(directory="app/frontend/static"), name="static")
    templates = Jinja2Templates(directory="app/frontend/templates")


    @app.get('/', response_class=HTMLResponse)
    @app.get('/projectsfrontend', response_class=HTMLResponse)
    def projects(request: Request):
        return templates.TemplateResponse("projects.html", {"request": request, "api_url": app.state.config["api_url"]})


    @app.get('/add', response_class=HTMLResponse)
    async def add_project(request: Request):
        return templates.TemplateResponse("add_edit_project.html", {"request": request, "api_url": app.state.config["api_url"], "project_id": None, "mode": "add"})


    @app.get('/get_edit_project_url', response_class=HTMLResponse)
    async def get_edit_project_url(request: Request, project_id: int):
        return JSONResponse(content=jsonable_encoder({"url": f'/edit/{project_id}'}))


    @app.get('/edit/{project_id}')
    async def edit_project(request: Request, project_id: int):
        return templates.TemplateResponse("add_edit_project.html", {"request": request, "api_url": app.state.config["api_url"], "project_id": project_id, "mode": "edit"})


    @app.get('/get_editor_url', response_class=HTMLResponse)
    async def get_editor_url(request: Request, project_id: int):
        return JSONResponse(content=jsonable_encoder({"url": f'/editor/{project_id}'}))


    @app.get('/editor/{project_id}', response_class=HTMLResponse)
    async def editor(request: Request, project_id: int):
        return templates.TemplateResponse("editor.html", {"request": request, "api_url": app.state.config["api_url"], "project_id": project_id})


    ##########################################################################################
    #
    # Project API
    #
    ##########################################################################################


    @app.post("/projects/", response_model=schemas.Project, status_code=201)
    def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db)):
        now = datetime.now()
        db_project = models.Project(**project.dict(), created=now, edited=now)
        db.add(db_project)
        db.commit()
        db.refresh(db_project)
        return db_project


    @app.get("/projects/", response_model=List[schemas.Project], status_code=200)
    def get_projects(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
        db_projects = db.query(models.Project).offset(skip).limit(limit).all()
        return db_projects


    @app.get("/project/{project_id}", response_model=schemas.Project, status_code=200)
    def get_project(project_id: int, db: Session = Depends(get_db)):
        db_project = db.query(models.Project).get(project_id)
        if not db_project:
            raise HTTPException(status_code=404, detail=f"Project with id {project_id} not found")
        return db_project


    @app.delete("/project/{project_id}", response_model=schemas.Project, status_code=200)
    def delete_project(project_id: int, db: Session = Depends(get_db)):
        db_project = db.query(models.Project).get(project_id)
        if not db_project:
            raise HTTPException(status_code=404, detail=f"Project with id {project_id} not found")
        else:
            db.delete(db_project)
            db.commit()
        return db_project


    @app.put("/project/{project_id}", response_model=schemas.Project, status_code=200)
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


    @app.get("/project/{project_id}/images/", response_model=List[schemas.Image], status_code=200)
    def get_images(project_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
        images = db.query(models.Image).filter(models.Image.project_id == project_id).offset(skip).limit(limit).all()
        return images


    @app.get("/image/{image_id}", response_model=schemas.Image, status_code=200)
    def get_image(image_id: int, db: Session = Depends(get_db)):
        db_image = db.query(models.Image).get(image_id)
        if not db_image:
            raise HTTPException(status_code=404, detail=f"Image with id {db_image} not found")
        return db_image


    @app.get("/image_file/{image_id}", response_class=FileResponse, status_code=200)
    def get_image_file(image_id: int, db: Session = Depends(get_db)):
        db_image = db.query(models.Image).get(image_id)
        if not db_image:
            raise HTTPException(status_code=404, detail=f"Image with id {db_image} not found")
        filepath = os.path.join(app.state.config["media_root"], f"project_{db_image.project_id}", db_image.name)
        return filepath


    @app.delete("/image/{image_id}", response_model=schemas.Image, status_code=200)
    def delete_image(image_id: int, db: Session = Depends(get_db)):
        db_image = db.query(models.Image).get(image_id)
        if not db_image:
            raise HTTPException(status_code=404, detail=f"Image with id {db_image} not found")
        else:
            db.delete(db_image)
            db.commit()
        return db_image


    def save_image(name, project_id, data):
        filepath = os.path.join(app.state.config["media_root"], f"project_{project_id}", name)
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        with open(filepath, 'wb') as f:
            f.write(data)


    def delete_image(name, project_id):
        image_dir = os.path.join(app.state.config["media_root"], f"project_{project_id}")
        image_file = os.path.join(image_dir, name)
        try:
            os.remove(image_file)
        except FileNotFoundError:
            pass        
        try:
            os.rmdir(image_dir)
        except (OSError, FileNotFoundError):  # directory not empty or not found
            pass


    @app.post("/project/{project_id}/images/", response_model=List[schemas.Image], status_code=201)
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


    ##########################################################################################
    #
    # Annotation API
    #
    ##########################################################################################


    @app.get("/annotation_ids/", response_model=List[int], status_code=200)
    def get_annotation_ids(db: Session = Depends(get_db)):
        annotation_ids = []
        db_annotations = db.query(models.Annotation).all()
        for db_annotation in db_annotations:
            if len(db_annotation.data):
                annotation_ids.append(db_annotation.id)
        return annotation_ids


    @app.get("/annotation/{image_id}", response_model=schemas.Annotation, status_code=200)
    def get_annotation(image_id: int, db: Session = Depends(get_db)):
        db_annotation = db.query(models.Annotation).get(image_id)
        if not db_annotation:
            raise HTTPException(status_code=404, detail=f"Annotation with id {image_id} not found")
        return db_annotation


    @app.put("/annotation/{image_id}", response_model=schemas.Annotation, status_code=200)
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
        return db_annotation


    ##########################################################################################
    #
    # Project Import / Export API
    #
    ##########################################################################################


    def strip_annotation(annotation_data):
        """Cleanup up the annotation JSON."""
        stripped = {}
        stripped["image"] = copy.deepcopy(annotation_data["image"])
        stripped["grid_cells"] = copy.deepcopy(annotation_data["grid_cells"])
        # remove ids from corners in PV modules
        try:
            for p in stripped["grid_cells"]:
                corners = p["corners"]
                for corner in corners:
                    del corner["id"]
        except KeyError:
            pass
        return stripped


    def cleanup(filepath):
        shutil.rmtree(filepath)


    @app.get("/export/{project_id}", status_code=200)
    def export_project(project_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):

        # create temporary zip file
        temp_dir = tempfile.mkdtemp()
        filename = f"project_{project_id}.zip"
        filepath = os.path.join(temp_dir, filename)
        with zipfile.ZipFile(filepath, mode="w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zip_file:

            # store project data in zip
            db_project = db.query(models.Project).get(project_id)
            if not db_project:
                raise HTTPException(status_code=404, detail=f"Project with id {project_id} not found")

            project_meta = {
                "version": "v1.0",  # version of the export file spec
                "id": db_project.id,
                "name": db_project.name,
                "description": db_project.description,
                "created": db_project.created,
                "edited": db_project.edited
            }

            zip_file.writestr(
                "project.json", 
                data=json.dumps(
                    project_meta, 
                    ensure_ascii=False,
                    default=str
                )
            )

            # store images and annotations in zip
            images = db.query(models.Image).filter(models.Image.project_id == project_id).all()
            for image in images:

                # store image files
                image_filepath = os.path.join(app.state.config["media_root"], f"project_{project_id}", image.name)
                image_arcname = os.path.join("images", os.path.basename(image_filepath))
                zip_file.write(image_filepath, image_arcname)

                # store annotations and stripped down annotations into zip
                image_name = os.path.splitext(image.name)[0]
                db_annotation = db.query(models.Annotation).get(image.id)
                if not db_annotation:
                    raise NoResultFound(f"Annotation with id {image.id} not found.")  # should never happen

                annotation_data = db_annotation.data

                if len(annotation_data):
                    annotation_data_stripped = strip_annotation(annotation_data)

                    zip_file.writestr(
                        os.path.join("annotations", f"{image_name}.json"), 
                        data=json.dumps(
                            annotation_data_stripped, 
                            ensure_ascii=False,
                        )
                    )

                    zip_file.writestr(
                        os.path.join("save", f"{image_name}.json"), 
                        data=json.dumps(
                            annotation_data, 
                            ensure_ascii=False,
                        )
                    )
                
                zip_file.testzip()

        background_tasks.add_task(cleanup, temp_dir)
        return FileResponse(
            filepath,
            media_type="application/x-zip-compressed",
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Cache-Control": "no-cache",
            }
        )


    def validate_imported_file(zip_file):
        members = zip_file.namelist()
        if not 'project.json' in members:
            return False

        with zip_file.open("project.json", "r") as project_zipped:
            project_meta = json.loads(project_zipped.read())
            if not set(project_meta.keys()) == set(['version', 'id', 'name', 'description', 'created', 'edited']):
                return False
            if not isinstance(project_meta["id"], int):
                return False
            if not isinstance(project_meta["version"], str):
                return False
            if not isinstance(project_meta["name"], str):
                return False
            if not isinstance(project_meta["description"], str):
                return False

        members.remove('project.json')
        regex = re.compile(r'^(images|annotations|save)(\\|\/)[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(json|JSON|[A-Za-z]{3,4})$', re.I)
        if not all([bool(regex.fullmatch(member)) for member in members]):
            return False

        return True


    @app.post("/import/", response_model=schemas.Project, status_code=201)
    def import_project(file: UploadFile, db: Session = Depends(get_db)):
        # receive zip file
        contents = file.file.read()

        # validate it is a zip file
        if not zipfile.is_zipfile(io.BytesIO(contents)):
            raise HTTPException(status_code=422, detail=f"Uploaded file is not a valid zip archive.")
        
        zip_file = zipfile.ZipFile(io.BytesIO(contents), "r")
        assert zip_file.testzip() == None
        if not validate_imported_file(zip_file):
            raise HTTPException(status_code=422, detail=f"Uploaded file is not a valid project archive.")

        # add project DB entry
        with zip_file.open("project.json", "r") as project_zipped:
            project_meta = json.loads(project_zipped.read())
            now = datetime.now()
            db_project = models.Project(
                name=project_meta["name"], 
                description=project_meta["description"], 
                created=now, 
                edited=now
            )
            db.add(db_project)
            db.commit()
            db.refresh(db_project)

        members = zip_file.namelist()
        members.remove('project.json')

        for member in members:
            basename, filename = os.path.split(member)
            if basename != "images":
                continue

            # extract images and add image DB entries
            image_member = os.path.join("images", filename)
            os.makedirs(os.path.join(app.state.config["media_root"], f"project_{db_project.id}"), exist_ok=True)
            with open(os.path.join(app.state.config["media_root"], f"project_{db_project.id}", filename), "wb") as image_file:
                with zip_file.open(image_member, "r") as image_data:
                    image_file.write(image_data.read())

            db_image = models.Image(name=filename, project_id=db_project.id)
            db.add(db_image)
            db.commit()
            db.refresh(db_image)

            # add annotation DB entries
            image_uuid = os.path.splitext(filename)[0]
            annotation_member = os.path.join("save", f"{image_uuid}.json")
            if annotation_member in members:
                with zip_file.open(annotation_member, "r") as annotation_file:
                    annotation = json.loads(annotation_file.read())     
            else:
                annotation = {}

            db_annotation = models.Annotation(id=db_image.id, data=annotation)
            db.add(db_annotation)
            db.commit()

        return db_project

    return app


app = create_app(config)


