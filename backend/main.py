from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models
from .database import engine
from .config import settings
from .api import images, annotations, projects, users, authentication

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
        expose_headers=["Content-Disposition", "X-Total-Count"],
    )

    app.include_router(users.create_router(settings), prefix="/api", tags=["users"])
    app.include_router(authentication.create_router(settings), prefix="/api", tags=["authentication"])
    app.include_router(projects.create_router(settings), prefix="/api", tags=["projects"])
    app.include_router(images.create_router(settings), prefix="/api", tags=["images"])
    app.include_router(annotations.create_router(settings), prefix="/api", tags=["annotations"])    

    return app


app = create_app(settings)


