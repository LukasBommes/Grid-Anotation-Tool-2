import os
from typing import List

from pydantic import BaseSettings


class Settings(BaseSettings):
    API_URL: str = os.getenv("API_URL", "http://localhost:8000/api")
    DOCS_URL_PREFIX: str = os.getenv("DOCS_URL_PREFIX", "")


settings = Settings()