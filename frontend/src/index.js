import './index.scss';

import { MDCTextField } from '@material/textfield';
import { MDCRipple } from '@material/ripple';
import { MDCTooltip } from '@material/tooltip';

import {
    userIsLoggedIn,
    redirectToLogin,
    redirectToProjects
} from './utils.js';


document.getElementById("app-bar-home-button").addEventListener('click', homeButtonClicked);
document.getElementById("app-bar-login-button").addEventListener('click', loginButtonClicked);


const iconButtonRipples = [].map.call(document.querySelectorAll('.app-bar-icon-button'), function(element) {
    const ripple = new MDCRipple(element);
    ripple.unbounded = true;
    return ripple;
});

const textfields = [].map.call(document.querySelectorAll('.mdc-text-field'), function(element) {
    return new MDCTextField(element);
});

const tooltips = [].map.call(document.querySelectorAll('.mdc-tooltip'), function(element) {
    const tooltip = new MDCTooltip(element);
    tooltip.setShowDelay(500);
    tooltip.setHideDelay(0);
    return tooltip;
});


async function loginButtonClicked() {
    const loggedIn = await userIsLoggedIn();
    if (loggedIn) {
        logout();
    } else {
        redirectToLogin();
    }
}

function homeButtonClicked() {
    redirectToProjects();
}

setLoginButton();

async function setLoginButton() {
    const login_button_label = document.getElementById("app-bar-login-button-label");
    const login_button_icon = document.getElementById("app-bar-login-button-icon");
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