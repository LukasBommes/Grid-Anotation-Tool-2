from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy.orm import Session

from .. import schemas
from ..dependencies import get_db
from ..auth import authenticate_user, create_access_token


def create_router(settings):
    
    router = APIRouter()
    
    
    @router.post("/token", response_model=schemas.Token)
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

    
    return router