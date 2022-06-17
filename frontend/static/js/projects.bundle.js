(()=>{"use strict";var e=function(e,t,n=null,i=null,a=!0){const o={method:e};let c={};return a&&(c.Authorization="Bearer "+localStorage.getItem("access_token")),n?(o.body=JSON.stringify(n),c["Content-Type"]="application/json"):i&&(o.body=i),o.headers=new Headers(c),fetch(t,o)},t=function(){let t=API_URL;return{getProjects:function(n,i,a,o){return e("GET",`${t}/projects/?skip=${n}&limit=${i}&orderby=${a}&orderdir=${o}`,null,null,!0)},getProject:function(n){return e("GET",`${t}/project/${n}`,null,null,!0)},deleteProject:function(n){return e("DELETE",`${t}/project/${n}`,null,null,!0)},createProject:function(n){return e("POST",`${t}/projects/`,n,null,!0)},updateProject:function(n,i){return e("PUT",`${t}/project/${n}`,i,null,!0)},getAnnotationIds:function(){return e("GET",`${t}/annotation_ids/`,null,null,!0)},exportProject:function(n){return e("GET",`${t}/export/${n}`,null,null,!0)},importProject:function(n){return e("POST",`${t}/import/`,null,n,!0)},getImages:function(n){return e("GET",`${t}/project/${n}/images/`,null,null,!0)},getImageFile:function(n){return e("GET",`${t}/image_file/${n}`,null,null,!0)},createImages:function(n,i){return e("POST",`${t}/project/${n}/images/`,null,i,!0)},deleteImage:function(n){return e("DELETE",`${t}/image/${n}`,null,null,!0)},getAnnotation:function(n){return e("GET",`${t}/annotation/${n}`,null,null,!0)},updateAnnotation:function(n,i){return e("PUT",`${t}/annotation/${n}`,i,null,!0)},createUser:function(n){return e("POST",`${t}/users/`,n,null,!1)},loginUser:function(n){return e("POST",`${t}/token`,null,n,!1)},isValid:function(n){return e("GET",`${t}/isvalid/${n}`,null,null,!1)}}}();async function n(){var e=await t.getAnnotationIds();if(200==e.status)return await e.json();if(401!=e.status)throw new Error("Failed to get annotation ids");o()}async function i(e){var n=await t.exportProject(e);if(200==n.status){var i=n.headers.get("Content-Disposition").split(/;(.+)/)[1].split(/=(.+)/)[1];i=i.toLowerCase().startsWith("utf-8''")?decodeURIComponent(i.replace("utf-8''","")):i.replace(/['"]/g,"");const e=await n.blob();var a=document.createElement("a");a.href=URL.createObjectURL(e),a.download=i,document.body.appendChild(a),a.click(),a.remove()}else{if(401!=n.status)throw new Error(`Failed to export project with id ${e}`);o()}}async function a(e){const t=FRONTEND_URLS.getEditProjectUrl+"?project_id="+e,n={method:"GET",headers:new Headers({Authorization:"Bearer "+localStorage.getItem("access_token")})};let i=await fetch(t,n);if(200==i.status){const e=await i.json();window.location.href=e.url}else{if(401!=i.status)throw new Error(`Failed to get url for setting up project with id ${e}`);o()}}function o(){window.location.href=FRONTEND_URLS.login}function c(e){var t=document.createElement("template");return t.innerHTML=e,t.content}const l={},s="Project deleted.",r="Failed to delete project.",d="Project imported.",u="Failed to import project";var m=0,p="name",g="asc";const f=new mdc.dialog.MDCDialog(document.querySelector("#delete-project-dialog"));var y;const E=new mdc.menu.MDCMenu(document.querySelector(".mdc-menu")),w=new mdc.snackbar.MDCSnackbar(document.querySelector(".mdc-snackbar"));async function b(e,n=0,s=10,r="name",d="asc"){var u=await t.getProjects(n,s,r,d);if(200==u.status)m=u.headers.get("X-Total-Count"),(await u.json()).forEach((t=>{const n=t.images.length,o=function(e,t){for(var n=0,i=0;i<e.length;i++)t.includes(e[i].id)&&n++;return n}(t.images,e);!function(e,t,n){const o=new Date(e.created).toLocaleString("en-GB"),s=new Date(e.edited).toLocaleString("en-GB"),r=`\n        <li class="mdc-list-item mdc-list-item--with-two-lines mdc-list-item--with-trailing-image" id="projects-list-item-${e.id}">\n            <span class="mdc-list-item__ripple"></span>\n            <span class="mdc-list-item__start"></span>\n            <span class="mdc-list-item__content">\n                <span class="mdc-list-item__primary-text">${e.name}</span>\n                <span class="mdc-list-item__secondary-text">${n} / ${t} images annotated | created ${o} | modified ${s}</span>\n            </span>\n            <span class="mdc-list-item__end list-item-end-custom">\n                <button class="mdc-icon-button material-icons" id="projects-list-item-menu-button-${e.id}">\n                    <div class="mdc-icon-button__ripple"></div>\n                    <span class="mdc-icon-button__focus-ring"></span>\n                    more_vert\n                </button>\n            </span>\n        </li>`,d=`\n        <div class="mdc-menu mdc-menu-surface" id="projects-list-menu-${e.id}">\n            <ul class="mdc-deprecated-list" role="menu" aria-hidden="true" aria-orientation="vertical" tabindex="-1">\n                <li class="mdc-deprecated-list-item" role="menuitem" id="projects-list-menu-annotate-${e.id}">\n                    <span class="mdc-deprecated-list-item__ripple"></span>\n                    <span class="mdc-deprecated-list-item__text">Annotate</span>\n                    <span class="mdc-deprecated-list-item__meta">\n                        <i class="material-icons menu-icon">edit</i>\n                    </span>\n                </li>\n                <li class="mdc-deprecated-list-item" role="menuitem" id="projects-list-menu-setup-${e.id}">\n                    <span class="mdc-deprecated-list-item__ripple"></span>\n                    <span class="mdc-deprecated-list-item__text">Setup</span>\n                    <span class="mdc-deprecated-list-item__meta">\n                        <i class="material-icons menu-icon">build</i>\n                    </span>\n                </li>\n                <li class="mdc-deprecated-list-item" role="menuitem" id="projects-list-menu-export-${e.id}">\n                    <span class="mdc-deprecated-list-item__ripple"></span>\n                    <span class="mdc-deprecated-list-item__text">Export</span>\n                    <span class="mdc-deprecated-list-item__meta">\n                        <i class="material-icons menu-icon">download</i>\n                    </span>\n                </li>\n                <li class="mdc-deprecated-list-item" role="menuitem" id="projects-list-menu-delete-${e.id}">\n                    <span class="mdc-deprecated-list-item__ripple"></span>\n                    <span class="mdc-deprecated-list-item__text">Delete</span>\n                    <span class="mdc-deprecated-list-item__meta">\n                        <i class="material-icons menu-icon">delete</i>\n                    </span>\n                </li>\n            </ul>\n        </div>`;document.getElementById("projects-list").appendChild(c(r)),document.getElementById("projects-list-menu-list").appendChild(c(d)),document.getElementById(`projects-list-item-${e.id}`).addEventListener("click",L.bind(null,e.id)),document.getElementById(`projects-list-item-menu-button-${e.id}`).addEventListener("click",I.bind(null,e.id)),document.getElementById(`projects-list-menu-annotate-${e.id}`).addEventListener("click",L.bind(null,e.id)),document.getElementById(`projects-list-menu-setup-${e.id}`).addEventListener("click",a.bind(null,e.id)),document.getElementById(`projects-list-menu-export-${e.id}`).addEventListener("click",i.bind(null,e.id)),document.getElementById(`projects-list-menu-delete-${e.id}`).addEventListener("click",B.bind(null,e.id)),l[e.id]=new mdc.menu.MDCMenu(document.querySelector(`#projects-list-menu-${e.id}`)),[].map.call(document.querySelectorAll(".mdc-list-item"),(function(e){return new mdc.ripple.MDCRipple(e)}))}(t,n,o)}));else{if(401!=u.status)throw new Error("Failed to get projects");o()}}async function j(e){var n=await t.deleteProject(e);if(200==n.status)console.log(s),w.labelText=s,w.open();else{if(401!=n.status)throw console.log(r),w.labelText=r,w.open(),new Error(`Failed to delete project with id ${e}`);o()}v()}function $(e){var t=Math.ceil(m/3),n=e-2,i=n+4,a=Math.max(0,1-n),o=-1*Math.min(0,t-i);const c=document.getElementById("pagination-projects").querySelector(".pagination-dots-left"),l=document.getElementById("pagination-projects").querySelector(".pagination-dots-right");c.style.display="inline",l.style.display="inline";for(var s=1;s<=t;s++){const e=document.getElementById(`button-pagination-${s}`);s>=n-o&&s<=i+a?(e.style.display="inline",1==s&&(c.style.display="none"),s==t&&(l.style.display="none")):e.style.display="none"}!function(e){const t=document.getElementById("pagination-projects").querySelector(".pagination-main");Array.from(t.children).forEach((e=>{e.classList.remove("button-pagination-active")})),t.querySelector(`#button-pagination-${e}`).classList.add("button-pagination-active")}(e)}async function _(e){"first"==e?e=1:"last"==e&&(e=Math.ceil(m/3));var t=3*(e-1);$(e);const i=await n();h(),b(i,t,3,p,g)}function h(){document.getElementById("projects-list").innerHTML="",document.getElementById("projects-list-menu-list").innerHTML=""}async function v(){const e=await n();h(),await b(e,0,3,"name","asc"),function(){var e=Math.ceil(m/3);if(e>1){const n=document.getElementById("pagination-projects").querySelector(".pagination-main");n.innerHTML="";for(var t=1;t<=e;t++){const e=`\n                <button id="button-pagination-${t}" class="mdc-button button-pagination" style="display: none;">\n                    <span class="mdc-button__ripple"></span>\n                    <span class="mdc-button__focus-ring"></span>\n                    <span class="mdc-button__label">${t}</span>\n                </button>`;n.appendChild(c(e)),document.getElementById(`button-pagination-${t}`).addEventListener("click",_.bind(null,t))}}else document.getElementById("pagination-projects").style.display="none"}(),$(1)}function I(e,t){const n=l[e];n.setAbsolutePosition(t.clientX,t.clientY),n.open=!n.open,t.stopPropagation()}async function L(e){const t=FRONTEND_URLS.getEditorUrl+"?project_id="+e,n={method:"GET",headers:new Headers({Authorization:"Bearer "+localStorage.getItem("access_token")})};let i=await fetch(t,n);if(200==i.status){const e=await i.json();window.location.href=e.url}else{if(401!=i.status)throw new Error(`Failed to get url for annotating project with id ${e}`);o()}}function B(e){const t=document.getElementById("delete-project-dialog-button");t.removeEventListener("click",y),y=j.bind(null,e),t.addEventListener("click",y),f.open()}async function T(e,t){const i=await n();h(),p=e,g=t,await b(i,0,3,p,g),_("first")}document.getElementById("import-project-input").addEventListener("change",(async function(e){const n=e.target.files[0];var i=new FormData;i.append("file",n),await async function(e){var n=await t.importProject(e);if(201==n.status)console.log(d),w.labelText=d,w.open();else{if(401!=n.status)throw console.log(u),w.labelText=u,w.open(),new Error("Failed to import project");o()}}(i),v(),e.target.value=null})),document.getElementById("orderby-menu-open-button").addEventListener("click",(function(){E.open=!E.open})),document.getElementById("new-project-button").addEventListener("click",(function(){window.location.href=FRONTEND_URLS.addProject})),document.getElementById("orderby-menu-name-asc").addEventListener("click",T.bind(null,"name","asc")),document.getElementById("orderby-menu-name-desc").addEventListener("click",T.bind(null,"name","desc")),document.getElementById("orderby-menu-created-asc").addEventListener("click",T.bind(null,"created","asc")),document.getElementById("orderby-menu-created-desc").addEventListener("click",T.bind(null,"created","desc")),document.getElementById("orderby-menu-edited-asc").addEventListener("click",T.bind(null,"edited","asc")),document.getElementById("orderby-menu-edited-desc").addEventListener("click",T.bind(null,"edited","desc")),document.getElementById("button-pagination-first").addEventListener("click",_.bind(null,"first")),document.getElementById("button-pagination-last").addEventListener("click",_.bind(null,"last")),async function(e){await async function(){const e=localStorage.getItem("access_token");if(!e)return!1;var n=await t.isValid(e);if(200==n.status)return(await n.json()).isvalid;throw new Error("Failed to determine whether user is logged in")}()?v():o()}()})();