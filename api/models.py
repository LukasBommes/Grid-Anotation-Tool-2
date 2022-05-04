from sqlalchemy import Column, ForeignKey, Integer, String, DateTime
from sqlalchemy.orm import relationship

from .database import Base


class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    description = Column(String)
    created = Column(DateTime)
    edited = Column(DateTime)

    images = relationship("Image", backref="project", cascade="all, delete")


class Image(Base):
    __tablename__ = "images"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    project_id = Column(Integer, ForeignKey("projects.id"))