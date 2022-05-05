import os
import glob
import shutil

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from .. import config
from ..database import Base
from ..main import app, get_db

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


@pytest.fixture()
def test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


##########################################################################################
#
# Project API
#
##########################################################################################


def create_project(name="Name", description="Description"):
    """Helper function to create and evaluate a project."""
    response = client.post(
        "/projects/",
        headers={"Content-Type": "application/json", "accept": "application/json"},
        json={"name": name, "description": description},
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["name"] == name
    assert data["description"] == description
    assert data["images"] == []
    assert set(data.keys()) == set(["name", "description", "id", "created", "edited", "images"])
    project_id = data["id"]
    return project_id, name, description


def delete_project(project_id, name, description):
    """Helper function to delete a project."""
    response = client.delete(f"/project/{project_id}")
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["name"] == name
    assert data["description"] == description
    assert data["images"] == []
    assert set(data.keys()) == set(["name", "description", "id", "created", "edited", "images"])


def test_create_and_get_project(test_db):
    project_id, name, description = create_project()

    # get projects
    response = client.get(f"/project/{project_id}")
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["name"] == name
    assert data["description"] == description
    assert data["images"] == []
    assert set(data.keys()) == set(["name", "description", "id", "created", "edited", "images"])


def test_create_project_name_null(test_db):
    response = client.post(
        "/projects/",
        headers={"Content-Type": "application/json", "accept": "application/json"},
        json={"name": None, "description": "My Description"},
    )
    assert response.status_code == 422, response.text


def test_create_project_description_null(test_db):
    create_project(name="Name", description=None)


def test_try_get_non_existing_project(test_db):
    project_id = -1
    response = client.get(f"/project/{project_id}")
    assert response.status_code == 404, response.text


def test_create_and_delete_project(test_db):
    project_id, name, description = create_project()

    # delete project
    delete_project(project_id, name, description)

    # make sure the project with this project_id has been deleted
    response = client.get(f"/projects/")
    assert response.status_code == 200, response.text
    data = response.json()
    project_ids = [project["id"] for project in data]
    assert project_id not in project_ids

    response = client.get(f"/project/{project_id}")
    assert response.status_code == 404


def test_try_delete_non_existing_project(test_db):
    project_id = -1
    response = client.delete(f"/project/{project_id}")
    assert response.status_code == 404


def test_create_and_update_project(test_db):
    project_id, _, _ = create_project()

    new_name = "Name 123"
    new_description = "Description 123"

    # update project
    response = client.put(
        f"/project/{project_id}",
        headers={"Content-Type": "application/json", "accept": "application/json"},
        json={"name": new_name, "description": new_description},
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["name"] == new_name
    assert data["description"] == new_description
    assert data["images"] == []
    assert set(data.keys()) == set(["name", "description", "id", "created", "edited", "images"])


def test_create_and_update_project_name_null(test_db):
    project_id, _, _ = create_project()
    response = client.put(
        f"/project/{project_id}",
        headers={"Content-Type": "application/json", "accept": "application/json"},
        json={"name": None, "description": "Description 123"},
    )
    assert response.status_code == 422, response.text


def test_create_and_update_project_description_null(test_db):
    project_id, _, _ = create_project()

    new_name = "Name 123"
    new_description = None

    response = client.put(
        f"/project/{project_id}",
        headers={"Content-Type": "application/json", "accept": "application/json"},
        json={"name": new_name, "description": new_description},
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["name"] == new_name
    assert data["description"] == new_description
    assert data["images"] == []
    assert set(data.keys()) == set(["name", "description", "id", "created", "edited", "images"])


def test_try_update_non_existing_project(test_db):
    project_id = -1
    response = client.put(
        f"/project/{project_id}",
        headers={"Content-Type": "application/json", "accept": "application/json"},
        json={"name": "Name 123", "description": "Description 123"},
    )
    assert response.status_code == 404, response.text


##########################################################################################
#
# Image API
#
##########################################################################################


def create_images(project_id):
    """Helper function to upload and evaluate two images."""
    # clear image upload directory
    try:
        shutil.rmtree("images")
    except FileNotFoundError:
        pass
    os.makedirs("images", exist_ok=True)

    # upload files
    filenames = ["test_image_1.jpg", "test_image_2.jpg"]
    with open(filenames[0], "rb") as f1, open(filenames[1], "rb") as f2:
        files = [
            ("files", (filenames[0], f1, "image/jpeg")),
            ("files", (filenames[1], f2, "image/jpeg"))
        ]
        response = client.post(f"/project/{project_id}/images/", files=files)

    # confirm files are uploaded to images directory
    assert len(glob.glob(os.path.join("images", "*.jpg"))) == 2

    assert response.status_code == 200, response.text
    data = response.json()
    assert len(data) == 2
    assert set(data[0].keys()) == set(["name", "id", "project_id"])
    assert set(data[1].keys()) == set(["name", "id", "project_id"])
    assert data[0]["project_id"] == project_id
    assert data[1]["project_id"] == project_id
    return [data[0]["id"], data[0]["name"], data[1]["id"], data[1]["name"]]


def load_files(filenames):
    for name in filenames:
        filepath = os.path.join(config.MEDIA_ROOT, name)
        with open(filepath, "rb") as f:
            pass


def test_create_and_get_images(test_db):
    # create project
    project_id, _, _ = create_project()
    image_id1, name1, image_id2, name2 = create_images(project_id)

    # get image by image id
    response = client.get(f"/image/{image_id1}")
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["name"] == name1
    assert data["id"] == image_id1
    assert set(data.keys()) == set(["name", "id", "project_id"])

    # get images by project id
    response = client.get(f"/project/{project_id}/images/")
    assert response.status_code == 200, response.text
    data = response.json()
    assert type(data) == list
    assert len(data) == 2
    assert data[0]["id"] == image_id1
    assert data[1]["id"] == image_id2
    assert data[0]["name"] == name1
    assert data[1]["name"] == name2
    assert set(data[0].keys()) == set(["name", "id", "project_id"])
    assert set(data[1].keys()) == set(["name", "id", "project_id"])


def test_try_get_non_existing_image(test_db):
    image_id = -1
    response = client.get(f"/image/{image_id}")
    assert response.status_code == 404


def test_try_create_image_non_existing_project(test_db):
    project_id = -1
    filenames = ["test_image_1.jpg", "test_image_2.jpg"]
    with open(filenames[0], "rb") as f1, open(filenames[1], "rb") as f2:
        files = [
            ("files", (filenames[0], f1, "image/jpeg")),
            ("files", (filenames[1], f2, "image/jpeg"))
        ]
        response = client.post(f"/project/{project_id}/images/", files=files)
    assert response.status_code == 404, response.text


def test_try_create_empty_images_list(test_db):
    project_id, _, _ = create_project()
    response = client.post(f"/project/{project_id}/images/", files=[])
    assert response.status_code == 422, response.text


def test_create_and_delete_image(test_db):
    project_id, _, _ = create_project()
    image_id1, name1, image_id2, name2 = create_images(project_id)

    # make sure files are in images folder
    load_files([name1, name2])

    # delete images
    for image_id, name in zip([image_id1, image_id2], [name1, name2]):
        response = client.delete(f"/image/{image_id}")
        data = response.json()
        assert response.status_code == 200, response.text
        assert data["name"] == name
        assert data["project_id"] == project_id
        assert data["id"] == image_id
        assert set(data.keys()) == set(["name", "id", "project_id"])

    # make sure the image with this image_id has been deleted
    response = client.get(f"/project/{project_id}/images")
    assert response.status_code == 200, response.text
    data = response.json()
    assert data == []

    for image_id in [image_id1, image_id2]:
        response = client.get(f"/image/{image_id}")
        assert response.status_code == 404, response.text

    # make sure image files are deleted as well
    assert len(glob.glob(os.path.join("images", "*.jpg"))) == 0
    with pytest.raises(FileNotFoundError):
        load_files([name1, name2])


def test_try_delete_non_existing_image(test_db):
    image_id = -1
    response = client.delete(f"/image/{image_id}")
    assert response.status_code == 404, response.text


def test_delete_project_deletes_images(test_db):
    """Test if deleting a project also deletes associated images."""
    project_id, _, _ = create_project()
    image_id1, name1, image_id2, name2 = create_images(project_id)

    # check if images exist
    response = client.get(f"/image/{image_id1}")
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["name"] == name1
    assert data["id"] == image_id1
    assert set(data.keys()) == set(["name", "id", "project_id"])
    
    response = client.get(f"/image/{image_id2}")
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["name"] == name2
    assert data["id"] == image_id2
    assert set(data.keys()) == set(["name", "id", "project_id"])
    
    # delete project
    response = client.delete(f"/project/{project_id}")
    assert response.status_code == 200, response.text

    # make sure images are deleted as well
    response = client.get(f"/image/{image_id1}")
    assert response.status_code == 404, response.text
    response = client.get(f"/image/{image_id2}")
    assert response.status_code == 404, response.text

    # make sure image files are deleted as well
    with pytest.raises(FileNotFoundError):
        load_files([name1, name2])


##########################################################################################
#
# Annotation API
#
##########################################################################################


def confirm_anotation_exists(image_id):
    response = client.get(f"/annotation/{image_id}")
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["id"] == image_id
    assert data["data"] == {}
    assert set(data.keys()) == set(["id", "data"])


def test_create_image_creates_annotation(test_db):
    project_id, _, _ = create_project()
    image_id1, _, image_id2, _ = create_images(project_id)

    for image_id in [image_id1, image_id2]:
        confirm_anotation_exists(image_id)


def test_delete_image_deletes_annotation(test_db):
    project_id, _, _ = create_project()
    image_id1, _, image_id2, _ = create_images(project_id)

    for image_id in [image_id1, image_id2]:
        confirm_anotation_exists(image_id)

    for image_id in [image_id1, image_id2]:
        # delete image
        response = client.delete(f"/image/{image_id}")
        assert response.status_code == 200, response.text

        # make sure related annotation is deleted
        response = client.get(f"/annotation/{image_id}")
        assert response.status_code == 404, response.text


def test_update_annotation(test_db):
    project_id, _, _ = create_project()
    image_id1, _, image_id2, _ = create_images(project_id)

    for image_id in [image_id1, image_id2]:
        confirm_anotation_exists(image_id)

    # update annotation
    new_data = {"image": "516ce9e2-fd78-4b0a-9d54-3cafc224a580.jpg", "grid_cells": [{"corners": [{"x": 628.1555178074648, "y": 555.6936223629666, "id": "dc75a572-a1f3-421c-8b27-a56c5ac6d48c"}, {"x": 506.7893166203104, "y": 556.3686265351816, "id": "90f40779-d3e3-47cf-bc9a-0eb950c89336"}, {"x": 507.3894038067126, "y": 582.0948804038808, "id": "3608bd12-4b9d-4897-b735-4b08937cdb7d"}, {"x": 628.6076629892434, "y": 581.461720391297, "id": "6ccdb989-5d92-4e5a-be68-676bfe6d9b14"}], "center": {"x": 567.7354753059328, "y": 568.9047124233315}, "id": "bd25ff5d-82c0-495d-a144-a6af298c0af2", "truncated": False}]}
    response = client.put(
        f"/annotation/{image_id}",
        headers={"Content-Type": "application/json", "accept": "application/json"},
        json={"data": new_data},
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["id"] == image_id
    assert data["data"] == new_data
    assert set(data.keys()) == set(["id", "data"])


def test_get_annotation_ids(test_db):
    response = client.get(f"/annotation_ids/")
    assert response.status_code == 200, response.text
    data = response.json()
    assert data == []

    project_id, _, _ = create_project()
    image_id1, _, image_id2, _ = create_images(project_id)

    response = client.get(f"/annotation_ids/")
    assert response.status_code == 200, response.text
    data = response.json()
    assert data == [image_id1, image_id2]




