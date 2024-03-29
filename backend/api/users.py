from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..dependencies import get_db
from ..auth import get_current_active_user
from ..auth import pwd_context


def create_router(settings):

    router = APIRouter()

    @router.post("/users/", response_model=schemas.UserInDB, status_code=201)
    def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
        user_dict = user.dict()
        # raise error if user already exists
        db_user = (
            db.query(models.User)
            .filter(models.User.username == user_dict["username"])
            .first()
        )
        if db_user:
            raise HTTPException(
                status_code=409,
                detail=f"User with username {user_dict['username']} already exists",
            )
        # else create new user
        password = user_dict.get("password")
        del user_dict["password"]
        user_dict["hashed_password"] = pwd_context.hash(password)
        del user_dict["password_repeated"]
        db_user = models.User(**user_dict)
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    @router.delete("/current_user/", response_model=schemas.UserInDB, status_code=200)
    def delete_current_user(
        db: Session = Depends(get_db),
        current_user: schemas.User = Depends(get_current_active_user),
    ):
        username = current_user.username
        db_user = db.query(models.User).filter(models.User.username == username).first()
        if not db_user:
            raise HTTPException(
                status_code=404, detail=f"User with username {username} not found"
            )
        else:
            db.delete(db_user)
            db.commit()
        return db_user

    @router.put("/current_user/", response_model=schemas.UserInDB, status_code=200)
    def update_current_user(
        user: schemas.UserCreate,
        db: Session = Depends(get_db),
        current_user: schemas.User = Depends(get_current_active_user),
    ):
        username = current_user.username
        db_user_query = db.query(models.User).filter(
            models.User.username == username,
        )
        db_user = db_user_query.first()
        if not db_user:
            raise HTTPException(
                status_code=404, detail=f"User with username {username} not found"
            )
        else:
            user_dict = user.dict()
            user_dict["hashed_password"] = pwd_context.hash(user_dict["password"])
            del user_dict["password"]
            del user_dict["password_repeated"]
            db_user_query.update(user_dict, synchronize_session=False)
            db.commit()
        return db_user

    # @router.get("/users/")
    # def get_users(
    #     db: Session = Depends(get_db),
    # ):
    #     db_users = db.query(models.User).all()
    #     return db_users

    return router
