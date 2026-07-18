"""Liveness/Readiness-Endpunkte (bewusst ohne ``/api/v1``-Präfix)."""

from __future__ import annotations

import structlog
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.db.session import get_engine

router = APIRouter(tags=["health"])
log = structlog.get_logger()


@router.get("/healthz")
def healthz() -> dict[str, str]:
    """Liveness: reine Prozess-Antwort, keine Abhängigkeiten."""
    return {"status": "ok"}


@router.get("/readyz")
def readyz() -> JSONResponse:
    """Readiness: 200 nur bei erreichbarer DB (``SELECT 1``), sonst 503."""
    try:
        with get_engine().connect() as conn:
            conn.execute(text("SELECT 1"))
    except SQLAlchemyError as exc:
        log.warning("readyz.db_unavailable", error=str(exc))
        return JSONResponse(status_code=503, content={"status": "unavailable"})
    return JSONResponse(status_code=200, content={"status": "ready"})
