import os
import glob
import shutil
import io
import json
import zipfile

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from .. import schemas
from ..main import create_app
from ..config import settings
from ..database import Base
from ..dependencies import get_db
from ..auth import pwd_context, get_current_active_user


TEST_BASE_DIR = "backend/tests"

test_settings = settings
settings.MEDIA_ROOT = f"{TEST_BASE_DIR}/images"
settings.SQLALCHEMY_DATABASE_URL = f"sqlite:///{TEST_BASE_DIR}/test.db"

app = create_app(test_settings)


engine = create_engine(
    settings.SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


def override_get_current_active_user():
    test_user_dict = dict(
        username="testuser",
        email=None,
        full_name=None,
        disabled=False,
    )
    return schemas.User(**test_user_dict)


app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_current_active_user] = override_get_current_active_user


client = TestClient(app)


@pytest.fixture(autouse=True)
def test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(autouse=True)
def cleanup_image_uploads():
    try:
        shutil.rmtree(os.path.join(TEST_BASE_DIR, "images"))
    except FileNotFoundError:
        print("FileNotFoundError")
        pass


##########################################################################################
#
# User API
#
##########################################################################################


def create_user(
    username="johndoe", 
    full_name="John Doe", 
    email="johndoe@example.com", 
    password="secret", 
    disabled=False
):
    response = client.post(
        "/api/users/",
        headers={"Content-Type": "application/json", "accept": "application/json"},
        json={
            "username": username,
            "full_name": full_name,
            "email": email,
            "password": password,
            "disabled": disabled
        },
    )
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["username"] == username
    assert data["full_name"] == full_name
    assert data["email"] == email
    assert data["disabled"] == disabled
    assert data["projects"] == []
    assert pwd_context.verify(password, data["hashed_password"])
    assert set(data.keys()) == set(["username", "id", "full_name", "email", "disabled", "hashed_password", "projects"])
    password_hash = data["hashed_password"]
    user_id = data["id"]
    return user_id, username, full_name, email, password, disabled, password_hash


def test_create_user():
    create_user()


@pytest.fixture()
def create_user_johndoe():
    """Creates a new user and sets it as current user. Reactivates the 
    test user dependency overwrite after test regardless of exceptions.
    """
    user_id, username, full_name, email, _, disabled, _ = create_user()
    app.dependency_overrides[get_current_active_user] = lambda: schemas.User(
        username=username,
        full_name=full_name,
        email=email,
        disabled=disabled
    )
    yield
    app.dependency_overrides[get_current_active_user] = override_get_current_active_user


def test_delete_current_user(create_user_johndoe):
    # login should succeed
    username = "johndoe"
    password = "secret"
    login(username, password)

    # delete user
    response = client.delete("/api/current_user/")
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["username"] == username
    assert data["full_name"] == "John Doe"
    assert data["email"] == "johndoe@example.com"
    assert data["disabled"] == False
    assert data["projects"] == []
    assert pwd_context.verify(password, data["hashed_password"])
    assert set(data.keys()) == set(["username", "id", "full_name", "email", "disabled", "hashed_password", "projects"])

    # login should now fail
    response = login_request(username, password)
    assert response.status_code == 401, response.text
    data = response.json()
    assert data["detail"] == "Incorrect username or password"


def test_update_current_user(create_user_johndoe):
    # login should succeed
    username = "johndoe"
    password = "secret"
    login(username, password)

    # change username and password
    new_username = "johndoe_changed"
    new_password = "newsecret"
    response = client.put(
        f"/api/current_user/",
        headers={"Content-Type": "application/json", "accept": "application/json"},
        json={
            "username": new_username,
            "full_name": "John Doe",
            "email": "johndoe@example.com",
            "password": new_password,
            "disabled": False
        },
    )
    assert response.status_code == 200, response.text
    data = response.json()    
    assert data["username"] == new_username
    assert data["full_name"] == "John Doe"
    assert data["email"] == "johndoe@example.com"
    assert data["disabled"] == False
    assert data["projects"] == []
    assert pwd_context.verify(new_password, data["hashed_password"])
    assert set(data.keys()) == set(["username", "id", "full_name", "email", "disabled", "hashed_password", "projects"])

    # login with old credentials should fail
    response = login_request(username, password)
    assert response.status_code == 401, response.text
    data = response.json()
    assert data["detail"] == "Incorrect username or password"

    # login with new credentials should succeed
    login(new_username, new_password)


def create_and_get_user_projects(username):
    create_project(name=f"user_{username}_project1", description="bla")
    create_project(name=f"user_{username}_project2", description="bla")

    response = client.get(f"/api/projects/")
    assert response.status_code == 200, response.text
    data = response.json()
    assert len(data) == 2
    assert data[0]["name"] == "user_johndoe_project1"
    assert data[0]["username"] == "johndoe"
    assert set(data[0].keys()) == set(["name", "description", "id", "created", "edited", "images", "username"])
    assert data[1]["name"] == "user_johndoe_project2"
    assert data[1]["username"] == "johndoe"
    assert set(data[1].keys()) == set(["name", "description", "id", "created", "edited", "images", "username"])


@pytest.fixture()
def fixture_users_can_access_only_own_projects():
    """Creates a user with two projects. Then creates another user and sets him as current user."""
    username_other = "otheruser"
    create_user(username=username_other)
    create_project(name=f"user_{username_other}_project1", description="bla")
    create_project(name=f"user_{username_other}_project2", description="bla")

    user_id, username, full_name, email, _, disabled, _ = create_user(username="johndoe")
    app.dependency_overrides[get_current_active_user] = lambda: schemas.User(
        username=username,
        full_name=full_name,
        email=email,
        disabled=disabled
    )
    yield
    app.dependency_overrides[get_current_active_user] = override_get_current_active_user


def test_users_can_access_only_own_projects(fixture_users_can_access_only_own_projects):
    create_and_get_user_projects("johndoe")


def test_delete_user_deletes_projects(create_user_johndoe):
    create_and_get_user_projects("johndoe")

    # delete user john doe
    response = client.delete("/api/current_user/")
    assert response.status_code == 200, response.text

    # ensure projects are deleted as well
    response = client.get(f"/api/projects/")
    assert response.status_code == 200, response.text
    assert response.json() == []



# TODO: test to create user with invalid credentials (empty strings, too short, etc.)


##########################################################################################
#
# Authentication
#
##########################################################################################


def login_request(username, password):
    response = client.post(
        "/api/token",
        data={
            "username": username,
            "password": password,
        },
    )
    return response


def login(username, password):
    response = login_request(username, password)
    assert response.status_code == 200, response.text
    data = response.json()
    assert isinstance(data["access_token"], str)
    assert data["token_type"] == "bearer"
    assert set(data.keys()) == set(["access_token", "token_type"])


def test_login_correct_credentials():
    username = "johndoe"
    password = "secret"
    create_user(username=username, password=password)
    login(username, password)


def test_login_incorrect_credentials():
    username = "johndoe"
    password = "secret"
    create_user(username=username, password=password)
    response = login_request(username, "wrongsecret")
    assert response.status_code == 401, response.text
    data = response.json()
    assert data["detail"] == "Incorrect username or password"


def test_login_non_existent_user():
    username = "johndoe"
    password = "secret"
    response = login_request(username, password)
    assert response.status_code == 401, response.text
    data = response.json()
    assert data["detail"] == "Incorrect username or password"


@pytest.fixture()
def disable_test_user_overwrite():
    """Disables the test user dependency overwrite during 
    test and activates it after test regardless of exceptions.
    """
    app.dependency_overrides[get_current_active_user] = get_current_active_user
    yield
    app.dependency_overrides[get_current_active_user] = override_get_current_active_user


def test_unauthorized_api_access(disable_test_user_overwrite):
    response = create_project_request()  # try to create a project without being authorized
    assert response.status_code == 401, response.text
    data = response.json()
    assert data["detail"] == "Not authenticated"


##########################################################################################
#
# Project API
#
##########################################################################################


def create_project_request(name="Name", description="Description"):
    response = client.post(
        "/api/projects/",
        headers={"Content-Type": "application/json", "accept": "application/json"},
        json={"name": name, "description": description},
    )
    return response


def create_project(name="Name", description="Description"):
    """Helper function to create and evaluate a project."""
    response = create_project_request(name, description)
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["name"] == name
    assert data["description"] == description
    assert data["images"] == []
    assert set(data.keys()) == set(["name", "description", "id", "created", "edited", "images", "username"])
    project_id = data["id"]
    return project_id, name, description


def delete_project(project_id, name, description):
    """Helper function to delete a project."""
    response = client.delete(f"/api/project/{project_id}")
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["name"] == name
    assert data["description"] == description
    assert data["images"] == []
    assert set(data.keys()) == set(["name", "description", "id", "created", "edited", "images", "username"])


def test_create_and_get_project():
    project_id, name, description = create_project()

    # get projects
    response = client.get(f"/api/project/{project_id}")
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["name"] == name
    assert data["description"] == description
    assert data["images"] == []
    assert set(data.keys()) == set(["name", "description", "id", "created", "edited", "images", "username"])


def test_create_project_name_null():
    response = client.post(
        "/api/projects/",
        headers={"Content-Type": "application/json", "accept": "application/json"},
        json={"name": None, "description": "My Description"},
    )
    assert response.status_code == 422, response.text


def test_create_project_description_null():
    create_project(name="Name", description=None)


def test_try_get_non_existing_project():
    project_id = -1
    response = client.get(f"/api/project/{project_id}")
    assert response.status_code == 404, response.text


def test_create_and_delete_project():
    project_id, name, description = create_project()

    # delete project
    delete_project(project_id, name, description)

    # make sure the project with this project_id has been deleted
    response = client.get(f"/api/projects/")
    assert response.status_code == 200, response.text
    data = response.json()
    project_ids = [project["id"] for project in data]
    assert project_id not in project_ids

    response = client.get(f"/api/project/{project_id}")
    assert response.status_code == 404


def test_try_delete_non_existing_project():
    project_id = -1
    response = client.delete(f"/api/project/{project_id}")
    assert response.status_code == 404


def test_create_and_update_project():
    project_id, _, _ = create_project()

    new_name = "Name 123"
    new_description = "Description 123"

    # update project
    response = client.put(
        f"/api/project/{project_id}",
        headers={"Content-Type": "application/json", "accept": "application/json"},
        json={"name": new_name, "description": new_description},
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["name"] == new_name
    assert data["description"] == new_description
    assert data["images"] == []
    assert set(data.keys()) == set(["name", "description", "id", "created", "edited", "images", "username"])


def test_create_and_update_project_name_null():
    project_id, _, _ = create_project()
    response = client.put(
        f"/api/project/{project_id}",
        headers={"Content-Type": "application/json", "accept": "application/json"},
        json={"name": None, "description": "Description 123"},
    )
    assert response.status_code == 422, response.text


def test_create_and_update_project_description_null():
    project_id, _, _ = create_project()

    new_name = "Name 123"
    new_description = None

    response = client.put(
        f"/api/project/{project_id}",
        headers={"Content-Type": "application/json", "accept": "application/json"},
        json={"name": new_name, "description": new_description},
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["name"] == new_name
    assert data["description"] == new_description
    assert data["images"] == []
    assert set(data.keys()) == set(["name", "description", "id", "created", "edited", "images", "username"])


def test_try_update_non_existing_project():
    project_id = -1
    response = client.put(
        f"/api/project/{project_id}",
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
    os.makedirs(os.path.join(TEST_BASE_DIR, "images"), exist_ok=True)

    # upload files
    filenames = ["test_image_1.jpg", "test_image_2.jpg"]
    filenames = [os.path.join(TEST_BASE_DIR, filename) for filename in filenames]
    with open(filenames[0], "rb") as f1, open(filenames[1], "rb") as f2:
        files = [
            ("files", (filenames[0], f1, "image/jpeg")),
            ("files", (filenames[1], f2, "image/jpeg"))
        ]
        response = client.post(f"/api/project/{project_id}/images/", files=files)

    # confirm files are uploaded to images directory
    assert len(glob.glob(os.path.join(TEST_BASE_DIR, "images", f"project_{project_id}", "*.jpg"))) == 2

    assert response.status_code == 201, response.text
    data = response.json()
    assert len(data) == 2
    assert set(data[0].keys()) == set(["name", "id", "project_id", "username"])
    assert set(data[1].keys()) == set(["name", "id", "project_id", "username"])
    assert data[0]["project_id"] == project_id
    assert data[1]["project_id"] == project_id
    return [data[0]["id"], data[0]["name"], data[1]["id"], data[1]["name"]]


def load_images(image_names, project_id):
    for image_name in image_names:
        filepath = os.path.join(TEST_BASE_DIR, "images", f"project_{project_id}", image_name)
        with open(filepath, "rb") as f:
            pass


def test_create_and_get_images():
    # create project
    project_id, _, _ = create_project()
    image_id1, name1, image_id2, name2 = create_images(project_id)

    # get image by image id
    response = client.get(f"/api/image/{image_id1}")
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["name"] == name1
    assert data["id"] == image_id1
    assert set(data.keys()) == set(["name", "id", "project_id", "username"])

    # get images by project id
    response = client.get(f"/api/project/{project_id}/images/")
    assert response.status_code == 200, response.text
    data = response.json()
    assert type(data) == list
    assert len(data) == 2
    assert data[0]["id"] == image_id1
    assert data[1]["id"] == image_id2
    assert data[0]["name"] == name1
    assert data[1]["name"] == name2
    assert set(data[0].keys()) == set(["name", "id", "project_id", "username"])
    assert set(data[1].keys()) == set(["name", "id", "project_id", "username"])


def test_try_get_non_existing_image():
    image_id = -1
    response = client.get(f"/api/image/{image_id}")
    assert response.status_code == 404


def test_try_create_image_non_existing_project():
    project_id = -1
    filenames = ["test_image_1.jpg", "test_image_2.jpg"]
    filenames = [os.path.join(TEST_BASE_DIR, filename) for filename in filenames]
    with open(filenames[0], "rb") as f1, open(filenames[1], "rb") as f2:
        files = [
            ("files", (filenames[0], f1, "image/jpeg")),
            ("files", (filenames[1], f2, "image/jpeg"))
        ]
        response = client.post(f"/api/project/{project_id}/images/", files=files)
    assert response.status_code == 404, response.text


def test_try_create_empty_images_list():
    project_id, _, _ = create_project()
    response = client.post(f"/api/project/{project_id}/images/", files=[])
    assert response.status_code == 422, response.text


def test_create_and_delete_image():
    project_id, _, _ = create_project()
    image_id1, name1, image_id2, name2 = create_images(project_id)

    # make sure files are in images folder
    load_images([name1, name2], project_id)

    # delete images
    for image_id, name in zip([image_id1, image_id2], [name1, name2]):
        response = client.delete(f"/api/image/{image_id}")
        data = response.json()
        assert response.status_code == 200, response.text
        assert data["name"] == name
        assert data["project_id"] == project_id
        assert data["id"] == image_id
        assert set(data.keys()) == set(["name", "id", "project_id", "username"])

    # make sure the image with this image_id has been deleted
    response = client.get(f"/api/project/{project_id}/images")
    assert response.status_code == 200, response.text
    data = response.json()
    assert data == []

    for image_id in [image_id1, image_id2]:
        response = client.get(f"/api/image/{image_id}")
        assert response.status_code == 404, response.text

    # make sure image files are deleted as well
    assert len(glob.glob(os.path.join(TEST_BASE_DIR, "images", f"project_{project_id}", "*.jpg"))) == 0
    with pytest.raises(FileNotFoundError):
        load_images([name1, name2], project_id)


def test_try_delete_non_existing_image():
    image_id = -1
    response = client.delete(f"/api/image/{image_id}")
    assert response.status_code == 404, response.text


def test_try_upload_non_image_file():
    project_id, _, _ = create_project()

    filename = os.path.join(TEST_BASE_DIR, "test_export_file.zip")
    with open(filename, "rb") as f:
        files = [
            ("files", (os.path.join(TEST_BASE_DIR, filename), f, "image/jpeg"))
        ]
        response = client.post(f"/api/project/{project_id}/images/", files=files)

        assert response.status_code == 422, response.text
        data = response.json()
        assert data["detail"] == "Uploaded file is not a valid image."


def test_delete_project_deletes_images():
    """Test if deleting a project also deletes associated images."""
    project_id, _, _ = create_project()
    image_id1, name1, image_id2, name2 = create_images(project_id)

    # check if images exist
    response = client.get(f"/api/image/{image_id1}")
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["name"] == name1
    assert data["id"] == image_id1
    assert set(data.keys()) == set(["name", "id", "project_id", "username"])
    
    response = client.get(f"/api/image/{image_id2}")
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["name"] == name2
    assert data["id"] == image_id2
    assert set(data.keys()) == set(["name", "id", "project_id", "username"])
    
    # delete project
    response = client.delete(f"/api/project/{project_id}")
    assert response.status_code == 200, response.text

    # make sure images are deleted as well
    response = client.get(f"/api/image/{image_id1}")
    assert response.status_code == 404, response.text
    response = client.get(f"/api/image/{image_id2}")
    assert response.status_code == 404, response.text

    # make sure image files are deleted as well
    with pytest.raises(FileNotFoundError):
        load_images([name1, name2], project_id)


def test_get_image_file():
    project_id, _, _ = create_project()
    image_id1, _, image_id2, _ = create_images(project_id)

    filenames = ["test_image_1.jpg", "test_image_2.jpg"]
    filenames = [os.path.join(TEST_BASE_DIR, filename) for filename in filenames]
    for image_id, test_image_name in zip([image_id1, image_id2], filenames):
        response = client.get(f"/api/image_file/{image_id}")
        assert response.status_code == 200, response.text

        with open(test_image_name, "rb") as image:
            response_image = io.BytesIO(response.content)
            assert response_image.read() == image.read()

        with open(os.path.join(TEST_BASE_DIR, "test_image_1_modified.jpg"), "rb") as image:
            response_image = io.BytesIO(response.content)
            assert response_image.read() != image.read()


def test_get_non_existing_image_file():
    image_id = -1
    response = client.get(f"/api/image_file/{image_id}")
    assert response.status_code == 404, response.text


##########################################################################################
#
# Annotation API
#
##########################################################################################


def confirm_anotation_exists(image_id):
    response = client.get(f"/api/annotation/{image_id}")
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["id"] == image_id
    assert data["data"] == {}
    assert set(data.keys()) == set(["id", "data", "username"])


def update_annotation(image_id, image_name):
    new_data = {
        "image": image_name,
        "grid_cells": [{
                "corners": [
                    {"x": 628.1555178074648, "y": 555.6936223629666, "id": "dc75a572-a1f3-421c-8b27-a56c5ac6d48c"}, 
                    {"x": 506.7893166203104, "y": 556.3686265351816, "id": "90f40779-d3e3-47cf-bc9a-0eb950c89336"}, 
                    {"x": 507.3894038067126, "y": 582.0948804038808, "id": "3608bd12-4b9d-4897-b735-4b08937cdb7d"}, 
                    {"x": 628.6076629892434, "y": 581.461720391297, "id": "6ccdb989-5d92-4e5a-be68-676bfe6d9b14"}
                ], 
                "center": {"x": 567.7354753059328, "y": 568.9047124233315},
                "id": "bd25ff5d-82c0-495d-a144-a6af298c0af2", 
                "truncated": False
            }]
    }
    response = client.put(
        f"/api/annotation/{image_id}",
        headers={"Content-Type": "application/json", "accept": "application/json"},
        json={"data": new_data, "username": "testuser"},
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["id"] == image_id
    assert data["data"] == new_data
    assert set(data.keys()) == set(["id", "data", "username"])
    return new_data


def test_create_image_creates_annotation():
    project_id, _, _ = create_project()
    image_id1, _, image_id2, _ = create_images(project_id)

    for image_id in [image_id1, image_id2]:
        confirm_anotation_exists(image_id)


def test_delete_image_deletes_annotation():
    project_id, _, _ = create_project()
    image_id1, _, image_id2, _ = create_images(project_id)

    for image_id in [image_id1, image_id2]:
        confirm_anotation_exists(image_id)

    for image_id in [image_id1, image_id2]:
        # delete image
        response = client.delete(f"/api/image/{image_id}")
        assert response.status_code == 200, response.text

        # make sure related annotation is deleted
        response = client.get(f"/api/annotation/{image_id}")
        assert response.status_code == 404, response.text


def test_update_annotation():
    project_id, _, _ = create_project()
    image_id1, image_name1, image_id2, image_name2 = create_images(project_id)

    for image_id, image_name in zip([image_id1, image_id2], [image_name1, image_name2]):
        confirm_anotation_exists(image_id)
        update_annotation(image_id, image_name)


def test_get_annotation_ids():
    response = client.get(f"/api/annotation_ids/")
    assert response.status_code == 200, response.text
    data = response.json()
    assert data == []

    project_id, _, _ = create_project()
    image_id1, image_name1, image_id2, image_name2 = create_images(project_id)

    # since annotations are empty they should not be listed
    response = client.get(f"/api/annotation_ids/")
    assert response.status_code == 200, response.text
    data = response.json()
    assert data == []

    # update annotation
    update_annotation(image_id1, image_name1)

    # now the updated annotation should be listed
    response = client.get(f"/api/annotation_ids/")
    assert response.status_code == 200, response.text
    data = response.json()
    assert data == [image_id1]


##########################################################################################
#
# Project Import / Export API
#
##########################################################################################


def check_export_file(response, project_id, project_name, project_description, image_name1, image_name2, zip_file_members_expected):
    assert response.headers["content-disposition"] == f"attachment; filename=project_{project_id}.zip"
    assert response.headers["cache-control"] == "no-cache"
    assert response.headers["content-type"] == "application/x-zip-compressed"

    # convert response back into zipfile
    zip_file = zipfile.ZipFile(io.BytesIO(response.content), "r")
    assert zip_file.testzip() == None
    zip_file_members = zip_file.namelist()
    assert set(zip_file_members) == set(zip_file_members_expected)

    # check file contents
    filenames = ["test_image_1.jpg", "test_image_2.jpg"]
    filenames = [os.path.join(TEST_BASE_DIR, filename) for filename in filenames]
    for image_name, test_image_name in zip([image_name1, image_name2], filenames):
        with zip_file.open(f"images/{image_name}", "r") as image_zipped:
            with open(test_image_name, "rb") as image:
                assert image_zipped.read() == image.read()
            with open(os.path.join(TEST_BASE_DIR, "test_image_1_modified.jpg"), "rb") as image:
                assert image_zipped.read() != image.read()

    with zip_file.open("project.json", "r") as project_zipped:
        project_meta = json.loads(project_zipped.read())

        assert set(project_meta.keys()) == set(['version', 'id', 'name', 'description', 'created', 'edited'])
        assert project_meta["version"] == "v1.0"
        assert project_meta["name"] == project_name
        assert project_meta["description"] == project_description
        assert project_meta["id"] == project_id

    return zip_file


def test_export_project_without_anotations():
    project_id, project_name, project_description = create_project()
    _, image_name1, _, image_name2 = create_images(project_id)

    response = client.get(f"/api/export/{project_id}")
    assert response.status_code == 200, response.text
    
    zip_file_members_expected = [
        'project.json', 
        f'images/{image_name1}', 
        f'images/{image_name2}'
    ]
    check_export_file(
        response, project_id, project_name, project_description, 
        image_name1, image_name2, zip_file_members_expected)

    
def test_export_project_with_anotations():
    project_id, project_name, project_description = create_project()
    image_id1, image_name1, image_id2, image_name2 = create_images(project_id)

    new_data1 = update_annotation(image_id1, image_name1)
    new_data2 = update_annotation(image_id2, image_name2)

    response = client.get(f"/api/export/{project_id}")
    assert response.status_code == 200, response.text
    
    zip_file_members_expected = [
        'project.json', 
        f'annotations/{os.path.splitext(image_name1)[0]}.json', 
        f'annotations/{os.path.splitext(image_name2)[0]}.json',
        f'save/{os.path.splitext(image_name1)[0]}.json',
        f'save/{os.path.splitext(image_name2)[0]}.json',
        f'images/{image_name1}', 
        f'images/{image_name2}'
    ]

    zip_file = check_export_file(
        response, project_id, project_name, project_description, 
        image_name1, image_name2, zip_file_members_expected)

    # check file contents of save and annotation
    for image_name, new_data in zip([image_name1, image_name2], [new_data1, new_data2]):
        with zip_file.open(f"save/{os.path.splitext(image_name)[0]}.json", "r") as annotation_zipped:
            annotation = json.loads(annotation_zipped.read())
            assert annotation == new_data

    with zip_file.open(f"annotations/{os.path.splitext(image_name1)[0]}.json", "r") as annotation_zipped:
        annotation = json.loads(annotation_zipped.read())

        assert annotation == {
            'image': image_name1, 
            'grid_cells': [{
                'corners': [
                    {'x': 628.1555178074648, 'y': 555.6936223629666}, 
                    {'x': 506.7893166203104, 'y': 556.3686265351816}, 
                    {'x': 507.3894038067126, 'y': 582.0948804038808}, 
                    {'x': 628.6076629892434, 'y': 581.461720391297}
                ], 
                'center': {'x': 567.7354753059328, 'y': 568.9047124233315}, 
                'id': 'bd25ff5d-82c0-495d-a144-a6af298c0af2', 
                'truncated': False
            }]
        }


def test_try_export_non_existing_project():
    project_id = -1
    response = client.get(f"/api/export/{project_id}")
    assert response.status_code == 404, response.text


def test_import_project():
    filename = os.path.join(TEST_BASE_DIR, "test_export_file.zip")
    with open(filename, "rb") as f:
        file = {"file": (filename, f, "application/zip")}
        response = client.post(f"/api/import/", files=file)

    assert response.status_code == 201, response.text
    data = response.json()
    assert data["name"] == "Test"
    assert data["description"] == "dgdg"
    assert set(data.keys()) == set(["name", "description", "id", "created", "edited", "images", "username"])
    project_id = data["id"]

    # confirm project exists in database
    response = client.get(f"/api/project/{project_id}")
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["name"] == "Test"
    assert data["description"] == "dgdg"
    assert set(data.keys()) == set(["name", "description", "id", "created", "edited", "images", "username"])

    # confirm files are uploaded to images directory
    image_names = [
        "3cf319e8-f539-42c1-b525-53c850812b5f.jpg",
        "4b1346fb-6482-4dea-8632-6c4392810759.jpg",
        "4cce9352-b352-46ab-b021-9b18ee6c3904.jpg",
        "6f14f9cd-5563-4107-badd-cde66657b2b8.jpg",
        "6f573e78-f63b-4b4b-8f80-a77666c3e97f.jpg",
        "7b290960-9f37-4bef-8204-701458e0212a.jpg",
        "91c9cd46-aff7-4579-b49d-232ec8556381.jpg",
        "93ca36b4-42b9-4fd7-84f6-caeea1bbe5e7.jpg",
        "322609a4-d4e4-4e33-a8d6-c2fc2a8b3a5c.jpg",
        "434074b0-af2c-4c41-a943-a6d4fb843c3c.jpg",
        "a175e3e6-b3fe-4169-811d-ff3360f6c0a2.jpg",
        "ae3b21f1-da05-4ed4-8ad5-d44b21b87647.jpg",
        "ae7893d3-3183-46f5-8f62-ec076dee17c3.jpg",
        "d667e897-fe4e-46cf-b20c-01ee03b8a409.jpg",
        "f08327f1-fa14-4e62-87d1-24ac4b869b60.jpg",
        "ff8e1a82-fe8c-4ad8-b215-b2a117ee3f5c.jpg",
        "ff928046-124a-4bae-8960-b6488506fd6b.jpg",
    ]
    image_files = glob.glob(os.path.join(TEST_BASE_DIR, "images", f"project_{project_id}", "*.jpg"))
    assert set([os.path.basename(image_file) for image_file in image_files]) == set(image_names)

    # confirm database contains images
    response = client.get(f"/api/project/{project_id}/images/")
    assert response.status_code == 200, response.text
    data = response.json()
    assert set([image["name"] for image in data]) == set(image_names)
    image_ids = {image["name"]: image["id"] for image in data}

    # confirm database contains non-empty annotations for the three annotated images
    annotated_images = [
        "434074b0-af2c-4c41-a943-a6d4fb843c3c.jpg", 
        "3cf319e8-f539-42c1-b525-53c850812b5f.jpg", 
        "f08327f1-fa14-4e62-87d1-24ac4b869b60.jpg"
    ]
    for image_name in image_names:
        image_id = image_ids[image_name]

        response = client.get(f"/api/annotation/{image_id}")
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["id"] == image_id
        assert set(data.keys()) == set(["id", "data", "username"])

        if image_name in annotated_images:
            assert data["data"] != {}
        else:
            assert data["data"] == {}

        if image_name == "434074b0-af2c-4c41-a943-a6d4fb843c3c.jpg":
            assert data["data"] == {
                "image": "434074b0-af2c-4c41-a943-a6d4fb843c3c.jpg", 
                "grid_cells": [
                    {
                        "corners": [
                            {"x": 178.9499601966895, "y": 189.19853424679565, "id": "b821dded-fec6-4a44-8bee-4ebcd3cbe04a"}, 
                            {"x": 104.26361165171659, "y": 185.05813965794854, "id": "cadbbf42-ac4f-4e37-a252-972bc9234143"},
                            {"x": 88.86580289476822, "y": 303.52192638479323, "id": "fb86b5e4-505e-44ed-92ef-64d0e4a06911"}, 
                            {"x": 170.98231931245797, "y": 306.9140027944741, "id": "20a95fdf-1bd3-4603-835a-57db3d201560"}
                        ], 
                        "center": {"x": 135.76542351390808, "y": 246.17315077100287}, 
                        "id": "6f8621e8-cf92-40bd-8327-a70949f9d11e", "truncated": False
                    }, 
                    {
                        "corners": [
                            {"x": 255.53101640809757, "y": 193.4439659344217, "id": "fa28a709-a430-4c38-9bdc-07dc63daa274"}, 
                            {"x": 178.9499601966895, "y": 189.19853424679565, "id": "b821dded-fec6-4a44-8bee-4ebcd3cbe04a"}, 
                            {"x": 170.98231931245797, "y": 306.9140027944741, "id": "20a95fdf-1bd3-4603-835a-57db3d201560"}, 
                            {"x": 250.49848633033926, "y": 310.1986637384141, "id": "1ab2c76e-bb9d-44f0-9abc-21844c1f8407"}
                        ], "center": {"x": 213.99044556189608, "y": 249.93879167852637}, 
                        "id": "36157f15-f2ff-4a26-adcc-45c5d7f6c817", "truncated": False
                    }, 
                    {
                        "corners": [
                            {"x": 250.49848633033926, "y": 310.1986637384141, "id": "1ab2c76e-bb9d-44f0-9abc-21844c1f8407"}, 
                            {"x": 170.98231931245797, "y": 306.9140027944741, "id": "20a95fdf-1bd3-4603-835a-57db3d201560"}, 
                            {"x": 161.88063159242736, "y": 441.38409878718437, "id": "b062f859-08de-4162-9844-bb0beff97476"}, 
                            {"x": 244.74472704249706, "y": 443.6858792163529, "id": "207f8f6d-6e5e-4b5f-ab1d-c8872c16c8cd"}
                        ], 
                        "center": {"x": 207.0265410694304, "y": 375.54566113410635}, 
                        "id": "e1f8cafc-107b-4208-b8dc-eac4242b9479", "truncated": False
                    }, 
                    {
                        "corners": [
                            {"x": 170.98231931245797, "y": 306.9140027944741, "id": "20a95fdf-1bd3-4603-835a-57db3d201560"}, 
                            {"x": 88.86580289476822, "y": 303.52192638479323, "id": "fb86b5e4-505e-44ed-92ef-64d0e4a06911"}, 
                            {"x": 71.27374942935788, "y": 438.8672409493213, "id": "2d69ddda-9f63-4f0c-9f17-0659c9d5568d"}, 
                            {"x": 161.88063159242736, "y": 441.38409878718437, "id": "b062f859-08de-4162-9844-bb0beff97476"}
                        ], 
                        "center": {"x": 123.25062580725285, "y": 372.67181722894327}, 
                        "id": "f5b16d93-1af4-4bb5-a6e3-37fbc44806bc", "truncated": False
                    }
                ], 
                "corners": [
                    {"x": 104.26361165171659, "y": 185.05813965794854, "id": "cadbbf42-ac4f-4e37-a252-972bc9234143"}, 
                    {"x": 178.9499601966895, "y": 189.19853424679565, "id": "b821dded-fec6-4a44-8bee-4ebcd3cbe04a"}, 
                    {"x": 255.53101640809757, "y": 193.4439659344217, "id": "fa28a709-a430-4c38-9bdc-07dc63daa274"}, 
                    {"x": 88.86580289476822, "y": 303.52192638479323, "id": "fb86b5e4-505e-44ed-92ef-64d0e4a06911"}, 
                    {"x": 170.98231931245797, "y": 306.9140027944741, "id": "20a95fdf-1bd3-4603-835a-57db3d201560"}, 
                    {"x": 250.49848633033926, "y": 310.1986637384141, "id": "1ab2c76e-bb9d-44f0-9abc-21844c1f8407"}, 
                    {"x": 71.27374942935788, "y": 438.8672409493213, "id": "2d69ddda-9f63-4f0c-9f17-0659c9d5568d"}, 
                    {"x": 161.88063159242736, "y": 441.38409878718437, "id": "b062f859-08de-4162-9844-bb0beff97476"}, 
                    {"x": 244.74472704249706, "y": 443.6858792163529, "id": "207f8f6d-6e5e-4b5f-ab1d-c8872c16c8cd"}
                ], 
                "auxlines": [
                    {"x1": -27.839817914482502, "y1": 177.73470859457717, "x2": 671.30451521046, "y2": 216.4932430535292, "id": "55dd78e4-3587-46bc-b5fd-9045731591d5"}, 
                    {"x1": -48.89222222708057, "y1": 297.83140555359813, "x2": 698.8506976191512, "y2": 328.7192370102411, "id": "90c8338e-cc38-4818-a020-57c5b02027bf"}, 
                    {"x1": -50.95399141806052, "y1": 435.4720259257819, "x2": 690.3539635413706, "y2": 456.06391356354385, "id": "633cfd01-88d1-49ab-8c8a-e331d290fff3"}, 
                    {"x1": 107.34614479723467, "y1": 161.34252174807557, "x2": 67.44936249907084, "y2": 468.29034684846505, "id": "ae4b1a43-8f2f-45ef-8789-d1bf038d2b07"}, 
                    {"x1": 180.7047445067617, "y1": 163.27301121411577, "x2": 160.75635335767979, "y2": 457.994403029584, "id": "9cc8c825-4898-43e5-944e-bd10e3eacbdb"}, 
                    {"x1": 256.637330171009, "y1": 167.7774866348762, "x2": 243.76740039740776, "y2": 466.3598573824248, "id": "f9a02421-a28a-4738-b5c5-b7a293834f5e"}
                ], 
                "auxcurves": [], 
                "prev_intersections": [
                    {"x": 104.26361165171659, "y": 185.05813965794854}, 
                    {"x": 178.9499601966895, "y": 189.19853424679565}, 
                    {"x": 255.53101640809757, "y": 193.4439659344217}, 
                    {"x": 88.86580289476822, "y": 303.52192638479323}, 
                    {"x": 170.98231931245797, "y": 306.9140027944741}, 
                    {"x": 250.49848633033926, "y": 310.1986637384141}, 
                    {"x": 71.27374942935788, "y": 438.8672409493213}, 
                    {"x": 161.88063159242736, "y": 441.38409878718437}, 
                    {"x": 244.74472704249706, "y": 443.6858792163529}
                ]
            }

    # confirm returned annotation ids are correct
    response = client.get(f"/api/annotation_ids/")
    assert response.status_code == 200, response.text
    data = response.json()
    print(data)
    assert set(data) == set([image_ids[name] for name in annotated_images])


def test_try_import_project_invalid_file():
    filename = os.path.join(TEST_BASE_DIR, "test_export_file_invalid.zip")
    with open(filename, "rb") as f:
        file = {"file": (filename, f, "application/zip")}
        response = client.post(f"/api/import/", files=file)
    assert response.status_code == 422, response.text
    data = response.json()
    assert data["detail"] == "Uploaded file is not a valid project archive."


def test_try_import_project_non_zip_file():
    filename = os.path.join(TEST_BASE_DIR, "test_image_1.jpg")
    with open(filename, "rb") as f:
        file = {"file": (filename, f, "image/jpeg")}
        response = client.post(f"/api/import/", files=file)
    assert response.status_code == 422, response.text
    data = response.json()
    assert data["detail"] == "Uploaded file is not a valid zip archive."
