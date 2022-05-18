from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from . import models
from .database import engine
from .config import config

from .api import images, annotations, projects
from .frontend import frontend

models.Base.metadata.create_all(bind=engine)


def create_app(config):
    app = FastAPI()
    app.state.config = config

    app.add_middleware(
        CORSMiddleware,
        allow_origins=config["cors_origins"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(projects.create_router(config))
    app.include_router(images.create_router(config))
    app.include_router(annotations.create_router(config))
    
    app.mount("/static", StaticFiles(directory="app/frontend/static"), name="static")
    app.include_router(frontend.create_router(config))

    return app


app = create_app(config)


