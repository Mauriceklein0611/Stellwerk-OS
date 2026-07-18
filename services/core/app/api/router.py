"""Versionierter API-Router (``/api/v1``)."""

from __future__ import annotations

from fastapi import APIRouter

from app.auth.base import User
from app.auth.dependencies import CurrentUser

api_v1 = APIRouter(prefix="/api/v1")


@api_v1.get("/me")
def me(user: CurrentUser) -> User:
    """Gibt den aktuell authentifizierten Nutzer zurück (DevAuth in v0.1)."""
    return user
