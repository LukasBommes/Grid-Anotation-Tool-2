from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models, schemas
from ..dependencies import get_db
from ..auth import pwd_context


def create_router(settings):
    
    router = APIRouter()

    # TODO: 
    # - update and delete user
    # - tests
    
    @router.post("/users/", response_model=schemas.UserInDB, status_code=201)
    def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
        user_dict = user.dict()
        password = user_dict.get("password")
        del user_dict["password"]
        user_dict["hashed_password"] = pwd_context.hash(password)
        db_user = models.User(**user_dict)
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user


    return router