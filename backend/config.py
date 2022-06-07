import os
import json
from typing import List

from pydantic import BaseSettings


class Settings(BaseSettings):
    MEDIA_ROOT: str = os.getenv("BACKEND_MEDIA_ROOT", "images")
    CORS_ORIGINS: List[str] = json.loads(os.getenv("BACKEND_CORS_ORIGINS", '[]'))
    DATABASE_URL: str = os.getenv("BACKEND_DATABASE_URL", "sqlite:///./api.db")
    ACCESS_TOKEN_SECRET_KEY = os.getenv("BACKEND_ACCESS_TOKEN_SECRET_KEY")
    ACCESS_TOKEN_ALGORITHM = os.getenv("BACKEND_ACCESS_TOKEN_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("BACKEND_ACCESS_TOKEN_EXPIRE_MINUTES", 120)) # 1 for testing


settings = Settings()