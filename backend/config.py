import os
import json
from typing import List

from pydantic import BaseSettings


class Settings(BaseSettings):
    MEDIA_ROOT: str = os.getenv("BACKEND_MEDIA_ROOT", "images")
    CORS_ORIGINS: List[str] = json.loads(os.getenv("BACKEND_CORS_ORIGINS", '[]'))
    DATABASE_URL: str = os.getenv("BACKEND_DATABASE_URL", "sqlite:///./api.db")
    ACCESS_TOKEN_SECRET_KEY = os.getenv("BACKEND_ACCESS_TOKEN_SECRET_KEY", "cf568d8fee94fdc3d3ec1482db922643cf708158cc2347988a564223d3db5f3b")
    ACCESS_TOKEN_ALGORITHM = os.getenv("BACKEND_ACCESS_TOKEN_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("BACKEND_ACCESS_TOKEN_EXPIRE_MINUTES", 120)) # 1 for testing
    DOCS_URL_PREFIX: str = os.getenv("BACKEND_DOCS_URL_PREFIX", "")


settings = Settings()