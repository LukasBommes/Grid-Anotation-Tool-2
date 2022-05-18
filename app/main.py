from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from . import models
from .database import engine
from .config import settings

from .api import images, annotations, projects
from .frontend import frontend

models.Base.metadata.create_all(bind=engine)


def create_app(settings):
    app = FastAPI()
    app.state.config = settings

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(projects.create_router(settings))
    app.include_router(images.create_router(settings))
    app.include_router(annotations.create_router(settings))
    
    app.mount("/static", StaticFiles(directory="app/frontend/static"), name="static")
    app.include_router(frontend.create_router(settings))

    return app


app = create_app(settings)


