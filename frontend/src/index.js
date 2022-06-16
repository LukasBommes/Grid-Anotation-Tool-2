import { apiService } from './api.js';


async function getAnnotationIds() { // async function getAnnotationIds() leads to weird error because it overwrites above definition
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

async function getImageUrl(image_id) {
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

export { 
	entrypoint,
	getAnnotationIds,
	redirectToLogin,
    redirectToProjects,
	uuidv4,
	htmlToElements,
	parseValidationErrors,
	setupProjectClicked,
	exportProjectClicked,
	getImageUrl,
};