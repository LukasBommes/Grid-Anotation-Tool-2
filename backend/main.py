from datetime import timedelta

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from . import models, schemas
from .database import engine
from .config import settings
from .dependencies import get_db
from .auth import authenticate_user, create_access_token, fake_users_db

from .api import images, annotations, projects, users

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

    app.include_router(
        users.create_router(settings), 
        prefix="/api", 
        tags=["users"]
    )
    app.include_router(
        projects.create_router(settings), 
        prefix="/api", 
        tags=["projects"]
    )
    app.include_router(
        images.create_router(settings), 
        prefix="/api", 
        tags=["images"]
    )
    app.include_router(
        annotations.create_router(settings), 
        prefix="/api", 
        tags=["annotations"]
    )


    @app.post("/api/token", response_model=schemas.Token)
    async def login_for_access_token(
        form_data: OAuth2PasswordRequestForm = Depends(), 
        db: Session = Depends(get_db)
    ):
        user = authenticate_user(db, form_data.username, form_data.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}


    return app


app = create_app(settings)


