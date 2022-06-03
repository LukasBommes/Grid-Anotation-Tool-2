from datetime import datetime
from typing import List, Optional, Dict, Union

from pydantic import BaseModel, EmailStr, ValidationError, validator
from pydantic.types import constr


class AnnotationBase(BaseModel):
    data: Dict


class AnnotationCreate(AnnotationBase):
    pass


class Annotation(AnnotationBase):
    id: int
    username: str

    class Config:
        orm_mode = True


class ImageBase(BaseModel):
    name: str


class ImageCreate(ImageBase):
    pass


class Image(ImageBase):
    id: int
    project_id: int
    username: str

    class Config:
        orm_mode = True


class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None


class ProjectCreate(ProjectBase):
    pass


class Project(ProjectBase):
    id: int
    created: datetime
    edited: datetime
    images: List[Image] = []
    username: str

    class Config:
        orm_mode = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Union[str, None] = None


class User(BaseModel):
    username: constr(strip_whitespace=True, min_length=1, max_length=255, strict=True)
    email: EmailStr
    full_name: constr(min_length=1, max_length=255, strict=True)
    disabled: bool = False

    @validator('username')
    def username_valid(cls, value):
        if not value.isalnum():
            raise ValueError('must be alphanumeric')
        return value


class UserCreate(User):
    password: constr(min_length=8, max_length=256, strict=True)
    password_repeated: constr(min_length=8, max_length=256, strict=True)

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
    id: int
    hashed_password: str
    projects: List[Project] = []

    class Config:
        orm_mode = True