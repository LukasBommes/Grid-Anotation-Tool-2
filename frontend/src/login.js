import { apiService } from './api.js';
import { 
    redirectToProjects,
    parseValidationErrors
} from './index.js';


const textFieldsLogin = {
    username: new mdc.textField.MDCTextField(document.querySelector('#text-field-username')),
    password: new mdc.textField.MDCTextField(document.querySelector('#text-field-password'))
}

document.getElementById("login-form-submit-button").addEventListener('click', login);
document.getElementById("alert-banner-icon").addEventListener('click', hideAlertBanner);

function hideAlertBanner() {
    document.getElementById("alert-banner-icon").parentElement.style.display = "none";
}

async function loginUser(userData) {
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
    console.log("clicked login")
    const username = document.getElementById('text-field-username-input').value;
    const password = document.getElementById('text-field-password-input').value;

    const userData = new FormData();
    userData.append("username", username);
    userData.append("password", password);

    loginUser(userData);
}