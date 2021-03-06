import { MDCTextField } from "@material/textfield";

import { apiService } from "../../api.js";
import { redirectToProjects, parseValidationErrors } from "../../utils.js";

const textFieldsRegistration = {
  username: new MDCTextField(document.querySelector("#text-field-username")),
  full_name: new MDCTextField(document.querySelector("#text-field-fullname")),
  email: new MDCTextField(document.querySelector("#text-field-email")),
  password: new MDCTextField(document.querySelector("#text-field-password")),
  password_repeated: new MDCTextField(
    document.querySelector("#text-field-password-repeated")
  ),
};

document
  .getElementById("registration-form-submit-button")
  .addEventListener("click", register);

async function createUser(userData) {
  var response = await apiService.createUser(userData);

  if (response.status == 201) {
    console.log("Created new user");
    redirectToProjects();
  } else if (response.status == 409) {
    // user already exists
    const error = await response.json();
    textFieldsRegistration.username.helperTextContent = error["detail"];
    textFieldsRegistration.username.valid = false;
  } else if (response.status == 422) {
    // field validation errors
    const errors = await response.json();
    parseValidationErrors(textFieldsRegistration, errors);
  } else {
    throw new Error("Unknown error when creating user.");
  }
}

function register() {
  const username = document.getElementById("text-field-username-input").value;
  const password = document.getElementById("text-field-password-input").value;
  const password_repeated = document.getElementById(
    "text-field-password-repeated-input"
  ).value;
  const fullname = document.getElementById("text-field-fullname-input").value;
  const email = document.getElementById("text-field-email-input").value;

  const userData = {
    username: username,
    email: email,
    full_name: fullname,
    disabled: false,
    password: password,
    password_repeated: password_repeated,
  };

  createUser(userData);
}
