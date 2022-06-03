from sqlalchemy import Column, ForeignKey, Integer, String, DateTime, JSON, Boolean
from sqlalchemy.orm import relationship

from .database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    email = Column(String)
    full_name = Column(String)
    disabled = Column(Boolean)
    
    projects = relationship("Project", backref="user", cascade="all, delete")


class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    description = Column(String)
    created = Column(DateTime)
    edited = Column(DateTime)
    username = Column(String, ForeignKey("users.username"))

    images = relationship("Image", backref="project", cascade="all, delete")


class Image(Base):
    __tablename__ = "images"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    project_id = Column(Integer, ForeignKey("projects.id"))
    username = Column(String, ForeignKey("users.username"))

    annotation = relationship("Annotation", uselist=False, backref="image", cascade="all, delete")


class Annotation(Base):
    __tablename__ = "annotations"
    id = Column(Integer, ForeignKey("images.id"), primary_key=True, index=True)
    data = Column(JSON, default={})
    username = Column(String, ForeignKey("users.username"))
