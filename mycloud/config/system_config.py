import os
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent


def get_allowed_hosts():
    return [
        h.strip()
        for h in os.environ.get("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1,testserver").split(",")
        if h.strip()
    ]


def get_database_settings():

    return {
        "ENGINE": os.environ.get("DB_ENGINE", "django.db.backends.sqlite3"),
        "NAME": os.environ.get("DB_NAME", str(BASE_DIR / "db.sqlite3")),
        "HOST": os.environ.get("DB_HOST", "127.0.0.1"),
        "PORT": os.environ.get("DB_PORT", "5432"),
        "USER": os.environ.get("DB_USER", ""),
        "PASSWORD": os.environ.get("DB_PASSWORD", ""),
    }


def get_media_root():
    return Path(os.environ.get("CLOUD_STORAGE_ROOT", str(BASE_DIR / "media")))


def get_csrf_trusted_origins():
    return [
        o.strip() for o in os.environ.get("CSRF_TRUSTED_ORIGINS", "").split(",") if o.strip()
    ]

