from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.encoders import jsonable_encoder
from fastapi.templating import Jinja2Templates


def create_router(settings):
    
    router = APIRouter(tags=["frontend"])
    templates = Jinja2Templates(directory="app/frontend/templates")


    @router.get('/', response_class=HTMLResponse)
    @router.get('/projects', response_class=HTMLResponse)
    def projects(request: Request):
        return templates.TemplateResponse("projects.html", {"request": request, "api_url": settings.API_URL})


    @router.get('/add', response_class=HTMLResponse)
    async def add_project(request: Request):
        return templates.TemplateResponse("add_edit_project.html", {"request": request, "api_url": settings.API_URL, "project_id": None, "mode": "add"})


    @router.get('/get_edit_project_url', response_class=HTMLResponse)
    async def get_edit_project_url(request: Request, project_id: int):
        return JSONResponse(content=jsonable_encoder({"url": f'/edit/{project_id}'}))


    @router.get('/edit/{project_id}')
    async def edit_project(request: Request, project_id: int):
        return templates.TemplateResponse("add_edit_project.html", {"request": request, "api_url": settings.API_URL, "project_id": project_id, "mode": "edit"})


    @router.get('/get_editor_url', response_class=HTMLResponse)
    async def get_editor_url(request: Request, project_id: int):
        return JSONResponse(content=jsonable_encoder({"url": f'/editor/{project_id}'}))


    @router.get('/editor/{project_id}', response_class=HTMLResponse)
    async def editor(request: Request, project_id: int):
        return templates.TemplateResponse("editor.html", {"request": request, "api_url": settings.API_URL, "project_id": project_id})       


    return router