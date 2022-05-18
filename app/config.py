from typing import List

from pydantic import BaseSettings


class Settings(BaseSettings):
    MEDIA_ROOT: str = "images"
    API_URL: str = "http://localhost:8000/api"
    CORS_ORIGINS: List[str] = [
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]
    SQLALCHEMY_DATABASE_URI: str = "sqlite:///./api.db"


settings = Settings()