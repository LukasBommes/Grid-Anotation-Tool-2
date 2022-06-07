import os
from typing import List

from pydantic import BaseSettings


class Settings(BaseSettings):
    MEDIA_ROOT: str = os.getenv("MEDIA_ROOT", "images")
    CORS_ORIGINS: List[str] = [
        "http://localhost:9999",
        "http://127.0.0.1:9999",
        "http://localhost",
        "http://127.0.0.1",
    ]
    SQLALCHEMY_DATABASE_URL: str = os.getenv("SQLALCHEMY_DATABASE_URL", "sqlite:///./api.db")  #"postgresql://user:password@postgresserver/db"
    SECRET_KEY = os.getenv("SECRET_KEY", "cf568d8fee94fdc3d3ec1482db922643cf708158cc2347988a564223d3db5f3b")
    ALGORITHM = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 120)) # 1 for testing


settings = Settings()