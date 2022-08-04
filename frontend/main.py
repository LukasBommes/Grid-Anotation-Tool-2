from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.encoders import jsonable_encoder
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles

from .config import settings


app = FastAPI()
app.mount("/static", StaticFiles(directory="frontend/static"), name="static")
templates = Jinja2Templates(directory="frontend/templates")


@app.get("/", response_class=HTMLResponse)
@app.get("/projects", response_class=HTMLResponse)
async def projects(request: Request):
    return templates.TemplateResponse(
        "projects.html", {"request": request, "api_url": settings.API_URL}
    )


@app.get("/add", response_class=HTMLResponse)
async def add_project(request: Request):
    return templates.TemplateResponse(
        "add_edit_project.html",
        {
            "request": request,
            "api_url": settings.API_URL,
            "project_id": None,
            "mode": "add",
        },
    )


@app.get("/get_edit_project_url", response_class=HTMLResponse)
async def get_edit_project_url(request: Request, project_id: int):
    return JSONResponse(content=jsonable_encoder({"url": f"/edit/{project_id}"}))


@app.get("/edit/{project_id}")
async def edit_project(request: Request, project_id: int):
    return templates.TemplateResponse(
        "add_edit_project.html",
        {
            "request": request,
            "api_url": settings.API_URL,
            "project_id": project_id,
            "mode": "edit",
        },
    )


@app.get("/get_editor_url", response_class=HTMLResponse)
async def get_editor_url(request: Request, project_id: int):
    return JSONResponse(content=jsonable_encoder({"url": f"/editor/{project_id}"}))


@app.get("/editor/{project_id}", response_class=HTMLResponse)
async def editor(request: Request, project_id: int):
    return templates.TemplateResponse(
        "editor.html",
        {"request": request, "api_url": settings.API_URL, "project_id": project_id},
    )


@app.get("/editor-settings/", response_class=HTMLResponse)
async def editor_settings(request: Request):
    return templates.TemplateResponse(
        "editor_settings.html",
        {"request": request, "api_url": settings.API_URL},
    )


@app.get("/login/", response_class=HTMLResponse)
async def login(request: Request):
    return templates.TemplateResponse(
        "login.html", {"request": request, "api_url": settings.API_URL}
    )


@app.get("/registration/", response_class=HTMLResponse)
async def registration(request: Request):
    return templates.TemplateResponse(
        "registration.html", {"request": request, "api_url": settings.API_URL}
    )


@app.get("/user/", response_class=HTMLResponse)
async def edit_user(request: Request):
    return templates.TemplateResponse(
        "edit_user.html", {"request": request, "api_url": settings.API_URL}
    )
