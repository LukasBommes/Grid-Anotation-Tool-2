import { apiService } from './api.js';
import { 
    entrypoint,
    getAnnotationIds,
    redirectToLogin,
    htmlToElements,
    setupProjectClicked,
    exportProjectClicked
} from './index.js';


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


document.getElementById("import-project-input").addEventListener('change', importProjectFilesInputChanged);
document.getElementById("orderby-menu-open-button").addEventListener('click', openOrderByMenuClicked);
document.getElementById("new-project-button").addEventListener('click', newProjectButtonClicked);
document.getElementById(`orderby-menu-name-asc`).addEventListener('click', orderBy.bind(null, 'name', 'asc'));
document.getElementById(`orderby-menu-name-desc`).addEventListener('click', orderBy.bind(null, 'name', 'desc'));
document.getElementById(`orderby-menu-created-asc`).addEventListener('click', orderBy.bind(null, 'created', 'asc'));
document.getElementById(`orderby-menu-created-desc`).addEventListener('click', orderBy.bind(null, 'created', 'desc'));
document.getElementById(`orderby-menu-edited-asc`).addEventListener('click', orderBy.bind(null, 'edited', 'asc'));
document.getElementById(`orderby-menu-edited-desc`).addEventListener('click', orderBy.bind(null, 'edited', 'desc'));
document.getElementById(`button-pagination-first`).addEventListener('click', goToPage.bind(null, "first"));
document.getElementById(`button-pagination-last`).addEventListener('click', goToPage.bind(null, "last"));

entrypoint(() => {
    loadProjects();
});

async function getProjects(existing_anotations, skip=0, limit=10, orderby="name", orderdir="asc") {
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

async function deleteProject(project_id) {
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

async function importProject(importProjectData) {
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
                <button id="button-pagination-${page_num}" class="mdc-button button-pagination" style="display: none;">
                    <span class="mdc-button__ripple"></span>
                    <span class="mdc-button__focus-ring"></span>
                    <span class="mdc-button__label">${page_num}</span>
                </button>`;
            pagination.appendChild(htmlToElements(html));
            document.getElementById(`button-pagination-${page_num}`).addEventListener('click', goToPage.bind(null, page_num));
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
        <li class="mdc-list-item mdc-list-item--with-two-lines mdc-list-item--with-trailing-image" id="projects-list-item-${project.id}">
            <span class="mdc-list-item__ripple"></span>
            <span class="mdc-list-item__start"></span>
            <span class="mdc-list-item__content">
                <span class="mdc-list-item__primary-text">${project.name}</span>
                <span class="mdc-list-item__secondary-text">${num_annotated} / ${num_images} images annotated | created ${created} | modified ${edited}</span>
            </span>
            <span class="mdc-list-item__end list-item-end-custom">
                <button class="mdc-icon-button material-icons" id="projects-list-item-menu-button-${project.id}">
                    <div class="mdc-icon-button__ripple"></div>
                    <span class="mdc-icon-button__focus-ring"></span>
                    more_vert
                </button>
            </span>
        </li>`;
    const html_menu_item = `
        <div class="mdc-menu mdc-menu-surface" id="projects-list-menu-${project.id}">
            <ul class="mdc-deprecated-list" role="menu" aria-hidden="true" aria-orientation="vertical" tabindex="-1">
                <li class="mdc-deprecated-list-item" role="menuitem" id="projects-list-menu-annotate-${project.id}">
                    <span class="mdc-deprecated-list-item__ripple"></span>
                    <span class="mdc-deprecated-list-item__text">Annotate</span>
                    <span class="mdc-deprecated-list-item__meta">
                        <i class="material-icons menu-icon">edit</i>
                    </span>
                </li>
                <li class="mdc-deprecated-list-item" role="menuitem" id="projects-list-menu-setup-${project.id}">
                    <span class="mdc-deprecated-list-item__ripple"></span>
                    <span class="mdc-deprecated-list-item__text">Setup</span>
                    <span class="mdc-deprecated-list-item__meta">
                        <i class="material-icons menu-icon">build</i>
                    </span>
                </li>
                <li class="mdc-deprecated-list-item" role="menuitem" id="projects-list-menu-export-${project.id}">
                    <span class="mdc-deprecated-list-item__ripple"></span>
                    <span class="mdc-deprecated-list-item__text">Export</span>
                    <span class="mdc-deprecated-list-item__meta">
                        <i class="material-icons menu-icon">download</i>
                    </span>
                </li>
                <li class="mdc-deprecated-list-item" role="menuitem" id="projects-list-menu-delete-${project.id}">
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

    document.getElementById(`projects-list-item-${project.id}`).addEventListener('click', annotateProjectClicked.bind(null, project.id));
    document.getElementById(`projects-list-item-menu-button-${project.id}`).addEventListener('click', openMenu.bind(null, project.id));
    document.getElementById(`projects-list-menu-annotate-${project.id}`).addEventListener('click', annotateProjectClicked.bind(null, project.id));
    document.getElementById(`projects-list-menu-setup-${project.id}`).addEventListener('click', setupProjectClicked.bind(null, project.id));
    document.getElementById(`projects-list-menu-export-${project.id}`).addEventListener('click', exportProjectClicked.bind(null, project.id));
    document.getElementById(`projects-list-menu-delete-${project.id}`).addEventListener('click', deleteProjectClicked.bind(null, project.id));
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


export { loadProjects };