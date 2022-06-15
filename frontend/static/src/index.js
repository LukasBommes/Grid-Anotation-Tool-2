//##############################################################################################
//
//  index.html
//
//##############################################################################################


var fetchService = function() {

    makeFetchRequest = function(httpMethod, url, data=null, formData=null, authorization=true) {

        const options = {
            method: httpMethod
        }

        let headers = {};
        if (authorization) {
            headers['Authorization'] = 'Bearer ' + localStorage.getItem("access_token")
        }

        if (data) {
            options.body = JSON.stringify(data);
            headers['Content-Type'] = 'application/json';
        } 
        else if (formData) {
            options.body = formData;
        }

        options.headers = new Headers(headers);

        let responsePromise = fetch(url, options);

        return responsePromise;
    }

    // public API
    return {
        makeFetchRequest: makeFetchRequest
    }

}();


var apiService = function() {

    let apiUrl = API_URL;

    getProjects = function(skip, limit, orderby, orderdir) {
        let url = `${apiUrl}/projects/?skip=${skip}&limit=${limit}&orderby=${orderby}&orderdir=${orderdir}`;
        return fetchService.makeFetchRequest('GET', url, null, null, true);
    }

    getProject = function(projectId) {
        let url = `${apiUrl}/project/${projectId}`;
        return fetchService.makeFetchRequest('GET', url, null, null, true);
    }

    deleteProject = function(projectId) {
        let url = `${apiUrl}/project/${projectId}`;
        return fetchService.makeFetchRequest('DELETE', url, null, null, true);
    }

    createProject = function(projectData) {
        let url = `${apiUrl}/projects/`;
        return fetchService.makeFetchRequest('POST', url, projectData, null, true);
    }

    updateProject = function(projectId, projectData) {
        let url = `${apiUrl}/project/${projectId}`
        return fetchService.makeFetchRequest('PUT', url, projectData, null, true);
    }

    getAnnotationIds = function() {
        let url = `${apiUrl}/annotation_ids/`;
        return fetchService.makeFetchRequest('GET', url, null, null, true);
    }

    exportProject = function(projectId) {
        let url = `${apiUrl}/export/${projectId}`;
        return fetchService.makeFetchRequest('GET', url, null, null, true);
    }

    importProject = function(importProjectData) {
        let url = `${apiUrl}/import/`;
        return fetchService.makeFetchRequest('POST', url, null, importProjectData, true);
    }

    getImages = function(projectId) {
        let url = `${apiUrl}/project/${projectId}/images/`;
        return fetchService.makeFetchRequest('GET', url, null, null, true);
    }

    getImageFile = function(imageId) {
        let url = `${apiUrl}/image_file/${imageId}`;
        return fetchService.makeFetchRequest('GET', url, null, null, true);
    }

    createImages = function(projectId, imagesData) {
        let url = `${apiUrl}/project/${projectId}/images/`;
        return fetchService.makeFetchRequest('POST', url, null, imagesData, true);
    }

    deleteImage = function(imageId) {
        let url = `${apiUrl}/image/${imageId}`;
        return fetchService.makeFetchRequest('DELETE', url, null, null, true);
    }

    getAnnotation = function(imageId) {
        let url = `${apiUrl}/annotation/${imageId}`;
        return fetchService.makeFetchRequest('GET', url, null, null, true);
    }

    updateAnnotation = function(imageId, annotationData) {
        let url = `${apiUrl}/annotation/${imageId}`;
        return fetchService.makeFetchRequest('PUT', url, annotationData, null, true);
    }

    createUser = function(userData) {
        let url = `${apiUrl}/users/`;
        return fetchService.makeFetchRequest('POST', url, userData, null, false);
    }

    loginUser = function(userData) {
        let url = `${apiUrl}/token`;
        return fetchService.makeFetchRequest('POST', url, null, userData, false);
    }

    isValid = function(accessToken) {
        let url = `${apiUrl}/isvalid/${accessToken}`;
        return fetchService.makeFetchRequest('GET', url, null, null, false);
    }

    // public API
    return {
        getProjects: getProjects,
        getProject: getProject,
        deleteProject: deleteProject,
        createProject: createProject,
        updateProject: updateProject,
        getAnnotationIds: getAnnotationIds,
        exportProject: exportProject,
        importProject: importProject,
        getImages: getImages,
        getImageFile: getImageFile,
        createImages: createImages,
        deleteImage: deleteImage,
        getAnnotation: getAnnotation,
        updateAnnotation: updateAnnotation,
        createUser: createUser,
        loginUser: loginUser,
        isValid: isValid
    }

}();


getAnnotationIds = async function () {
    var response = await apiService.getAnnotationIds();

    if (response.status == 200) {
        const existing_anotations = await response.json();
        return existing_anotations;
    } else if (response.status == 401) {
        redirectToLogin();
    } else {
        throw new Error(`Failed to get annotation ids`);
    }
}

const snackbar = new mdc.snackbar.MDCSnackbar(document.querySelector('.mdc-snackbar'));

async function entrypoint(entrypointFunc) {
    const loggedIn = await userIsLoggedIn();
    if (!loggedIn) {
        redirectToLogin();
    }
    else {
        entrypointFunc();
    }
}

async function userIsLoggedIn() {
    const access_token = localStorage.getItem('access_token');
    if (!access_token) {
        return false;
    }

    // check if access token is not expired yet
    var response = await apiService.isValid(access_token);
    // check if access token is not expired yet
    if (response.status == 200) {
        const status = await response.json();
        return status.isvalid;
    } else {
        throw new Error("Failed to determine whether user is logged in");
    }
}
    
function redirectToLogin() {
    window.location.href = FRONTEND_URLS.login;
}

async function loginButtonClicked() {
    const loggedIn = await userIsLoggedIn();
    if (loggedIn) {
    logout();
    } else {
    redirectToLogin();
    }
}

setLoginButton();

async function setLoginButton() {
    const login_button_label = document.getElementById("login-button-label");
    const login_button_icon = document.getElementById("login-button-icon");
    const loggedIn = await userIsLoggedIn();
    if (loggedIn) {
    console.log("setting button")
    login_button_label.innerHTML = "Sign out";
    login_button_icon.innerHTML = "logout";
    } else {
    login_button_label.innerHTML = "Login";
    login_button_icon.innerHTML = "login";
    }
}

function logout() {
    localStorage.removeItem('access_token');
    console.log("Logged out");
    redirectToLogin();
}

// UUID creation, taken from: https://stackoverflow.com/a/2117523
function uuidv4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

function htmlToElements(html) {
    var template = document.createElement('template');
    template.innerHTML = html;
    return template.content;
}

function redirectToProjects() {
    window.location.href = FRONTEND_URLS.projects;
}

function homeButtonClicked() {
    redirectToProjects();
}

function parseValidationErrors(textFields, errors) {
    errors["detail"].forEach((error) => {
        const fieldname = error.loc[1];
        console.log(fieldname);
        textFields[fieldname].helperTextContent = error.msg;
        textFields[fieldname].valid = false;                
    });
}

async function setupProjectClicked(project_id) {
  const url = FRONTEND_URLS.getEditProjectUrl+"?project_id="+project_id;
  const options = {
      method: 'GET',
      headers: new Headers({
          'Authorization': 'Bearer ' + localStorage.getItem("access_token")
      })
  }

  let response = await fetch(url, options);

  if (response.status == 200) {
      const data = await response.json();
      window.location.href = data.url;
  } else if (response.status == 401) {
      redirectToLogin();
  } else {
      throw new Error(`Failed to get url for setting up project with id ${project_id}`);
  }
}

async function exportProjectClicked(project_id) {
    var response = await apiService.exportProject(project_id);

    if (response.status == 200) {
        // get filename
        const disposition = response.headers.get('Content-Disposition');
        filename = disposition.split(/;(.+)/)[1].split(/=(.+)/)[1];
        if (filename.toLowerCase().startsWith("utf-8''")) {
            filename = decodeURIComponent(filename.replace("utf-8''", ''));
        } else {
            filename = filename.replace(/['"]/g, '');
        }
        // get data
        const fileBlob = await response.blob();
        // download file
        var a = document.createElement('a');
        a.href = URL.createObjectURL(fileBlob);
        a.download = filename;
        document.body.appendChild(a); // append the element to the dom, otherwise it won't work in Firefox
        a.click();
        a.remove();
    } else if (response.status == 401) {
        redirectToLogin();
    } else {
        throw new Error(`Failed to export project with id ${project_id}`);
    }
}

getImageUrl = async function(image_id) {
    var response = await apiService.getImageFile(image_id);

    if (response.status == 200) {
        const imageBlob = await response.blob();
        const imageURL = URL.createObjectURL(imageBlob);
        return imageURL;
    } else if (response.status == 401) {
        redirectToLogin();
    } else {
        throw new Error(`Failed to get image file with id ${image_id}`);
    }
}

const iconButtonRipples = [].map.call(document.querySelectorAll('.app-bar-icon-button'), function(element) {
    const ripple = new mdc.ripple.MDCRipple(element);
    ripple.unbounded = true;
    return ripple;
});

const textfields = [].map.call(document.querySelectorAll('.mdc-text-field'), function(element) {
    return new mdc.textField.MDCTextField(element);
});

const tooltips = [].map.call(document.querySelectorAll('.mdc-tooltip'), function(element) {
    const tooltip = new mdc.tooltip.MDCTooltip(element);
    tooltip.setShowDelay(500);
    tooltip.setHideDelay(0);
    return tooltip;
});


//##############################################################################################
//
//  add_edit_project.html
//
//##############################################################################################

// TODOS:
// - images list pagination
// - button to select all images for deletion
// - show checkmark on already annotated images
// - catch errors of XHR requests (show snackbar with generic error message and full error message in console)
// - enable a detail-view of the image
// - show snackbar when redirecting to projects page

const mode = "edit"; // {{ mode|tojson }};
const project_id = 1; //{{ project_id|tojson }};

const project_save_success_msg = "Project saved successfully.";
const project_save_error_msg = "Failed to save project."

const textFieldsProject = {
    name: new mdc.textField.MDCTextField(document.querySelector('#text-field-name')),
    description: new mdc.textField.MDCTextField(document.querySelector('#text-field-description'))
}

var image_ids_to_upload = [];
var image_files_to_upload = {};
var image_ids_to_delete = [];

entrypoint(() => {
    console.log(mode);
    getProjectDataAndPopulateFields(project_id);
});

getProject = async function (project_id) {
    var response = await apiService.getProject(project_id);

    if (response.status == 200) {
        const data = await response.json();
        var neededKeys = ['name', 'description', 'images'];
        if (neededKeys.every(key => Object.keys(data).includes(key))) {
            setName(data.name);
            setDescription(data.description);
            setImagesList(data.images);
        }
    } else if (response.status == 401) {
        redirectToLogin();
    }
    else {
        throw new Error(`Failed to get data for project with id ${project_id}`);
    }
}

createProject = async function (project_data, images_data) {
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

updateProject = async function (project_id, project_data, images_data) {
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

createImages = async function(project_id, images_data) {
    if (images_data.has("files")) {
        var response = await apiService.createImages(project_id, images_data);

        if (response.status == 201) {
            deleteImages();  // delete images marked for deletion
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

deleteImages = async function () {
    if (image_ids_to_delete.length) {
        console.log("Deleting: "+image_ids_to_delete);
        var responses = await Promise.all(image_ids_to_delete.map(async (image_id) => {
                return await apiService.deleteImage(image_id);
            }
        ));

        if(responses.every(e => e.status == 200)) {
            // all requests okay
            console.log(project_save_success_msg); 
            snackbar.labelText = project_save_success_msg;
            snackbar.open();
            redirectHome();
        } else if(responses.some(e => e.status == 401)) {
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

function getProjectDataAndPopulateFields(project_id) {
    if (project_id == null) {
        return;
    }
    getProject(project_id);        
}

function setName(name) {
    textFieldsProject["name"].value = name;
    document.getElementById('text-field-name').classList.add("mdc-text-field--label-floating");
    document.getElementById('text-field-name-label').classList.add("mdc-floating-label--float-above");
}

function setDescription(description) {
    textFieldsProject["description"].value = description;
    if (description.length) {
        document.getElementById('text-field-description').classList.add("mdc-text-field--label-floating");
        document.getElementById('text-field-description-label').classList.add("mdc-floating-label--float-above");
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
    document.getElementById('images-list').appendChild(htmlToElements(html));
    document.getElementById(`image-list-image-${image_id}`).addEventListener('click', deleteImageButtonClicked.bind(event, image_id, is_uploaded), false)
}

function updateImageListTitle(show) {
    if (show) {
        document.getElementById('image-list-title').style.display = "block";
    } else {
        document.getElementById('image-list-title').style.display = "none";
    }
}

function setImagesList(images) {
    updateImageListTitle(images.length > 0);
    const imagesList = document.getElementById('images-list');
    images.forEach((image) => {
        getImageUrl(image.id).then(imageURL => {
            addImageToImageList(image.id, true, imageURL, "image-already-uploaded");
        });
    });
}

function redirectHome() {
    window.location.href = FRONTEND_URLS.projects;
}

function saveProjectButtonClicked(event) {
    // get project data from fields and file input
    const project_data = {
        "name": document.getElementById('text-field-name-input').value, 
        "description": document.getElementById('text-field-description-input').value
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
    }
    else {
        console.log("Unknown mode. Must be either 'add' or 'edit'.")
    }
}

function cancelButtonClicked() {
    redirectHome();
}    

function filesInputChanged(event) {
    function createObjectURL(object) {
        return (window.URL) ? window.URL.createObjectURL(object) : window.webkitURL.createObjectURL(object);
    }
    if(event.target.files.length) {
        for(var i = 0; i < event.target.files.length; i++) {
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

var deleteImageButtonClicked = function(image_id, is_uploaded) {
    // unmarking an image for deletion
    if (event.currentTarget.classList.contains("mdc-icon-button--on")) {
        event.currentTarget.classList.remove("mdc-icon-button--on");
        if (is_uploaded) {
            // if image is already on the server, remove it from the list for active deletion
            image_ids_to_delete = image_ids_to_delete.filter(function(e) { return e !== image_id });                
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
            image_ids_to_upload = image_ids_to_upload.filter(function(e) { return e !== image_id });
        } 
    }        
    console.log("image_ids_to_delete: "+image_ids_to_delete);
    console.log("image_ids_to_upload: "+image_ids_to_upload);
    console.log("image_files_to_upload: "+image_files_to_upload);
}

//##############################################################################################
//
//  editor.html
//
//##############################################################################################


// TODO:
  // - display project info (name, number of images, number of annotated images, last edited, created, description, etc.)

  //const project_id = 1; //{{ project_id|tojson }};

  const annotation_saved_success_msg = "Annotation saved.";
  const annotation_saved_error_msg = "Failed to save annotation.";

  const imagesSelectionList = new mdc.list.MDCList(document.getElementById('images-selection-list'));
  imagesSelectionList.singleSelection = true;

  entrypoint(() => {
      editor(project_id);
  });

  async function editor(project_id) {
    var selected_image = {"id": null, "name": null};
    var selected_image_has_changes = false;
    var existing_anotations = [];
    var img_width, img_height;
    var marker_mode = "auxline"
    var img_pos_x, img_pos_y;

    var prev_intersections = [];
    var auxlines = [];
    var auxcurves = [];
    var temp_auxline_pts = [];
    var temp_auxcurve_pts = [];

    var neighbour_corners;
    var neighbours_manual_selection = [];
    var selected_pv_module = "";
    var corners = [];
    var pv_modules = [];

    getImages = async function (project_id) {
        var response = await apiService.getImages(project_id);

        if (response.status == 200) {
            const data = await response.json();
            data.foreach(function(image) {
              addImageToImagesList(image);
              const annotated = existing_anotations.includes(image.id);
              setImageAnnotationStatus(image.id, annotated);
            });
        } else if (response.status == 401) {
            redirectToLogin();
        } else {
            throw new Error(`Failed to get images`);
        }
    }

    getAnnotation = async function (image_id) {
        var response = await apiService.getAnnotation(image_id);

        if (response.status == 200) {
            const data = await response.json();
            if ('data' in data) {
              var neededKeys = ['corners', 'grid_cells', 'auxlines', 'auxcurves', 'prev_intersections'];
              if (neededKeys.every(key => Object.keys(data.data).includes(key))) {
                  corners = data.data.corners;
                  pv_modules = data.data.grid_cells;
                  auxlines = data.data.auxlines;
                  auxcurves = data.data.auxcurves;
                  prev_intersections = data.data.prev_intersections;
                  draw();
              }
            }
        } else if (response.status == 401) {
            redirectToLogin();
        } else {
            throw new Error(`Failed to get annotation for image with id ${image_id}`);
        }
    }

    updateAnnotation = async function(image_id, annotation_data) {
        var response = await apiService.updateAnnotation(image_id, annotation_data);

        if (response.status == 200) {
          console.log(annotation_saved_success_msg);
          snackbar.labelText = annotation_saved_success_msg;
          snackbar.open();
        } else if (response.status == 401) {
          redirectToLogin();
        } else {
          console.log(annotation_saved_error_msg);
          snackbar.labelText = annotation_saved_error_msg;
          snackbar.open();
          throw new Error(`Failed to save annotation`);
        }
    }

    // helper to remove extension from filename
    function splitext(filename) {
      return filename.split('.').slice(0, -1).join('.')
    }

    function addImageToImagesList(image) {
        const html_list_item = `
          <li id="images-selection-list-${image.id}" data-image-id="${image.id}" data-image-name="${image.name}" class="mdc-deprecated-list-item" role="option">
            <span class="mdc-deprecated-list-item__ripple"></span>
            <span class="mdc-deprecated-list-item__text">${splitext(image.name).slice(0, 8)}</span>
            <span class="mdc-deprecated-list-item__meta">
              <i class="material-icons menu-icon" style="color:green; visibility: hidden;">check</i>
            </span>
          </li>`;
        document.getElementById('images-selection-list').appendChild(htmlToElements(html_list_item));
    }

    function setImageAnnotationStatus(image_id, annotated) {
      const listElement = document.getElementById(`images-selection-list-${image_id}`);
      var icon = listElement.querySelector('.menu-icon');
      if (annotated) {        
        icon.style.visibility = "visible";
      } else {
        icon.style.visibility = "hidden";
      }
    }

    existing_anotations = await getAnnotationIds();
    getImages(project_id);

    // saves annotation data to file
    function save() {
      if (selected_image_has_changes) {
        if (selected_image["name"] != null && (pv_modules.length > 0 || corners.length > 0 ||
            auxlines.length > 0 || auxcurves.length > 0)) {
        //if (selected_image["name"] != null) {    // with thisline simply changing the selection will save annotations
            save_to_json(selected_image["id"]);
            setImageAnnotationStatus(selected_image["id"], true);
        }
        selected_image_has_changes = false;
      }
    }

    window.addEventListener('beforeunload', (event) => {
      event.preventDefault();
      save();
      console.log("Saved annotation before reload.");
    });

    function reset_objects() {
      temp_auxline_pts = [];
      temp_auxcurve_pts = [];
      neighbours_manual_selection = [];
    }

    var remove_active_tag = function(buttons_drawing) {
      var btns_other = buttons_drawing.querySelectorAll("button");
      for (var i = 0; i < btns_other.length; i++) {
        btns_other[i].classList.remove("btn-active")
      }
    };

    function selected_image_changed() {
      selected_image_has_changes = true;
    }

    function images_selection_changed(event) {
      // save annotations of previous image before changing the image
      save();

      // clear SVG and annotations when changing image
      svg.selectAll('*').remove();
      reset_objects();
      auxlines = [];
      auxcurves = [];
      prev_intersections = [];
      corners = [];
      pv_modules = [];
      marker_mode = "auxline";
      selected_pv_module = "";

      // when changing image mark the auxline button as active
      remove_active_tag(buttons_drawing);
      document.getElementById("btn-draw-auxline").classList.add("btn-active")

      var g_element = svg.append("g")
          .attr("id", "g_element");

      var image_element = svg.select("#g_element")
          .append('image');

      // set image
      const selectedListIdx = imagesSelectionList.selectedIndex;
      selected_image = {
        id: event.target.children[selectedListIdx].dataset.imageId,
        name: event.target.children[selectedListIdx].dataset.imageName
      }

      const image_id = selected_image["id"];
      getImageUrl(image_id).then(imageURL => {
        image_element.attr('href', imageURL);
      });      

      // image zoom and translation
      var zoom_handler = d3.zoom()
        .on("zoom", zoom_actions);
      function zoom_actions(){
        g_element.attr("transform", d3.event.transform);
      }
      zoom_handler(svg);

      // determine image dimensions
      var img = new Image();
      img.onload = function(){
        img_width = img.width;
        img_height = img.height;
        console.log("Changed image:", img.width, img.height);

        // center the image in the svg
        var svg_width = Number(svg.style("width").replace("px", ""));
        var svg_height = Number(svg.style("height").replace("px", ""));
        img_offset_x = svg_width/2 - img_width/2;
        img_offset_y = svg_height/2 - img_height/2;
        var initial_transform = d3.zoomIdentity.translate(img_offset_x, img_offset_y);
        svg.call(zoom_handler.transform, initial_transform);
      }
      getImageUrl(image_id).then(imageURL => {
        img.src = imageURL;
      });

      // add lines connecting the center cursor with the nearest four corners
      for (var i = 0; i < 4; i++) {
      svg.select("#g_element")
        .append("line")
          .attr("id", "center-line-"+[i])
          .style("stroke", "magenta")
          .style("stroke-dasharray", ("2, 2"))
          .style("stroke-width", 0.5)
          .style("stroke-opacity", 0);
      }

      // maintain previous cursor state when changing to another image
      svg.select("#g_element")
        .append("g")
        .append("circle")
          .attr("id", "cursor")
          .attr('r', 2)
          .style("fill", "magenta")
          .style("opacity", 0)
          .style("fill-opacity", 1)
          .style("stroke", null);

      // we need these two groups to maintain a consistent z ordering of corners and modules
      svg.select("#g_element")
        .append("g")
          .attr("id", "g_auxobjects");
      svg.select("#g_element")
        .append("g")
          .attr("id", "g_pv_modules");
      svg.select("#g_element")
        .append("g")
          .attr("id", "g_corners");

      // check if annotation exist for the selected image and load it
      if (selected_image["id"] !== null) {
        getAnnotation(selected_image["id"]);
      }
    }
    document.getElementById('images-selection-list').addEventListener("MDCList:selectionChange", images_selection_changed);

    svg = d3.select('svg');

    // parse translation and scale from the image transform
    function getTranslationScale(g_element) {
      var matrix = g_element.transform.baseVal.consolidate().matrix;
      img_offset_x = matrix.e;
      img_offset_y = matrix.f;
      img_scale = matrix.d;
      return [img_offset_x, img_offset_y, img_scale];
    }

    // get the current position of the cursor in the image coordinate system
    svg.on("mousemove", function () {
        var mouse = d3.mouse(this);  // acces mouse position via mouse[0], mouse[1]
        if (!d3.select("#g_element").empty()) {
          var [img_offset_x, img_offset_y, img_scale] = getTranslationScale(g_element);

          // transform mouse cooridnates to image coordinates
          img_pos_x = (mouse[0] - img_offset_x) / img_scale
          img_pos_y = (mouse[1] - img_offset_y) / img_scale

          // draw cursor
          svg.select("#cursor")
            .attr("cx", img_pos_x)
            .attr('cy', img_pos_y);

          // make center connection lines invisible
          for (var i = 0; i < 4; i++) {
            svg.select("#center-line-"+[i])
              .style("stroke-opacity", 0);
          }

          // find four nearest neighbouring corners when in center mode
          var findKNearest = function(point, corners, k) {
            distances = [];
            for (var i = 0; i < corners.length; i++) {
              var dist = Math.pow((corners[i].x - point.x), 2) + Math.pow((corners[i].y - point.y), 2);
              distances.push({'dist': dist, 'corner': corners[i]});
            }
            var distances_sorted = distances.sort(function(a, b) { return a.dist > b.dist ? 1 : -1});
            var neighbours = distances_sorted.slice(0, k);
            return neighbours;
          }

          // find neighbours and draw lines connecting the center cursor with the corners
          if (corners.length > 0 && marker_mode == "center") {
            neighbour_corners = findKNearest({x: img_pos_x, y: img_pos_y}, corners, 4);
            // draw supporting geometry for center point placement
            for (var i = 0; i < neighbour_corners.length; i++) {
              svg.select("#center-line-"+[i])
                .attr("x1", img_pos_x)
                .attr("y1", img_pos_y)
                .attr("x2", neighbour_corners[i].corner.x)
                .attr("y2", neighbour_corners[i].corner.y)
                .style("stroke-opacity", 1);
            }
          }
        }
    });

    // show cursor when entering the svg
    svg.on("mouseover", function () {
      svg.select("#cursor").style("opacity", 1);
      // make center connection lines visible
      if (marker_mode == "center") {
        for (var i = 0; i < 4; i++) {
          svg.select("#center-line-"+[i])
            .style("stroke-opacity", 1);
        }
      }
    });

    // hide cursor when leaving the SVG
    svg.on("mouseout", function () {
      svg.select("#cursor").style("opacity", 0);
      // make center connection lines invisible
      if (marker_mode == "center") {
        for (var i = 0; i < 4; i++) {
          svg.select("#center-line-"+[i])
            .style("stroke-opacity", 0);
        }
      }
    });

    // handle click of drawing mode button actions
    var buttons_drawing = document.getElementById('drawing-actions');
    var button_drawing_click = function(e) {
      remove_active_tag(buttons_drawing);
      reset_objects();
      selected_pv_module = "";
      draw();
      var btn = e.target;
      if (btn.id == 'btn-add-corner') {
        marker_mode = "corner";
        btn.classList.add("btn-active");
        // change cursor
        svg.select("#cursor")
          .style("fill", "magenta")
          .style("fill-opacity", 1)
          .style("stroke", null);
        console.log("Switched to corner mode");
      } else if (btn.id == 'btn-create-module') {
        marker_mode = "center";
        btn.classList.add("btn-active");
        svg.select("#cursor")
          .style("fill", "black")
          .style("fill-opacity", 1)
          .style("stroke", null);
        console.log("Switched to center mode");
      } else if (btn.id == 'btn-create-module-manual') {
        marker_mode = "center_manual";
        btn.classList.add("btn-active");
        svg.select("#cursor")
          .style("fill-opacity", 0)
          .style("stroke", null);
        console.log("Switched to center mode (manual)");
      } else if (btn.id == 'btn-erase') {
        marker_mode = "erase";
        btn.classList.add("btn-active");
        svg.select("#cursor")
          .style("fill", null)
          .style("fill-opacity", 0)
          .style("stroke", "red")
          .style("stroke-width", 0.5);
        console.log("Switched to erase mode");
      } else if (btn.id == 'btn-draw-auxline') {
        marker_mode = "auxline";
        btn.classList.add("btn-active");
        svg.select("#cursor")
          .style("fill", "magenta")
          .style("fill-opacity", 1)
          .style("stroke", null);
        console.log("Switched to auxline mode");
      } else if (btn.id == 'btn-draw-auxcurve') {
        marker_mode = "auxcurve";
        btn.classList.add("btn-active");
        svg.select("#cursor")
          .style("fill", "magenta")
          .style("fill-opacity", 1)
          .style("stroke", null);
        console.log("Switched to auxcurve mode");
      } else if (btn.id == 'btn-get-intersects') {
        marker_mode = null;
        svg.select("#cursor")
          .style("fill-opacity", 0)
          .style("stroke", null);
        compute_intersections(prev_intersections);
        selected_image_changed();
        draw();
        console.log("Computed new corners as intersections of auxiliary lines.");
      } else if (btn.id == 'btn-mark-module-partially-visible') {
        marker_mode = "mark_module_partially_visible";
        btn.classList.add("btn-active");
        svg.select("#cursor")
          .style("fill-opacity", 0)
          .style("stroke", null);
      }
    };
    buttons_drawing.addEventListener('click', button_drawing_click, false);

    // place a new marker when clicking
    svg.on("click", function () {
      if (marker_mode == "corner") {
        corners.push({x: img_pos_x, y: img_pos_y, id: uuidv4()});
        console.log("Placed a new corner marker at (", img_pos_x, ",", img_pos_y, ")");
        selected_image_changed();
        draw();
      }
      else if (marker_mode == "center") {
        if (corners.length < 4) {
          alert("Before you can create a grid cell you need to place at least four corner markers first.");
        } else {
          // sort neighbouring corners ccw
          var neighbours = [];
          for (var i = 0; i < neighbour_corners.length; i++) {
            neighbours.push(neighbour_corners[i].corner);
          }
          neighbours = order_corners_ccw(neighbours);
          center_point = compute_center_point(neighbours);
          // store the new pv module
          pv_modules.push({"corners": neighbours, "center": center_point, "id": uuidv4(), "truncated": false});
          console.log("Placed a new grid cell at (", center_point.x, ",", center_point.y, ")");
          selected_image_changed();
          draw();          
        }
      }
      else if (marker_mode == "auxline") {
        temp_auxline_pts.push({x: img_pos_x, y: img_pos_y});
        if (temp_auxline_pts.length == 2) {
          auxlines.push({
            x1: temp_auxline_pts[0].x,
            y1: temp_auxline_pts[0].y,
            x2: temp_auxline_pts[1].x,
            y2: temp_auxline_pts[1].y,
            id: uuidv4()
          });
          console.log("Placed auxiliary line from (", temp_auxline_pts[0].x, ",",
            temp_auxline_pts[0].y, ") to (", temp_auxline_pts[1].x, ",", temp_auxline_pts[1].y, ")");
          temp_auxline_pts = [];
          selected_image_changed();
          draw();
        }
      }
      else if (marker_mode == "auxcurve") {
        temp_auxcurve_pts.push([img_pos_x, img_pos_y]);
        if (temp_auxcurve_pts.length == 3) {
          auxcurves.push({points: temp_auxcurve_pts, id: uuidv4()});
          temp_auxcurve_pts = [];
          console.log("Placed auxiliary curve");
          selected_image_changed();
          draw();
        }
      }
    });
    // sorts four corners into [tr, tl, bl, br] order
    var order_corners_ccw = function(corners) {
      var corners_sorted = corners.sort(function(a, b) { return a.x > b.x ? 1 : -1});
      var corners_left = corners_sorted.slice(0, 2);
      var corners_right = corners_sorted.slice(2, 4);
      var corners_left_sorted = corners_left.sort(function(a, b) { return a.y > b.y ? 1 : -1});
      var tl = corners_left_sorted[0];
      var bl = corners_left_sorted[1];
      var corners_right_sorted = corners_right.sort(function(a, b) { return a.y > b.y ? 1 : -1});
      var tr = corners_right_sorted[0];
      var br = corners_right_sorted[1];
      return [tr, tl, bl, br];
    };
    // computes the center point given four corner points
    var compute_center_point = function(corners) {
      var center_point = {x: 0, y: 0};
      for (var i = 0; i < corners.length; i++) {
        center_point.x += corners[i].x;
        center_point.y += corners[i].y;
      }
      center_point.x /= corners.length;
      center_point.y /= corners.length;
      return center_point;
    };

    // find all pairwise intersections between auxiliary lines and curves
    function compute_intersections() {
      // find all intersections between two paths
      function intersect_paths(path0, path1) {
        function remove_duplicates(points) {
          return points.filter((a, b) => points.indexOf(a) === b);
        }
        var intersects = [];
        var overlays = Intersection.intersectShapes(path0, path1);
        for (i in overlays.points) {
          if (overlays.points[i].constructor.name == "Vector2D" || overlays.points[i].constructor.name == "Point2D") {
          intersects.push({x: overlays.points[i].x, y: overlays.points[i].y});
          }
        }
        if (typeof intersects !== 'undefined') {
          return remove_duplicates(intersects);
        }
        else {
          return [];
        }
      }

      // determine which intersections were added, removed and kept from previous intersections
      function get_diff(prev_intersects, intersects) {
        var added = [], removed = [], kept = [];
        for (var i = 0; i < intersects.length; i++) {
          if (prev_intersects.some(function(d) { return d.x == intersects[i].x && d.y == intersects[i].y } )) {
            kept.push(intersects[i]);
          } else {
            added.push(intersects[i]);
          }
        }
        for (var i = 0; i < prev_intersects.length; i++) {
          if (!intersects.some(function(d) { return d.x == prev_intersects[i].x && d.y == prev_intersects[i].y } )) {
            removed.push(prev_intersects[i]);
          }
        }
        return [added, removed, kept];
      }

      var intersections = [];
      for(var k = 0; k < auxlines.length+auxcurves.length; k++) {
        for (var l = k + 1; l < auxlines.length+auxcurves.length; l++) {
          var aux_obj = [
            svg.selectAll(".auxobj").nodes()[k],
            svg.selectAll(".auxobj").nodes()[l]
          ]

          // create path objects (Line/Path) depending on whether the element is a line or curve
          var path = [];
          for (var i = 0; i < 2; i++) {
            if (aux_obj[i].classList.contains("auxline")) {
              path.push(new Line(aux_obj[i]));
            } else if (aux_obj[i].classList.contains("auxcurve")) {
              path.push(new Path(aux_obj[i]));
            }
          }
          // commpute intersection between path objects
          var intersects = intersect_paths(path[0], path[1]);
          intersections.push(...intersects);
        }
      }

      // find out which intersections have been added, kept or removed
      var [added, removed, kept] = get_diff(prev_intersections, intersections);
      prev_intersections = [...intersections];

      // add corners corresponding to the added intersections
      for (var i = 0; i < added.length; i++) {
        corners.push({x: added[i].x, y: added[i].y, id: uuidv4()});
      }
      // remove corners and all pv modules containing the corner
      for (var k = corners.length-1; k >= 0; k--) {
        if (removed.some(function(d) { return d.x == corners[k].x && d.y == corners[k].y })) {
          // if corner is part of a pv_module, delete the entire module
          del_idx = [];
          for (var i = 0; i < pv_modules.length; i++) {
            for(var j = 0; j < pv_modules[i].corners.length; j++) {
              if (pv_modules[i].corners[j].id == corners[k].id) {
                del_idx.push(i);
              }
            }
          }
          for (var i = del_idx.length-1; i >= 0; i--) {
            console.log("Deleting grid cell " + pv_modules[i].id + "(it contained deleted point " + corners[k].id + ")");
            pv_modules.splice(del_idx[i], 1);
          }
          corners.splice(k, 1);
        }
      }
    }

    // manual creation of pv modules (by clicking 4 corners)
    function corner_mouseclick_handler(d) {
      console.log("corner_mouseclick_handler");
      if (marker_mode == "center_manual") {
        if (corners.length < 4) {
          alert("Before you can create a grid cell you need to place at least four corner markers first.");
        } else {
          neighbours_manual_selection.push(d)
          if (neighbours_manual_selection.length == 4) {
            neighbours_manual_selection = order_corners_ccw(neighbours_manual_selection);
            center_point = compute_center_point(neighbours_manual_selection);
            // store the new pv module
            pv_modules.push({"corners": neighbours_manual_selection, "center": center_point, "id": uuidv4(), "truncated": false});
            console.log("Placed a new grid cell at (", center_point.x, ",", center_point.y, ")");
            neighbours_manual_selection = [];
            selected_image_changed();
            draw();
          }
        }

      }
    }

    // dragging of corner points
    function dragstarted(d) {
      d3.select(this).raise();
      svg.select("#g_element").attr("cursor", "grabbing");
    }
    function dragended(d) {
      svg.select("#g_element").attr("cursor", "default");
    }
    function dragged(d) {
      // update corner position
      d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
      // update center position and corner position of all pv modules which contain the marker
      for (var i = 0; i < pv_modules.length; i++) {
        for (var j = 0; j < pv_modules[i].corners.length; j++) {
          if (pv_modules[i].corners[j].id == d.id) {
            pv_modules[i].corners[j] = d;
            pv_modules[i].center = compute_center_point(pv_modules[i].corners);
          }
        }
      }
      selected_image_changed();
      draw();
    }

    // draging of auxline endpoints
    function auxline_dragged(d) {
      // update line coordinates
      if (this.classList.contains("auxline-startpoint")) {
        d3.select(this.parentNode).select("line")
          .attr("x1", d.x1 = d3.event.x)
          .attr("y1", d.y1 = d3.event.y);
      } else if (this.classList.contains("auxline-endpoint")) {
        d3.select(this.parentNode).select("line")
          .attr("x2", d.x2 = d3.event.x)
          .attr("y2", d.y2 = d3.event.y);
      }
      // update line endpoint
      d3.select(this).attr("cx", d.cx = d3.event.x).attr("cy", d.cy = d3.event.y);
      selected_image_changed();
      draw();
    }

    // computes auxcurve path from three control points
    function generate_auxcurve_data(curve_points) {
      var line_generator = d3.line()
        .curve(d3.curveCatmullRom.alpha(1));
      var path_data = line_generator(curve_points);
      return path_data;
    }

    // draging of auxcurve endpoints
    function auxcurve_dragged(d) {
      // update curve points
      var element_id = d3.select(this.parentNode).attr("id");
      for (var i = 0; i < auxcurves.length; i++) {
        if (auxcurves[i].id == element_id) {
          if (this.classList.contains("auxcurve-startpoint")) {
            auxcurves[i].points[0][0] = d3.event.x;
            auxcurves[i].points[0][1] = d3.event.y;
          } else if (this.classList.contains("auxcurve-middlepoint")) {
            auxcurves[i].points[1][0] = d3.event.x;
            auxcurves[i].points[1][1] = d3.event.y;
          } else if (this.classList.contains("auxcurve-endpoint")) {
            auxcurves[i].points[2][0] = d3.event.x;
            auxcurves[i].points[2][1] = d3.event.y;
          }
          d3.select(this.parentNode).select("path").attr("d", generate_auxcurve_data(auxcurves[i].points));
        }
      }
      // update line point
      d3.select(this).attr("cx", d3.event.x).attr("cy", d3.event.y);
      selected_image_changed();
      draw();
    }

    // delete objects in erase mode
    var erase_mousedown_handler = function(d) {
      function erase_corner_marker(element) {
        d3.select(element).on('mousedown.drag', null);  // remove drag handler before deleting element
        var element_id = d3.select(element).attr("id");
        // search and remove element from the corners array
        for (var i = corners.length-1; i >= 0; i--) {
          if (corners[i].id == element_id) {
            // before deleting corner remove it from the previous intersections array
            for (var j = prev_intersections.length-1; j >= 0; j--) {
              if (prev_intersections[j].x == corners[i].x && prev_intersections[j].y == corners[i].y) {
                  prev_intersections.splice(j, 1);
              }
            }
            // delete corner
            console.log("Deleting corner " + element_id);
            corners.splice(i, 1);
          }
        }
        // if corner is part of a pv_module, delete the entire module
        del_idx = [];
        for (var i = 0; i < pv_modules.length; i++) {
          for(var j = 0; j < pv_modules[i].corners.length; j++)
          {
            if (pv_modules[i].corners[j].id == element_id) {
              del_idx.push(i);
            }
          }
        }
        for (var i = del_idx.length-1; i >= 0; i--) {
          console.log("Deleting grid cell " + pv_modules[i].id + "(it contained deleted point " + element_id + ")");
          pv_modules.splice(del_idx[i], 1);
        }
      }

      function erase_auxline(element) {
        //d3.select(element).on('mousedown.drag', null);
        var element_id = d3.select(element.parentNode).attr("id");
        for (var i = auxlines.length-1; i >= 0; i--) {
          if (auxlines[i].id == element_id) {
            console.log("Deleting auxline " + element_id);
            auxlines.splice(i, 1);
          }
        }
      }

      function erase_auxcurve(element) {
        var element_id = d3.select(element.parentNode).attr("id");
        for (var i = auxcurves.length-1; i >= 0; i--) {
          if (auxcurves[i].id == element_id) {
            console.log("Deleting auxcurve " + element_id);
            auxcurves.splice(i, 1);
          }
        }
      }

      if (marker_mode == "erase") {
        if (this.classList.contains("corner_marker")) {
          erase_corner_marker(this);
        } else if (this.classList.contains("auxline-erase")) {
          erase_auxline(this);
        } else if (this.classList.contains("auxcurve-erase")) {
          erase_auxcurve(this);
        }
        selected_image_changed();
        draw();
      }
    };

    // selection of PV module with mouse
    var mark_module_partially_visible_handler = function(d) {
      if (marker_mode == "mark_module_partially_visible") {
        selected_pv_module = d.id;
        for (var i = 0; i < pv_modules.length; i++) {
          if (pv_modules[i]["id"] == selected_pv_module) {
            truncated = pv_modules[i]["truncated"];
            pv_modules[i]["truncated"] = !truncated;
          }
        }
        selected_image_changed();
        draw();
        save();
      }
    };

    var draw = function() {
      // auxiliary lines
      var svg_auxlines = svg.select("#g_auxobjects")
        .selectAll(".auxline")
        .data(auxlines, d => d["id"]);
      var svg_auxlines_enter = svg_auxlines.enter().append("g")
        .attr("id", function (d) { return d.id });
      svg_auxlines_enter.append("line")
        .attr("class", "auxobj auxline auxline-erase")
        .attr("x1", function (d) { return d.x1 })
        .attr("y1", function (d) { return d.y1 })
        .attr("x2", function (d) { return d.x2 })
        .attr("y2", function (d) { return d.y2 })
        .style("stroke", "magenta")
        .style("stroke-opacity", 0.5)
        .style("stroke-width", 1)
        .on("mousedown", erase_mousedown_handler);
      svg_auxlines_enter.append("circle")
        .attr("class", "auxline-startpoint auxline-erase")
        .attr("cx", function (d) { return d.x1 })
        .attr("cy", function (d) { return d.y1 })
        .style("r", 1.5)
        .style("fill", "magenta")
        .on("mousedown", erase_mousedown_handler)
        .call(d3.drag()
          .on("drag", auxline_dragged));
      svg_auxlines_enter.append("circle")
        .attr("class", "auxline-endpoint auxline-erase")
        .attr("cx", function (d) { return d.x2 })
        .attr("cy", function (d) { return d.y2 })
        .style("r", 1.5)
        .style("fill", "magenta")
        .on("mousedown", erase_mousedown_handler)
        .call(d3.drag()
          .on("drag", auxline_dragged));
      var svg_auxlines_merged = svg_auxlines_enter.merge(svg_auxlines);
      var svg_auxlines_exit = svg_auxlines.exit().each(function() { d3.select(this.parentNode).remove(); });

      // auxiliary curves
      var svg_auxcurves = svg.select("#g_auxobjects")
        .selectAll(".auxcurve")
        .data(auxcurves, d => d["id"]);
      var svg_auxcurves_enter = svg_auxcurves.enter().append("g")
        .attr("id", function (d) { return d.id });
      svg_auxcurves_enter.append("path")
        .attr("class", "auxobj auxcurve auxcurve-erase")
        .attr("d", function (d) { return generate_auxcurve_data(d.points) })
        .style("stroke", "magenta")
        .style("fill", "none")
        .style("stroke-width", 1)
        .style("stroke-opacity", 0.5)
        .on("mousedown", erase_mousedown_handler);
      svg_auxcurves_enter.append("circle")
        .attr("class", "auxcurve-startpoint auxcurve-erase")
        .attr("cx", function (d) { return d.points[0][0] })
        .attr("cy", function (d) { return d.points[0][1] })
        .style("r", 1.5)
        .style("fill", "magenta")
        .on("mousedown", erase_mousedown_handler)
        .call(d3.drag()
          .on("drag", auxcurve_dragged));
      svg_auxcurves_enter.append("circle")
        .attr("class", "auxcurve-middlepoint auxcurve-erase")
        .attr("cx", function (d) { return d.points[1][0] })
        .attr("cy", function (d) { return d.points[1][1] })
        .style("r", 1.5)
        .style("fill", "magenta")
        .on("mousedown", erase_mousedown_handler)
        .call(d3.drag()
          .on("drag", auxcurve_dragged));
      svg_auxcurves_enter.append("circle")
        .attr("class", "auxcurve-endpoint auxcurve-erase")
        .attr("cx", function (d) { return d.points[2][0] })
        .attr("cy", function (d) { return d.points[2][1] })
        .style("r", 1.5)
        .style("fill", "magenta")
        .on("mousedown", erase_mousedown_handler)
        .call(d3.drag()
          .on("drag", auxcurve_dragged));
      var svg_auxcurves_merged = svg_auxcurves_enter.merge(svg_auxcurves);
      var svg_auxcurves_exit = svg_auxcurves.exit().each(function() { d3.select(this.parentNode).remove(); });

      // corner markers
      svg.select("#g_corners")
          .selectAll(".corner_marker")
          .data(corners)
          .join("circle")
            .attr("class", "corner_marker")
            .attr('id', function (d) { return d.id; })
            .attr('cx', function (d) { return d.x; })
            .attr('cy', function (d) { return d.y; })
            .attr('r', 2)
            .attr("fill", "magenta")
            .on("mousedown.1", erase_mousedown_handler)
            .on("mousedown.2", corner_mouseclick_handler)
            .call(d3.drag()
              .on("start", dragstarted)
              .on("drag", dragged)
              .on("end", dragended));

      // pv modules
      svg.select("#g_pv_modules")
        .selectAll(".pv_module")
        .data(pv_modules)
        .join("polygon")
          .attr("class", "pv_module")
          .attr("id", function (d) { return d.id; })
          .attr("points", function (d) {
            return d.corners.map(function (d) { return [d.x, d.y].join(","); }).join(" "); })
          .style("fill", function (d) { if(d.truncated) {return "yellow"} else {return "lawngreen"}; })
          .style("fill-opacity", 0.5)
          .style("stroke", function (d) { if(d.truncated) {return "yellow"} else {return "lawngreen"}; })
          .style("stroke-width", 0.5)
          .on("mousedown", erase_mousedown_handler)
          .on("click", mark_module_partially_visible_handler);

      // center markers
      svg.select("#g_pv_modules")
        .selectAll(".pv_module_center")
        .data(pv_modules)
        .join("circle")
          .attr("class", "pv_module_center")
          .attr('cx', function (d) { return d.center.x })
          .attr('cy', function (d) { return d.center.y })
          .attr('r', 2)
          .attr("fill", "black");
    }

    // save annotations to JSON when changing the image
    async function save_to_json(image_id) {
      var annotation_data = {
          "data": {
            "image": selected_image["name"],
            "grid_cells": pv_modules,
            "corners": corners,
            "auxlines": auxlines,
            "auxcurves": auxcurves,
            "prev_intersections": prev_intersections
          }
      };

      await updateAnnotation(image_id, annotation_data);
    }
  }

  function exportThisProjectClicked() {
    exportProjectClicked(project_id);
  }


//##############################################################################################
//
//  projects.html
//
//##############################################################################################


const project_list_menus = {};

const project_delete_success_msg = "Project deleted.";
const project_delete_error_msg = "Failed to delete project.";
const project_imported_success_msg = "Project imported.";
const project_imported_error_msg = "Failed to import project";

// pagination and ordering
var total_num_projects = 0;
var projects_per_page = 3;
var pagination_num_neighbours = 2;
var projects_orderby = "name";
var projects_orderdir = "asc";

const delete_project_dialog = new mdc.dialog.MDCDialog(document.querySelector('#delete-project-dialog'));
var deleteProjectDialogEventListener;

const orderby_menu = new mdc.menu.MDCMenu(document.querySelector('.mdc-menu'));

getProjects = async function(existing_anotations, skip=0, limit=10, orderby="name", orderdir="asc") {
    var response = await apiService.getProjects(skip, limit, orderby, orderdir);

    if (response.status == 200) {
        total_num_projects = response.headers.get('X-Total-Count');
        const data = await response.json();
        data.forEach((project) => {
            const num_images = project.images.length;
            const num_annotated = countAnnotatedImages(project.images, existing_anotations);
            addProjectToProjectList(project, num_images, num_annotated);
        });
    } else if (response.status == 401) {
        redirectToLogin();
    } else {
        throw new Error(`Failed to get projects`);
    }
}

deleteProject = async function (project_id) {
    var response = await apiService.deleteProject(project_id)

    if (response.status == 200) {
        console.log(project_delete_success_msg);
        snackbar.labelText = project_delete_success_msg;
        snackbar.open();
    } else if (response.status == 401) {
        redirectToLogin();
    } else {
        console.log(project_delete_error_msg);
        snackbar.labelText = project_delete_error_msg;
        snackbar.open();
        throw new Error(`Failed to delete project with id ${project_id}`);
    }
    loadProjects();
}

importProject = async function(importProjectData) {
    var response = await apiService.importProject(importProjectData);

    if (response.status == 201) {
        console.log(project_imported_success_msg);
        snackbar.labelText = project_imported_success_msg;
        snackbar.open();
    } else if (response.status == 401) {
        redirectToLogin();
    } else {
        console.log(project_imported_error_msg);
        snackbar.labelText = project_imported_error_msg;    
        snackbar.open();
        throw new Error(`Failed to import project`);
    }
}

function makePagination() {
    var num_pages = Math.ceil(total_num_projects / projects_per_page);
    if (num_pages > 1) {
        const pagination = document.getElementById("pagination-projects").querySelector(".pagination-main");
        pagination.innerHTML = '';
        for (var page_num = 1; page_num <= num_pages; page_num++) {
            const html = `
                <button id="button-pagination-${page_num}" class="mdc-button button-pagination" onclick=goToPage(${page_num}); style="display: none;">
                    <span class="mdc-button__ripple"></span>
                    <span class="mdc-button__focus-ring"></span>
                    <span class="mdc-button__label">${page_num}</span>
                </button>`;
                pagination.appendChild(htmlToElements(html));
        }
    } else {
        document.getElementById("pagination-projects").style.display = "none";
    }
}

function updatePagination(page_num) {
    // compute which page numbers to show in pagination
    var num_pages = Math.ceil(total_num_projects / projects_per_page);
    var left = page_num - pagination_num_neighbours;
    var right = left + 2*pagination_num_neighbours;
    var num_add_right = Math.max(0, 1 - left);
    var num_add_left = -1*Math.min(0, num_pages - right);

    // show only the active element and its neighbours
    const dots_left = document.getElementById("pagination-projects").querySelector(".pagination-dots-left");
    const dots_right = document.getElementById("pagination-projects").querySelector(".pagination-dots-right");
    dots_left.style.display = "inline";
    dots_right.style.display = "inline";

    for (var i = 1; i <= num_pages; i++) {
        const button = document.getElementById(`button-pagination-${i}`);
        if ((i >= (left-num_add_left)) && (i <= (right+num_add_right))) {
            button.style.display = "inline";
            if (i == 1) {
                dots_left.style.display = "none"; // if page 1 is visible, hide pagination-dots-left
            }
            if (i == num_pages) {
                dots_right.style.display = "none";  // if last page is visible, hide pagination-dots-rights
            }
        } else {
            button.style.display = "none";
        }
    }
    highlightActivePage(page_num);  
}

function highlightActivePage(page_num) {
    const pagination = document.getElementById("pagination-projects");
    const pagination_buttons = pagination.querySelector(".pagination-main");
    Array.from(pagination_buttons.children).forEach((button) => {
        button.classList.remove("button-pagination-active");
    })
    pagination_buttons.querySelector(`#button-pagination-${page_num}`).classList.add("button-pagination-active");
}

async function goToPage(page_num) {
    // page_num is 1-based
    if (page_num == "first") {
        page_num = 1;
    } else if (page_num == "last") {
        var num_pages = Math.ceil(total_num_projects / projects_per_page);
        page_num = num_pages;
    }
    var skip = (page_num-1) * projects_per_page;
    updatePagination(page_num);      
    const existing_anotations = await getAnnotationIds();
    clearProjectsList();
    getProjects(existing_anotations, skip, projects_per_page, projects_orderby, projects_orderdir);
}

entrypoint(() => {
    loadProjects();
});

function clearProjectsList() {
    document.getElementById("projects-list").innerHTML = '';
    document.getElementById("projects-list-menu-list").innerHTML = '';
}

async function loadProjects() {        
    const existing_anotations = await getAnnotationIds();
    clearProjectsList();
    await getProjects(existing_anotations, 0, projects_per_page, "name", "asc");
    makePagination();
    updatePagination(1);
}

function addProjectToProjectList(project, num_images, num_annotated) {
    const created = new Date(project.created).toLocaleString("en-GB"); 
    const edited = new Date(project.edited).toLocaleString("en-GB");
    const html_list_item = `
        <li class="mdc-list-item mdc-list-item--with-two-lines mdc-list-item--with-trailing-image" onclick="annotateProjectClicked(${project.id})">
            <span class="mdc-list-item__ripple"></span>
            <span class="mdc-list-item__start"></span>
            <span class="mdc-list-item__content" id="projects-list-item-${project.id}">
                <span class="mdc-list-item__primary-text">${project.name}</span>
                <span class="mdc-list-item__secondary-text">${num_annotated} / ${num_images} images annotated | created ${created} | modified ${edited}</span>
            </span>
            <span class="mdc-list-item__end list-item-end-custom">
                <button class="mdc-icon-button material-icons" onclick="openMenu(${project.id}, event)">
                    <div class="mdc-icon-button__ripple"></div>
                    <span class="mdc-icon-button__focus-ring"></span>
                    more_vert
                </button>
            </span>
        </li>`;
    const html_menu_item = `
        <div class="mdc-menu mdc-menu-surface" id="projects-list-menu-${project.id}">
            <ul class="mdc-deprecated-list" role="menu" aria-hidden="true" aria-orientation="vertical" tabindex="-1">
                <li class="mdc-deprecated-list-item" role="menuitem" onclick="annotateProjectClicked(${project.id})">
                    <span class="mdc-deprecated-list-item__ripple"></span>
                    <span class="mdc-deprecated-list-item__text">Annotate</span>
                    <span class="mdc-deprecated-list-item__meta">
                        <i class="material-icons menu-icon">edit</i>
                    </span>
                </li>
                <li class="mdc-deprecated-list-item" role="menuitem" onclick="setupProjectClicked(${project.id})">
                    <span class="mdc-deprecated-list-item__ripple"></span>
                    <span class="mdc-deprecated-list-item__text">Setup</span>
                    <span class="mdc-deprecated-list-item__meta">
                        <i class="material-icons menu-icon">build</i>
                    </span>
                </li>
                <li class="mdc-deprecated-list-item" role="menuitem" onclick="exportProjectClicked(${project.id})">
                    <span class="mdc-deprecated-list-item__ripple"></span>
                    <span class="mdc-deprecated-list-item__text">Export</span>
                    <span class="mdc-deprecated-list-item__meta">
                        <i class="material-icons menu-icon">download</i>
                    </span>
                </li>
                <li class="mdc-deprecated-list-item" role="menuitem" onclick="deleteProjectClicked(${project.id})">
                    <span class="mdc-deprecated-list-item__ripple"></span>
                    <span class="mdc-deprecated-list-item__text">Delete</span>
                    <span class="mdc-deprecated-list-item__meta">
                        <i class="material-icons menu-icon">delete</i>
                    </span>
                </li>
            </ul>
        </div>`;
    document.getElementById('projects-list').appendChild(htmlToElements(html_list_item));
    document.getElementById('projects-list-menu-list').appendChild(htmlToElements(html_menu_item));
    project_list_menus[project.id] = new mdc.menu.MDCMenu(document.querySelector(`#projects-list-menu-${project.id}`));
    init_mui_elements();
}

function countAnnotatedImages(images, existing_anotations) {
    var num_annotated = 0;
    for (var i = 0; i < images.length; i++) {
        if (existing_anotations.includes(images[i].id)) {
            num_annotated++;
        }
    }
    return num_annotated;
}

function openMenu(project_id, event) {
    const menu = project_list_menus[project_id];
    menu.setAbsolutePosition(event.clientX, event.clientY);
    menu.open = !menu.open;
    event.stopPropagation();
}

async function annotateProjectClicked(project_id) {
  const url = FRONTEND_URLS.getEditorUrl+"?project_id="+project_id;
  const options = {
      method: 'GET',
      headers: new Headers({
          'Authorization': 'Bearer ' + localStorage.getItem("access_token")
      })
  }

  let response = await fetch(url, options);

  if (response.status == 200) {
      const data = await response.json();
      window.location.href = data.url;
  } else if (response.status == 401) {
      redirectToLogin();
  } else {
      throw new Error(`Failed to get url for annotating project with id ${project_id}`);
  }
}

function deleteProjectClicked(project_id) {
    const button_yes = document.getElementById("delete-project-dialog-button");
    button_yes.removeEventListener('click', deleteProjectDialogEventListener);
    deleteProjectDialogEventListener = deleteProject.bind(null, project_id);
    button_yes.addEventListener('click', deleteProjectDialogEventListener);
    delete_project_dialog.open();
}

async function importProjectFilesInputChanged(event) {
    const file = event.target.files[0];
    var importProjectData = new FormData();
    importProjectData.append("file", file);
    await importProject(importProjectData);
    loadProjects();
    event.target.value = null;  // to trigger onchange event even if the same file was selected
}

function newProjectButtonClicked() {
    window.location.href = FRONTEND_URLS.addProject;
}

function openOrderByMenuClicked() {
    orderby_menu.open = !orderby_menu.open;
}

async function orderBy(orderby, orderdir) {
    const existing_anotations = await getAnnotationIds();
    clearProjectsList();
    projects_orderby = orderby;
    projects_orderdir = orderdir;
    await getProjects(existing_anotations, 0, projects_per_page, projects_orderby, projects_orderdir);
    goToPage("first");
}

function init_mui_elements() {
    const listItemRipples = [].map.call(document.querySelectorAll('.mdc-list-item'), function(element) {
        return new mdc.ripple.MDCRipple(element);
    });
}


//##############################################################################################
//
//  login.html
//
//##############################################################################################


const textFieldsLogin = {
    username: new mdc.textField.MDCTextField(document.querySelector('#text-field-username')),
    password: new mdc.textField.MDCTextField(document.querySelector('#text-field-password'))
}

loginUser = async function(userData) {
    var response = await apiService.loginUser(userData);

    if (response.status == 200) {
        var data = await response.json();
        localStorage.setItem('access_token', data["access_token"]);
        console.log("Set JWT acces token: "+data["access_token"]);
        console.log("User logged in");
        redirectToProjects();
    } else if(response.status == 401) {
        // wrong credentials
        const error = await response.json();
        const alertBannerText = document.querySelector(".alert-banner-text");
        alertBannerText.innerHTML = error["detail"];
        const alertBanner = document.querySelector(".alert-banner");
        alertBanner.style.display = "flex";
    } else if(response.status == 422) {
        // field validation errors
        const errors = await response.json();
        parseValidationErrors(textFieldsLogin, errors);            
    } else {
        throw new Error("Unknown error when logging in.")
    }
}

function login() {
    const username = document.getElementById('text-field-username-input').value;
    const password = document.getElementById('text-field-password-input').value;

    const userData = new FormData();
    userData.append("username", username);
    userData.append("password", password);

    loginUser(userData);
}


//##############################################################################################
//
//  registration.html
//
//##############################################################################################


const textFieldsRegistration = {
    username: new mdc.textField.MDCTextField(document.querySelector('#text-field-username')),
    full_name: new mdc.textField.MDCTextField(document.querySelector('#text-field-fullname')),
    email: new mdc.textField.MDCTextField(document.querySelector('#text-field-email')),
    password: new mdc.textField.MDCTextField(document.querySelector('#text-field-password')),
    password_repeated: new mdc.textField.MDCTextField(document.querySelector('#text-field-password-repeated')),
}

createUser = async function (userData) {
    var response = await apiService.createUser(userData); 

    if (response.status == 201) {
        console.log("Created new user");
        redirectToProjects();
    } else if(response.status == 409) {
        // user already exists
        const error = await response.json();
        textFieldsRegistration.username.helperTextContent = error["detail"];
        textFieldsRegistration.username.valid = false;
    } else if(response.status == 422) {
        // field validation errors
        const errors = await response.json();
        parseValidationErrors(textFieldsRegistration, errors);            
    } else {
        throw new Error("Unknown error when creating user.")
    }
}

function register() {
    const username = document.getElementById('text-field-username-input').value;
    const password = document.getElementById('text-field-password-input').value;
    const password_repeated = document.getElementById('text-field-password-repeated-input').value;
    const fullname = document.getElementById('text-field-fullname-input').value;
    const email = document.getElementById('text-field-email-input').value;

    const userData = {
        "username": username,
        "email": email,
        "full_name": fullname,
        "disabled": false,
        "password": password,
        "password_repeated": password_repeated,
    };

    createUser(userData);
}