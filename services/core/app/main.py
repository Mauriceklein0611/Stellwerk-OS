"""App-Factory des Kerns: baut die FastAPI-Instanz zusammen."""

from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.api.gateway import router as gateway_router
from app.api.health import router as health_router
from app.api.metrics import router as metrics_router
from app.api.router import api_v1
from app.api.telemetry import router as telemetry_router
from app.gateway.errors import GatewayError
from app.logging import configure_logging
from app.middleware import RequestIdMiddleware
from app.settings import get_settings


def _gateway_error_handler(_: Request, exc: Exception) -> JSONResponse:
    """Übersetzt Gateway-Fehler in ihr HTTP-Fehlerbild (400/502/504/500)."""
    assert isinstance(exc, GatewayError)  # nur für GatewayError registriert
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.error_code, "detail": str(exc)},
    )


def create_app() -> FastAPI:
    """Erzeugt und konfiguriert die FastAPI-App (Aufruf: ``--factory``)."""
    settings = get_settings()
    configure_logging(settings.log_level)

    app = FastAPI(title=settings.app_name, version="0.1.0")
    app.add_middleware(RequestIdMiddleware)
    app.add_exception_handler(GatewayError, _gateway_error_handler)
    app.include_router(health_router)
    app.include_router(metrics_router)
    app.include_router(api_v1)
    app.include_router(gateway_router, prefix="/api/v1")
    app.include_router(telemetry_router, prefix="/api/v1")
    return app
