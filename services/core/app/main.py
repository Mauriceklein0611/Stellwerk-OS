"""App-Factory des Kerns: baut die FastAPI-Instanz zusammen."""

from __future__ import annotations

from fastapi import FastAPI

from app.api.health import router as health_router
from app.api.router import api_v1
from app.logging import configure_logging
from app.middleware import RequestIdMiddleware
from app.settings import get_settings


def create_app() -> FastAPI:
    """Erzeugt und konfiguriert die FastAPI-App (Aufruf: ``--factory``)."""
    settings = get_settings()
    configure_logging(settings.log_level)

    app = FastAPI(title=settings.app_name, version="0.1.0")
    app.add_middleware(RequestIdMiddleware)
    app.include_router(health_router)
    app.include_router(api_v1)
    return app
