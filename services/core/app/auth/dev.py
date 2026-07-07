"""DevAuth (ADR-007): statischer Nutzer ``dev`` mit konfigurierbarer Rolle."""

from __future__ import annotations

from starlette.requests import Request

from app.auth.base import User


class DevAuth:
    """Nicht-produktiver Provider für v0.1.

    Liefert immer den Nutzer ``dev``; die Rolle kommt aus den Settings
    (``STW_DEV_ROLE``, Default ``admin``) und ist so per Env umschaltbar.
    Erfüllt strukturell das ``AuthProvider``-Protocol.
    """

    def __init__(self, role: str = "admin") -> None:
        self._role = role

    def authenticate(self, request: Request) -> User:  # noqa: ARG002 - Naht für echte Provider
        return User(username="dev", role=self._role)
