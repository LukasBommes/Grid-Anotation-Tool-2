from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models, schemas
from ..dependencies import get_db


def create_router(settings):
    
    router = APIRouter()

    # TODO: 
    # - update and delete user
    # - tests

    @router.post("/users/", response_model=schemas.UserInDB, status_code=201)
    def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
        db_user = models.User(**user.dict())
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user


    return router