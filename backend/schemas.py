from datetime import datetime
from typing import List, Optional, Dict, Union

from pydantic import BaseModel, EmailStr, ValidationError, validator
from pydantic.types import constr, conint


UserNameStr = constr(strip_whitespace=True, min_length=1, max_length=1024, strict=True)
IdInt = conint(ge=0, strict=True)


class AnnotationBase(BaseModel):
    data: Dict


class AnnotationCreate(AnnotationBase):
    pass


class Annotation(AnnotationBase):
    id: IdInt
    username: UserNameStr

    class Config:
        orm_mode = True


class ImageBase(BaseModel):
    name: str


class ImageCreate(ImageBase):
    pass


class Image(ImageBase):
    id: IdInt
    project_id: IdInt
    username: UserNameStr

    class Config:
        orm_mode = True


class ProjectBase(BaseModel):
    name: constr(strip_whitespace=True, min_length=1, max_length=1024, strict=True)
    description: Optional[constr(strip_whitespace=True, max_length=9999, strict=True)] = None


class ProjectCreate(ProjectBase):
    pass


class Project(ProjectBase):
    id: IdInt
    created: datetime
    edited: datetime
    images: List[Image] = []
    username: UserNameStr

    class Config:
        orm_mode = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Union[UserNameStr, None] = None


class User(BaseModel):
    username: UserNameStr
    email: EmailStr
    full_name: constr(min_length=1, max_length=1024, strict=True)
    disabled: bool = False

    @validator('username')
    def username_valid(cls, value):
        if not value.isalnum():
            raise ValueError('must be alphanumeric')
        return value


class UserCreate(User):
    password: constr(min_length=8, max_length=1024, strict=True)
    password_repeated: constr(min_length=8, max_length=1024, strict=True)

    @validator('password')
    def password_valid(cls, value):
        if value.isalnum():
            raise ValueError('must contain at least one special character')
        return value

    @validator('password_repeated')
    def passwords_match(cls, value, values, **kwargs):
        if 'password' in values and value != values['password']:
            raise ValueError('passwords do not match')
        return value


class UserInDB(User):
    id: IdInt
    hashed_password: str
    projects: List[Project] = []

    class Config:
        orm_mode = True