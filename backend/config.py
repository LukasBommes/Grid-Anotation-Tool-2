from typing import List

from pydantic import BaseSettings


class Settings(BaseSettings):
    MEDIA_ROOT: str = "images"
    CORS_ORIGINS: List[str] = [
        "http://localhost:9999",
        "http://127.0.0.1:9999",
    ]
    SQLALCHEMY_DATABASE_URL: str = "sqlite:///./api.db"


settings = Settings()