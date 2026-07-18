"""FastAPI-Dependencies für Auth: Provider-Auswahl und ``get_current_user``."""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends
from starlette.requests import Request

from app.auth.base import AuthProvider, User
from app.auth.dev import DevAuth
from app.settings import Settings, get_settings


def get_auth_provider(
    settings: Annotated[Settings, Depends(get_settings)],
) -> AuthProvider:
    """Liefert den aktiven Auth-Provider. v0.1: DevAuth mit Rolle aus Settings."""
    return DevAuth(role=settings.dev_role)


def get_current_user(
    request: Request,
    provider: Annotated[AuthProvider, Depends(get_auth_provider)],
) -> User:
    """FastAPI-Dependency: aktueller Nutzer über den konfigurierten Provider."""
    return provider.authenticate(request)


CurrentUser = Annotated[User, Depends(get_current_user)]
