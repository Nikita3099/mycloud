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
    """
    Возвращает настройки базы данных.
    По умолчанию используется PostgreSQL с параметрами, соответствующими вашему рабочему окружению.
    Для SQLite установите DB_ENGINE=django.db.backends.sqlite3
    """
    engine = os.environ.get("DB_ENGINE", "django.db.backends.postgresql")
    if engine == "django.db.backends.sqlite3":
        return {
            "ENGINE": engine,
            "NAME": os.environ.get("DB_NAME", str(BASE_DIR / "db.sqlite3")),
        }
    else:
        # PostgreSQL (или другая БД, поддерживающая стандартные параметры)
        return {
            "ENGINE": engine,
            "NAME": os.environ.get("DB_NAME", "mycloud_nick"),
            "USER": os.environ.get("DB_USER", "mycloud_nick"),
            "PASSWORD": os.environ.get("DB_PASSWORD", ""),
            "HOST": os.environ.get("DB_HOST", "127.0.0.1"),
            "PORT": os.environ.get("DB_PORT", "5432"),
        }

def get_media_root():
    return Path(os.environ.get("CLOUD_STORAGE_ROOT", str(BASE_DIR / "media")))

def get_csrf_trusted_origins():
    return [
        o.strip() for o in os.environ.get("CSRF_TRUSTED_ORIGINS", "").split(",") if o.strip()
    ]