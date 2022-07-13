import "./style.css";

import { MDCTextField } from "@material/textfield";
import { MDCSnackbar } from "@material/snackbar";

import { apiService } from "../../api.js";
import {
  entrypoint,
  redirectToLogin,
  uuidv4,
  htmlToElements,
  parseValidationErrors,
  getImageUrl,
} from "../../utils.js";

// TODOS:
// - images list pagination
// - button to select all images for deletion
// - show checkmark on already annotated images
// - catch errors of XHR requests (show snackbar with generic error message and full error message in console)
// - enable a detail-view of the image
// - show snackbar when redirecting to projects page

entrypoint(() => {
  addEditProject(project_id, mode);
});

async function addEditProject(project_id, mode) {
  const project_save_success_msg = "Project saved successfully.";
  const project_save_error_msg = "Failed to save project.";

  const snackbar = new MDCSnackbar(document.querySelector(".mdc-snackbar"));
  const textFieldsProject = {
    name: new MDCTextField(document.querySelector("#text-field-name")),
    description: new MDCTextField(
      document.querySelector("#text-field-description")
    ),
  };

  var image_ids_to_upload = [];
  var image_files_to_upload = {};
  var image_ids_to_delete = [];

  document
    .getElementById("image-upload-input")
    .addEventListener("input", filesInputChanged);
  document
    .getElementById("edit-project-cancel-button")
    .addEventListener("click", cancelButtonClicked);
  document
    .getElementById("edit-project-submit-button")
    .addEventListener("click", saveProjectButtonClicked);

  getProjectDataAndPopulateFields(project_id);

  async function getProject(project_id) {
    var response = await apiService.getProject(project_id);

    if (response.status == 200) {
      const data = await response.json();
      var neededKeys = ["name", "description", "images"];
      if (neededKeys.every((key) => Object.keys(data).includes(key))) {
        setName(data.name);
        setDescription(data.description);
        setImagesList(data.images);
      }
    } else if (response.status == 401) {
      redirectToLogin();
    } else {
      throw new Error(`Failed to get data for project with id ${project_id}`);
    }
  }

  async function deleteImages() {
    if (image_ids_to_delete.length) {
      console.log("Deleting: " + image_ids_to_delete);
      var responses = await Promise.all(
        image_ids_to_delete.map(async (image_id) => {
          return await apiService.deleteImage(image_id);
        })
      );

      if (responses.every((e) => e.status == 200)) {
        // all requests okay
        console.log(project_save_success_msg);
        snackbar.labelText = project_save_success_msg;
        snackbar.open();
        redirectHome();
      } else if (responses.some((e) => e.status == 401)) {
        // at least one request failed with 401 unauthorized access
        redirectToLogin();
      } else {
        // at least one request failed
        console.log(project_save_error_msg);
        snackbar.labelText = project_save_error_msg;
        snackbar.open();
        throw new Error(`Failed to delete images`);
      }
    } else {
      console.log(project_save_success_msg);
      snackbar.labelText = project_save_success_msg;
      snackbar.open();
      redirectHome();
    }
  }

  async function createImages(project_id, images_data) {
    if (images_data.has("files")) {
      var response = await apiService.createImages(project_id, images_data);

      if (response.status == 201) {
        deleteImages(); // delete images marked for deletion
      } else if (response.status == 401) {
        redirectToLogin();
      } else {
        console.log(project_save_error_msg);
        snackbar.labelText = project_save_error_msg;
        snackbar.open();
        throw new Error(`Failed to create images`);
      }
    } else {
      deleteImages();
    }
  }

  async function createProject(project_data, images_data) {
    var response = await apiService.createProject(project_data);

    if (response.status == 201) {
      const data = await response.json();
      const project_id_new = data.id;
      createImages(project_id_new, images_data);
    } else if (response.status == 422) {
      const errors = await response.json();
      parseValidationErrors(textFieldsProject, errors);
    } else if (response.status == 401) {
      redirectToLogin();
    } else {
      console.log(project_save_error_msg);
      snackbar.labelText = project_save_error_msg;
      snackbar.open();
      throw new Error(`Failed to create project`);
    }
  }

  async function updateProject(project_id, project_data, images_data) {
    var response = await apiService.updateProject(project_id, project_data);

    if (response.status == 200) {
      createImages(project_id, images_data);
    } else if (response.status == 422) {
      const errors = await response.json();
      parseValidationErrors(textFieldsProject, errors);
    } else if (response.status == 401) {
      redirectToLogin();
    } else {
      console.log(project_save_error_msg);
      snackbar.labelText = project_save_error_msg;
      snackbar.open();
      throw new Error(`Failed to update project with id ${project_id}`);
    }
  }

  function getProjectDataAndPopulateFields(project_id) {
    if (project_id == null) {
      return;
    }
    getProject(project_id);
  }

  function setName(name) {
    textFieldsProject["name"].value = name;
    document
      .getElementById("text-field-name")
      .classList.add("mdc-text-field--label-floating");
    document
      .getElementById("text-field-name-label")
      .classList.add("mdc-floating-label--float-above");
  }

  function setDescription(description) {
    textFieldsProject["description"].value = description;
    if (description.length) {
      document
        .getElementById("text-field-description")
        .classList.add("mdc-text-field--label-floating");
      document
        .getElementById("text-field-description-label")
        .classList.add("mdc-floating-label--float-above");
    }
  }

  function addImageToImageList(image_id, is_uploaded, src, classsuffix) {
    const html = `
            <div class="image-list__item">
                <div class="mdc-elevation--z2">
                    <img class="image-list-image__${classsuffix}" src="${src}">
                    <div class="image-list-image__delete-button">
                        <button class="mdc-icon-button material-icons" id="image-list-image-${image_id}" aria-describedby="tooltip-delete-image">
                            <div class="mdc-icon-button__ripple"></div>
                            <span class="mdc-icon-button__focus-ring"></span>
                            <i class="material-icons mdc-icon-button__icon mdc-icon-button__icon--on">delete</i>
                            <i class="material-icons mdc-icon-button__icon">delete_outline</i>
                        </button>
                    </div>
                </div>
            </div>`;
    document.getElementById("images-list").appendChild(htmlToElements(html));
    document
      .getElementById(`image-list-image-${image_id}`)
      .addEventListener(
        "click",
        deleteImageButtonClicked.bind(event, image_id, is_uploaded),
        false
      );
  }

  function updateImageListTitle(show) {
    if (show) {
      document.getElementById("image-list-title").style.display = "block";
    } else {
      document.getElementById("image-list-title").style.display = "none";
    }
  }

  function setImagesList(images) {
    updateImageListTitle(images.length > 0);
    const imagesList = document.getElementById("images-list");
    images.forEach((image) => {
      getImageUrl(image.id).then((imageURL) => {
        addImageToImageList(image.id, true, imageURL, "image-already-uploaded");
      });
    });
  }

  function redirectHome() {
    window.location.href = FRONTEND_URLS.projects;
  }

  function saveProjectButtonClicked() {
    // get project data from fields and file input
    const project_data = {
      name: document.getElementById("text-field-name-input").value,
      description: document.getElementById("text-field-description-input")
        .value,
    };

    var images_data = new FormData();
    for (const [image_id, file] of Object.entries(image_files_to_upload)) {
      if (image_ids_to_upload.includes(image_id)) {
        images_data.append("files", file, file.name);
      }
    }

    if (mode == "add") {
      createProject(project_data, images_data);
    } else if (mode == "edit") {
      updateProject(project_id, project_data, images_data);
    } else {
      console.log("Unknown mode. Must be either 'add' or 'edit'.");
    }
  }

  function cancelButtonClicked() {
    redirectHome();
  }

  function filesInputChanged(event) {
    function createObjectURL(object) {
      return window.URL
        ? window.URL.createObjectURL(object)
        : window.webkitURL.createObjectURL(object);
    }
    if (event.target.files.length) {
      for (var i = 0; i < event.target.files.length; i++) {
        const file = event.target.files[i];
        const temp_id = uuidv4();
        image_files_to_upload[temp_id] = file;
        image_ids_to_upload.push(temp_id);
        var src = createObjectURL(file);
        addImageToImageList(temp_id, false, `${src}`, "image-not-uploaded");
      }
      updateImageListTitle(true);
    }
  }

  function deleteImageButtonClicked(image_id, is_uploaded) {
    // unmarking an image for deletion
    if (event.currentTarget.classList.contains("mdc-icon-button--on")) {
      event.currentTarget.classList.remove("mdc-icon-button--on");
      if (is_uploaded) {
        // if image is already on the server, remove it from the list for active deletion
        image_ids_to_delete = image_ids_to_delete.filter(function (e) {
          return e !== image_id;
        });
      } else {
        // else, add the tentative image back to the images_to_upload list
        image_ids_to_upload.push(image_id);
      }
    }
    // marking an image for deletion
    else {
      event.currentTarget.classList.add("mdc-icon-button--on");
      if (is_uploaded) {
        // if image is already on the server, mark it for activate deletion
        image_ids_to_delete.push(image_id);
      } else {
        // remove image from images_to_upload list
        image_ids_to_upload = image_ids_to_upload.filter(function (e) {
          return e !== image_id;
        });
      }
    }
    console.log("image_ids_to_delete: " + image_ids_to_delete);
    console.log("image_ids_to_upload: " + image_ids_to_upload);
    console.log("image_files_to_upload: " + image_files_to_upload);
  }
}

export { addEditProject };
