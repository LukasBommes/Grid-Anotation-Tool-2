var fetchService = (function () {
  let makeFetchRequest = function (
    httpMethod,
    url,
    data = null,
    formData = null,
    authorization = true
  ) {
    const options = {
      method: httpMethod,
    };

    let headers = {};
    if (authorization) {
      headers["Authorization"] =
        "Bearer " + localStorage.getItem("access_token");
    }

    if (data) {
      options.body = JSON.stringify(data);
      headers["Content-Type"] = "application/json";
    } else if (formData) {
      options.body = formData;
    }

    options.headers = new Headers(headers);

    let responsePromise = fetch(url, options);

    return responsePromise;
  };

  // public API
  return {
    makeFetchRequest: makeFetchRequest,
  };
})();

var apiService = (function () {
  let apiUrl = API_URL;

  let getProjects = function (skip, limit, orderby, orderdir) {
    let url = `${apiUrl}/projects/?skip=${skip}&orderby=${orderby}&orderdir=${orderdir}`;
    if (limit) {
      url += `&limit=${limit}`;
    }
    return fetchService.makeFetchRequest("GET", url, null, null, true);
  };

  let getProject = function (projectId) {
    let url = `${apiUrl}/project/${projectId}`;
    return fetchService.makeFetchRequest("GET", url, null, null, true);
  };

  let deleteProject = function (projectId) {
    let url = `${apiUrl}/project/${projectId}`;
    return fetchService.makeFetchRequest("DELETE", url, null, null, true);
  };

  let createProject = function (projectData) {
    let url = `${apiUrl}/projects/`;
    return fetchService.makeFetchRequest("POST", url, projectData, null, true);
  };

  let updateProject = function (projectId, projectData) {
    let url = `${apiUrl}/project/${projectId}`;
    return fetchService.makeFetchRequest("PUT", url, projectData, null, true);
  };

  let getAnnotationIds = function () {
    let url = `${apiUrl}/annotation_ids/`;
    return fetchService.makeFetchRequest("GET", url, null, null, true);
  };

  let exportProject = function (projectId) {
    let url = `${apiUrl}/export/${projectId}`;
    return fetchService.makeFetchRequest("GET", url, null, null, true);
  };

  let importProject = function (importProjectData) {
    let url = `${apiUrl}/import/`;
    return fetchService.makeFetchRequest(
      "POST",
      url,
      null,
      importProjectData,
      true
    );
  };

  let getImages = function (projectId, skip, limit, orderby, orderdir) {
    let url = `${apiUrl}/project/${projectId}/images/?skip=${skip}&orderby=${orderby}&orderdir=${orderdir}`;
    if (limit) {
      url += `&limit=${limit}`;
    }
    return fetchService.makeFetchRequest("GET", url, null, null, true);
  };

  let getImageFile = function (imageId) {
    let url = `${apiUrl}/image_file/${imageId}`;
    return fetchService.makeFetchRequest("GET", url, null, null, true);
  };

  let createImages = function (projectId, imagesData) {
    let url = `${apiUrl}/project/${projectId}/images/`;
    return fetchService.makeFetchRequest("POST", url, null, imagesData, true);
  };

  let deleteImage = function (imageId) {
    let url = `${apiUrl}/image/${imageId}`;
    return fetchService.makeFetchRequest("DELETE", url, null, null, true);
  };

  let getAnnotation = function (imageId) {
    let url = `${apiUrl}/annotation/${imageId}`;
    return fetchService.makeFetchRequest("GET", url, null, null, true);
  };

  let updateAnnotation = function (imageId, annotationData) {
    let url = `${apiUrl}/annotation/${imageId}`;
    return fetchService.makeFetchRequest(
      "PUT",
      url,
      annotationData,
      null,
      true
    );
  };

  let createUser = function (userData) {
    let url = `${apiUrl}/users/`;
    return fetchService.makeFetchRequest("POST", url, userData, null, false);
  };

  let loginUser = function (userData) {
    let url = `${apiUrl}/token`;
    return fetchService.makeFetchRequest("POST", url, null, userData, false);
  };

  let isValid = function (accessToken) {
    let url = `${apiUrl}/isvalid/${accessToken}`;
    return fetchService.makeFetchRequest("GET", url, null, null, false);
  };

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
    isValid: isValid,
  };
})();

export { apiService };
