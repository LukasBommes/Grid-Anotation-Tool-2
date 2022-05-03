from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from ..database import Base
from ..main import app, get_db

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


Base.metadata.create_all(bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


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


def test_create_and_get_project():
    project_id, name, description = create_project()

    # get projects
    response = client.get(f"/project/{project_id}")
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["name"] == name
    assert data["description"] == description
    assert data["images"] == []
    assert set(data.keys()) == set(["name", "description", "id", "created", "edited", "images"])


def test_create_project_name_null():
    response = client.post(
        "/projects/",
        headers={"Content-Type": "application/json", "accept": "application/json"},
        json={"name": None, "description": "My Description"},
    )
    assert response.status_code == 422, response.text


def test_create_project_description_null():
    create_project(name="Name", description=None)


def test_try_get_non_existing_project():
    project_id = -1
    response = client.get(f"/project/{project_id}")
    assert response.status_code == 404, response.text


def test_create_and_delete_project():
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


def test_try_delete_non_existing_project():
    project_id = -1
    response = client.delete(f"/project/{project_id}")
    assert response.status_code == 404


def test_create_and_update_project():
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


def test_create_and_update_project_name_null():
    project_id, _, _ = create_project()
    response = client.put(
        f"/project/{project_id}",
        headers={"Content-Type": "application/json", "accept": "application/json"},
        json={"name": None, "description": "Description 123"},
    )
    assert response.status_code == 422, response.text


def test_create_and_update_project_description_null():
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


def test_try_update_non_existing_project():
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


def create_image(project_id, name="Name"):
    """Helper function to create and evaluate an image."""
    response = client.post(
        f"/project/{project_id}/images/",
        headers={"Content-Type": "application/json", "accept": "application/json"},
        json={"name": name},
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["name"] == name
    assert set(data.keys()) == set(["name", "id", "project_id"])
    image_id = data["id"]
    return image_id, name


def test_create_and_get_images():
    # create project
    project_id, _, _ = create_project()
    image_id, name = create_image(project_id, name="Imagename")

    # get image by image id
    response = client.get(f"/image/{image_id}")
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["name"] == name
    assert data["id"] == image_id
    assert set(data.keys()) == set(["name", "id", "project_id"])

    # get images by project id
    response = client.get(f"/project/{project_id}/images/")
    assert response.status_code == 200, response.text
    data = response.json()
    assert type(data) == list
    assert len(data) == 1
    assert data[0]["id"] == image_id
    assert data[0]["name"] == name
    assert set(data[0].keys()) == set(["name", "id", "project_id"])


def test_try_get_non_existing_image():
    image_id = -1
    response = client.get(f"/image/{image_id}")
    assert response.status_code == 404


def test_try_create_image_non_existing_project():
    project_id = -1
    response = client.post(
        f"/project/{project_id}/images/",
        headers={"Content-Type": "application/json", "accept": "application/json"},
        json={"name": "Name"},
    )
    assert response.status_code == 404, response.text


def test_create_and_delete_image():
    project_id, _, _ = create_project()
    image_id, name = create_image(project_id)

    # delete image
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

    response = client.get(f"/image/{image_id}")
    assert response.status_code == 404, response.text


def test_try_delete_non_existing_image():
    image_id = -1
    response = client.delete(f"/image/{image_id}")
    assert response.status_code == 404, response.text


def test_delete_project_cascade_images():
    """Test if deleting a project also deletes associated images."""
    project_id, name, description = create_project()
    image_id1, name1 = create_image(project_id)
    image_id2, name2 = create_image(project_id)

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



    
