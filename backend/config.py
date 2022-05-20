from typing import List

from pydantic import BaseSettings


class Settings(BaseSettings):
    MEDIA_ROOT: str = "images"
    CORS_ORIGINS: List[str] = [
        "http://localhost:9999",
        "http://127.0.0.1:9999",
    ]
    SQLALCHEMY_DATABASE_URL: str = "sqlite:///./api.db"  #"postgresql://user:password@postgresserver/db"
    SECRET_KEY = "cf568d8fee94fdc3d3ec1482db922643cf708158cc2347988a564223d3db5f3b"
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 1 #30


settings = Settings()