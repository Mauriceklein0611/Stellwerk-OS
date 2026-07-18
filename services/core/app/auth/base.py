"""Auth-Vertrag: ``User`` und das ``AuthProvider``-Protocol.

Module authentifizieren nie selbst – der Kern liefert Nutzer/Rolle über einen
austauschbaren Provider (v0.1: DevAuth; v0.3: Keycloak).
"""

from __future__ import annotations

from typing import Protocol

from pydantic import BaseModel
from starlette.requests import Request


class User(BaseModel):
    """Der authentifizierte Nutzer mit einer Rolle (Admin/User/Auditor)."""

    username: str
    role: str


class AuthProvider(Protocol):
    """Strukturelles Interface für Authentifizierungs-Backends."""

    def authenticate(self, request: Request) -> User:
        """Ermittelt den aktuellen Nutzer aus dem Request (oder wirft 401)."""
        ...
