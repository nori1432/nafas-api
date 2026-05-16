"""Application configuration."""
import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))


class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv("NAFAS_DB_URI")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    # NOTE: Aiven MySQL with SSL DISABLED per project spec.
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_recycle": 280,
        "pool_pre_ping": True,
        "connect_args": {},
    }

    JWT_SECRET_KEY = os.getenv("NAFAS_JWT_SECRET", "dev-secret-change-me")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=7)
    JWT_TOKEN_LOCATION = ["headers"]

    UPLOAD_FOLDER = os.getenv("NAFAS_UPLOAD_FOLDER", "/tmp/uploads")
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB
    ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "pdf", "webp"}

    CORS_ORIGINS = [
        o.strip() for o in os.getenv("CORS_ORIGINS", "*").split(",") if o.strip()
    ]
