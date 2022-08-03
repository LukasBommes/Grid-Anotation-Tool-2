import os
import tempfile
import zipfile
import json
import shutil
import copy
import io
import re

from datetime import datetime
from typing import List, Union

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    BackgroundTasks,
    Response,
)
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import NoResultFound
from sqlalchemy import and_

from .. import models, schemas
from ..dependencies import get_db
from ..auth import get_current_active_user


def get_project_(project_id, db, current_user):
    db_project_query = db.query(models.Project).filter(
        and_(
            models.Project.username == current_user.username,
            models.Project.id == project_id,
        )
    )
    db_project = db_project_query.first()
    if not db_project:
        raise HTTPException(
            status_code=404, detail=f"Project with id {project_id} not found"
        )
    return db_project, db_project_query


def create_router(settings):

    router = APIRouter()

    ##########################################################################################
    #
    # Project CRUD
    #
    ##########################################################################################

    @router.post("/projects/", response_model=schemas.Project, status_code=201)
    def create_project(
        project: schemas.ProjectCreate,
        db: Session = Depends(get_db),
        current_user: schemas.User = Depends(get_current_active_user),
    ):
        now = datetime.now()
        db_project = models.Project(
            **project.dict(), created=now, edited=now, username=current_user.username
        )
        db.add(db_project)
        db.commit()
        db.refresh(db_project)
        return db_project

    @router.get("/projects/", response_model=List[schemas.Project], status_code=200)
    def get_projects(
        response: Response,
        skip: int = 0,
        limit: Union[int, None] = None,
        orderby: str = "name",
        orderdir: str = "asc",
        db: Session = Depends(get_db),
        current_user: schemas.User = Depends(get_current_active_user),
    ):
        db_projects_query = db.query(models.Project).filter(
            models.Project.username == current_user.username
        )
        response.headers["X-Total-Count"] = json.dumps(db_projects_query.count())
        ordered_column = getattr(getattr(models.Project, orderby), orderdir)()
        db_projects = (
            db_projects_query.order_by(ordered_column).offset(skip).limit(limit).all()
        )
        return db_projects

    @router.get(
        "/project/{project_id}", response_model=schemas.Project, status_code=200
    )
    def get_project(
        project_id: int,
        db: Session = Depends(get_db),
        current_user: schemas.User = Depends(get_current_active_user),
    ):
        db_project, _ = get_project_(project_id, db, current_user)
        return db_project

    @router.delete(
        "/project/{project_id}", response_model=schemas.Project, status_code=200
    )
    def delete_project(
        project_id: int,
        db: Session = Depends(get_db),
        current_user: schemas.User = Depends(get_current_active_user),
    ):
        db_project, _ = get_project_(project_id, db, current_user)
        db.delete(db_project)
        db.commit()
        return db_project

    @router.put(
        "/project/{project_id}", response_model=schemas.Project, status_code=200
    )
    def update_project(
        project_id: int,
        project: schemas.ProjectCreate,
        db: Session = Depends(get_db),
        current_user: schemas.User = Depends(get_current_active_user),
    ):
        db_project, db_project_query = get_project_(project_id, db, current_user)
        project_dict = project.dict()
        project_dict.update({"edited": datetime.now()})
        db_project_query.update(project_dict, synchronize_session=False)
        db.commit()
        return db_project

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

    @router.get("/export/{project_id}", status_code=200)
    def export_project(
        project_id: int,
        background_tasks: BackgroundTasks,
        db: Session = Depends(get_db),
        current_user: schemas.User = Depends(get_current_active_user),
    ):
        # create temporary zip file
        temp_dir = tempfile.mkdtemp()
        filename = f"project_{project_id}.zip"
        filepath = os.path.join(temp_dir, filename)
        with zipfile.ZipFile(
            filepath, mode="w", compression=zipfile.ZIP_DEFLATED, compresslevel=9
        ) as zip_file:

            # store project data in zip
            db_project, _ = get_project_(project_id, db, current_user)

            project_meta = {
                "version": "v1.0",  # version of the export file spec
                "id": db_project.id,
                "name": db_project.name,
                "description": db_project.description,
                "created": db_project.created,
                "edited": db_project.edited,
            }

            zip_file.writestr(
                "project.json",
                data=json.dumps(project_meta, ensure_ascii=False, default=str),
            )

            # store images and annotations in zip
            images = (
                db.query(models.Image)
                .filter(
                    and_(
                        models.Image.username == current_user.username,
                        models.Image.project_id == project_id,
                    )
                )
                .all()
            )
            for image in images:

                # store image files
                image_filepath = os.path.join(
                    settings.MEDIA_ROOT, f"project_{project_id}", image.name
                )
                image_arcname = os.path.join("images", os.path.basename(image_filepath))
                zip_file.write(image_filepath, image_arcname)

                # store annotations and stripped down annotations into zip
                image_name = os.path.splitext(image.name)[0]
                db_annotation = db.query(models.Annotation).get(image.id)
                if not db_annotation:
                    raise NoResultFound(
                        f"Annotation with id {image.id} not found."
                    )  # should never happen

                annotation_data = db_annotation.data

                if len(annotation_data):
                    annotation_data_stripped = strip_annotation(annotation_data)

                    zip_file.writestr(
                        os.path.join("annotations", f"{image_name}.json"),
                        data=json.dumps(
                            annotation_data_stripped,
                            ensure_ascii=False,
                        ),
                    )

                    zip_file.writestr(
                        os.path.join("save", f"{image_name}.json"),
                        data=json.dumps(
                            annotation_data,
                            ensure_ascii=False,
                        ),
                    )

            zip_file.testzip()

        background_tasks.add_task(cleanup, temp_dir)
        return FileResponse(
            filepath,
            media_type="application/x-zip-compressed",
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Cache-Control": "no-cache",
            },
        )

    def validate_imported_file(zip_file):
        members = zip_file.namelist()
        if not "project.json" in members:
            return False

        with zip_file.open("project.json", "r") as project_zipped:
            project_meta = json.loads(project_zipped.read())
            if not set(project_meta.keys()) == set(
                ["version", "id", "name", "description", "created", "edited"]
            ):
                return False
            if not isinstance(project_meta["id"], int):
                return False
            if not isinstance(project_meta["version"], str):
                return False
            if not isinstance(project_meta["name"], str):
                return False
            if not isinstance(project_meta["description"], str):
                return False

        members.remove("project.json")
        regex = re.compile(
            r"^(images|annotations|save)(\\|\/)[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(json|JSON|[A-Za-z]{3,4})$",
            re.I,
        )
        if not all([bool(regex.fullmatch(member)) for member in members]):
            return False

        return True

    @router.post("/import/", response_model=schemas.Project, status_code=201)
    def import_project(
        file: UploadFile,
        db: Session = Depends(get_db),
        current_user: schemas.User = Depends(get_current_active_user),
    ):
        # receive zip file
        contents = file.file.read()

        # validate it is a zip file
        if not zipfile.is_zipfile(io.BytesIO(contents)):
            raise HTTPException(
                status_code=422, detail=f"Uploaded file is not a valid zip archive."
            )

        zip_file = zipfile.ZipFile(io.BytesIO(contents), "r")
        assert zip_file.testzip() == None
        if not validate_imported_file(zip_file):
            raise HTTPException(
                status_code=422, detail=f"Uploaded file is not a valid project archive."
            )

        # add project DB entry
        with zip_file.open("project.json", "r") as project_zipped:
            project_meta = json.loads(project_zipped.read())
            now = datetime.now()
            db_project = models.Project(
                name=project_meta["name"],
                description=project_meta["description"],
                created=now,
                edited=now,
                username=current_user.username,
            )
            db.add(db_project)
            db.commit()
            db.refresh(db_project)

        members = zip_file.namelist()
        members.remove("project.json")

        for member in members:
            basename, filename = os.path.split(member)
            if basename != "images":
                continue

            # extract images and add image DB entries
            image_member = os.path.join("images", filename)
            os.makedirs(
                os.path.join(settings.MEDIA_ROOT, f"project_{db_project.id}"),
                exist_ok=True,
            )
            with open(
                os.path.join(settings.MEDIA_ROOT, f"project_{db_project.id}", filename),
                "wb",
            ) as image_file:
                with zip_file.open(image_member, "r") as image_data:
                    image_file.write(image_data.read())

            db_image = models.Image(
                name=filename, project_id=db_project.id, username=current_user.username
            )
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

            db_annotation = models.Annotation(
                id=db_image.id, data=annotation, username=current_user.username
            )
            db.add(db_annotation)
            db.commit()

        return db_project

    return router
