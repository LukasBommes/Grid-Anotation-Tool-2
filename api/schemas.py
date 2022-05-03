from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class ImageBase(BaseModel):
    name: str


class ImageCreate(ImageBase):
    pass


class Image(ImageBase):
    id: int
    project_id: int

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

    class Config:
        orm_mode = True