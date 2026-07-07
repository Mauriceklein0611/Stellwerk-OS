"""Liveness/Readiness-Endpunkte (bewusst ohne ``/api/v1``-Präfix)."""

from __future__ import annotations

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/healthz")
def healthz() -> dict[str, str]:
    """Liveness: reine Prozess-Antwort, keine Abhängigkeiten."""
    return {"status": "ok"}


@router.get("/readyz")
def readyz() -> dict[str, str]:
    """Readiness-Platzhalter; ab #4 mit echtem DB-Ping."""
    return {"status": "ready"}
