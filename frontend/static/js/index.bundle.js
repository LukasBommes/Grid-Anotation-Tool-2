/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/api.js":
/*!********************!*\
  !*** ./src/api.js ***!
  \********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"apiService\": () => (/* binding */ apiService)\n/* harmony export */ });\nvar fetchService = function() {\n\n    let makeFetchRequest = function(httpMethod, url, data=null, formData=null, authorization=true) {\n\n        const options = {\n            method: httpMethod\n        }\n\n        let headers = {};\n        if (authorization) {\n            headers['Authorization'] = 'Bearer ' + localStorage.getItem(\"access_token\")\n        }\n\n        if (data) {\n            options.body = JSON.stringify(data);\n            headers['Content-Type'] = 'application/json';\n        } \n        else if (formData) {\n            options.body = formData;\n        }\n\n        options.headers = new Headers(headers);\n\n        let responsePromise = fetch(url, options);\n\n        return responsePromise;\n    }\n\n    // public API\n    return {\n        makeFetchRequest: makeFetchRequest\n    }\n\n}();\n\n\nvar apiService = function() {\n\n    let apiUrl = API_URL;\n\n    let getProjects = function(skip, limit, orderby, orderdir) {\n        let url = `${apiUrl}/projects/?skip=${skip}&limit=${limit}&orderby=${orderby}&orderdir=${orderdir}`;\n        return fetchService.makeFetchRequest('GET', url, null, null, true);\n    }\n\n    let getProject = function(projectId) {\n        let url = `${apiUrl}/project/${projectId}`;\n        return fetchService.makeFetchRequest('GET', url, null, null, true);\n    }\n\n    let deleteProject = function(projectId) {\n        let url = `${apiUrl}/project/${projectId}`;\n        return fetchService.makeFetchRequest('DELETE', url, null, null, true);\n    }\n\n    let createProject = function(projectData) {\n        let url = `${apiUrl}/projects/`;\n        return fetchService.makeFetchRequest('POST', url, projectData, null, true);\n    }\n\n    let updateProject = function(projectId, projectData) {\n        let url = `${apiUrl}/project/${projectId}`\n        return fetchService.makeFetchRequest('PUT', url, projectData, null, true);\n    }\n\n    let getAnnotationIds = function() {\n        let url = `${apiUrl}/annotation_ids/`;\n        return fetchService.makeFetchRequest('GET', url, null, null, true);\n    }\n\n    let exportProject = function(projectId) {\n        let url = `${apiUrl}/export/${projectId}`;\n        return fetchService.makeFetchRequest('GET', url, null, null, true);\n    }\n\n    let importProject = function(importProjectData) {\n        let url = `${apiUrl}/import/`;\n        return fetchService.makeFetchRequest('POST', url, null, importProjectData, true);\n    }\n\n    let getImages = function(projectId) {\n        let url = `${apiUrl}/project/${projectId}/images/`;\n        return fetchService.makeFetchRequest('GET', url, null, null, true);\n    }\n\n    let getImageFile = function(imageId) {\n        let url = `${apiUrl}/image_file/${imageId}`;\n        return fetchService.makeFetchRequest('GET', url, null, null, true);\n    }\n\n    let createImages = function(projectId, imagesData) {\n        let url = `${apiUrl}/project/${projectId}/images/`;\n        return fetchService.makeFetchRequest('POST', url, null, imagesData, true);\n    }\n\n    let deleteImage = function(imageId) {\n        let url = `${apiUrl}/image/${imageId}`;\n        return fetchService.makeFetchRequest('DELETE', url, null, null, true);\n    }\n\n    let getAnnotation = function(imageId) {\n        let url = `${apiUrl}/annotation/${imageId}`;\n        return fetchService.makeFetchRequest('GET', url, null, null, true);\n    }\n\n    let updateAnnotation = function(imageId, annotationData) {\n        let url = `${apiUrl}/annotation/${imageId}`;\n        return fetchService.makeFetchRequest('PUT', url, annotationData, null, true);\n    }\n\n    let createUser = function(userData) {\n        let url = `${apiUrl}/users/`;\n        return fetchService.makeFetchRequest('POST', url, userData, null, false);\n    }\n\n    let loginUser = function(userData) {\n        let url = `${apiUrl}/token`;\n        return fetchService.makeFetchRequest('POST', url, null, userData, false);\n    }\n\n    let isValid = function(accessToken) {\n        let url = `${apiUrl}/isvalid/${accessToken}`;\n        return fetchService.makeFetchRequest('GET', url, null, null, false);\n    }\n\n    // public API\n    return {\n        getProjects: getProjects,\n        getProject: getProject,\n        deleteProject: deleteProject,\n        createProject: createProject,\n        updateProject: updateProject,\n        getAnnotationIds: getAnnotationIds,\n        exportProject: exportProject,\n        importProject: importProject,\n        getImages: getImages,\n        getImageFile: getImageFile,\n        createImages: createImages,\n        deleteImage: deleteImage,\n        getAnnotation: getAnnotation,\n        updateAnnotation: updateAnnotation,\n        createUser: createUser,\n        loginUser: loginUser,\n        isValid: isValid\n    }\n\n}();\n\n\n\n\n//# sourceURL=webpack://frontend/./src/api.js?");

/***/ }),

/***/ "./src/index.js":
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"entrypoint\": () => (/* binding */ entrypoint),\n/* harmony export */   \"exportProjectClicked\": () => (/* binding */ exportProjectClicked),\n/* harmony export */   \"getAnnotationIds\": () => (/* binding */ getAnnotationIds),\n/* harmony export */   \"getImageUrl\": () => (/* binding */ getImageUrl),\n/* harmony export */   \"htmlToElements\": () => (/* binding */ htmlToElements),\n/* harmony export */   \"parseValidationErrors\": () => (/* binding */ parseValidationErrors),\n/* harmony export */   \"redirectToLogin\": () => (/* binding */ redirectToLogin),\n/* harmony export */   \"redirectToProjects\": () => (/* binding */ redirectToProjects),\n/* harmony export */   \"setupProjectClicked\": () => (/* binding */ setupProjectClicked),\n/* harmony export */   \"uuidv4\": () => (/* binding */ uuidv4)\n/* harmony export */ });\n/* harmony import */ var _api_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./api.js */ \"./src/api.js\");\n\n\n\nasync function getAnnotationIds() { // async function getAnnotationIds() leads to weird error because it overwrites above definition\n    var response = await _api_js__WEBPACK_IMPORTED_MODULE_0__.apiService.getAnnotationIds();\n\n    if (response.status == 200) {\n        const existing_anotations = await response.json();\n        return existing_anotations;\n    } else if (response.status == 401) {\n        redirectToLogin();\n    } else {\n        throw new Error(`Failed to get annotation ids`);\n    }\n}\n\nconst snackbar = new mdc.snackbar.MDCSnackbar(document.querySelector('.mdc-snackbar'));\n\nasync function entrypoint(entrypointFunc) {\n    const loggedIn = await userIsLoggedIn();\n    if (!loggedIn) {\n        redirectToLogin();\n    }\n    else {\n        entrypointFunc();\n    }\n}\n\nasync function userIsLoggedIn() {\n    const access_token = localStorage.getItem('access_token');\n    if (!access_token) {\n        return false;\n    }\n\n    // check if access token is not expired yet\n    var response = await _api_js__WEBPACK_IMPORTED_MODULE_0__.apiService.isValid(access_token);\n    // check if access token is not expired yet\n    if (response.status == 200) {\n        const status = await response.json();\n        return status.isvalid;\n    } else {\n        throw new Error(\"Failed to determine whether user is logged in\");\n    }\n}\n    \nfunction redirectToLogin() {\n    window.location.href = FRONTEND_URLS.login;\n}\n\nasync function loginButtonClicked() {\n    const loggedIn = await userIsLoggedIn();\n    if (loggedIn) {\n    logout();\n    } else {\n    redirectToLogin();\n    }\n}\n\nsetLoginButton();\n\nasync function setLoginButton() {\n    const login_button_label = document.getElementById(\"login-button-label\");\n    const login_button_icon = document.getElementById(\"login-button-icon\");\n    const loggedIn = await userIsLoggedIn();\n    if (loggedIn) {\n    console.log(\"setting button\")\n    login_button_label.innerHTML = \"Sign out\";\n    login_button_icon.innerHTML = \"logout\";\n    } else {\n    login_button_label.innerHTML = \"Login\";\n    login_button_icon.innerHTML = \"login\";\n    }\n}\n\nfunction logout() {\n    localStorage.removeItem('access_token');\n    console.log(\"Logged out\");\n    redirectToLogin();\n}\n\n// UUID creation, taken from: https://stackoverflow.com/a/2117523\nfunction uuidv4() {\n    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>\n      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)\n    );\n}\n\nfunction htmlToElements(html) {\n    var template = document.createElement('template');\n    template.innerHTML = html;\n    return template.content;\n}\n\nfunction redirectToProjects() {\n    window.location.href = FRONTEND_URLS.projects;\n}\n\nfunction homeButtonClicked() {\n    redirectToProjects();\n}\n\nfunction parseValidationErrors(textFields, errors) {\n    errors[\"detail\"].forEach((error) => {\n        const fieldname = error.loc[1];\n        console.log(fieldname);\n        textFields[fieldname].helperTextContent = error.msg;\n        textFields[fieldname].valid = false;                \n    });\n}\n\nasync function setupProjectClicked(project_id) {\n  const url = FRONTEND_URLS.getEditProjectUrl+\"?project_id=\"+project_id;\n  const options = {\n      method: 'GET',\n      headers: new Headers({\n          'Authorization': 'Bearer ' + localStorage.getItem(\"access_token\")\n      })\n  }\n\n  let response = await fetch(url, options);\n\n  if (response.status == 200) {\n      const data = await response.json();\n      window.location.href = data.url;\n  } else if (response.status == 401) {\n      redirectToLogin();\n  } else {\n      throw new Error(`Failed to get url for setting up project with id ${project_id}`);\n  }\n}\n\nasync function exportProjectClicked(project_id) {\n    var response = await _api_js__WEBPACK_IMPORTED_MODULE_0__.apiService.exportProject(project_id);\n\n    if (response.status == 200) {\n        // get filename\n        const disposition = response.headers.get('Content-Disposition');\n        filename = disposition.split(/;(.+)/)[1].split(/=(.+)/)[1];\n        if (filename.toLowerCase().startsWith(\"utf-8''\")) {\n            filename = decodeURIComponent(filename.replace(\"utf-8''\", ''));\n        } else {\n            filename = filename.replace(/['\"]/g, '');\n        }\n        // get data\n        const fileBlob = await response.blob();\n        // download file\n        var a = document.createElement('a');\n        a.href = URL.createObjectURL(fileBlob);\n        a.download = filename;\n        document.body.appendChild(a); // append the element to the dom, otherwise it won't work in Firefox\n        a.click();\n        a.remove();\n    } else if (response.status == 401) {\n        redirectToLogin();\n    } else {\n        throw new Error(`Failed to export project with id ${project_id}`);\n    }\n}\n\nasync function getImageUrl(image_id) {\n    var response = await _api_js__WEBPACK_IMPORTED_MODULE_0__.apiService.getImageFile(image_id);\n\n    if (response.status == 200) {\n        const imageBlob = await response.blob();\n        const imageURL = URL.createObjectURL(imageBlob);\n        return imageURL;\n    } else if (response.status == 401) {\n        redirectToLogin();\n    } else {\n        throw new Error(`Failed to get image file with id ${image_id}`);\n    }\n}\n\nconst iconButtonRipples = [].map.call(document.querySelectorAll('.app-bar-icon-button'), function(element) {\n    const ripple = new mdc.ripple.MDCRipple(element);\n    ripple.unbounded = true;\n    return ripple;\n});\n\nconst textfields = [].map.call(document.querySelectorAll('.mdc-text-field'), function(element) {\n    return new mdc.textField.MDCTextField(element);\n});\n\nconst tooltips = [].map.call(document.querySelectorAll('.mdc-tooltip'), function(element) {\n    const tooltip = new mdc.tooltip.MDCTooltip(element);\n    tooltip.setShowDelay(500);\n    tooltip.setHideDelay(0);\n    return tooltip;\n});\n\n\n\n//# sourceURL=webpack://frontend/./src/index.js?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./src/index.js");
/******/ 	
/******/ })()
;