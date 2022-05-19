from datetime import datetime
from typing import List, Optional, Dict, Union

from pydantic import BaseModel


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Union[str, None] = None


class User(BaseModel):
    username: str
    email: Union[str, None] = None
    full_name: Union[str, None] = None
    disabled: Union[bool, None] = None


class UserCreate(User):
    password: str


class UserInDB(User):
    hashed_password: str

    class Config:
        orm_mode = True


class AnnotatioBase(BaseModel):
    data: Dict
    username: str


class AnnotationCreate(AnnotatioBase):
    pass


class Annotation(AnnotatioBase):
    id: int

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
    username: str


class ProjectCreate(ProjectBase):
    pass


class Project(ProjectBase):
    id: int
    created: datetime
    edited: datetime
    images: List[Image] = []

    class Config:
        orm_mode = True