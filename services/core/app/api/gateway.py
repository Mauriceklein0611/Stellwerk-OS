"""Model-Gateway-Endpunkt: ``POST /api/v1/gateway/chat`` (ADR-006).

Der eine Weg für LLM-Aufrufe. Authentifiziert via DevAuth-Dependency. Die
Modell-Allowlist wird hier geprüft (400), Provider-Fehler übersetzt der zentrale
Exception-Handler (502/504).
"""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends

from app.auth.dependencies import CurrentUser
from app.gateway.base import ChatRequest, ChatResult, Provider
from app.gateway.errors import UnknownModelError
from app.gateway.registry import build_provider
from app.settings import Settings, get_settings

router = APIRouter(prefix="/gateway", tags=["gateway"])


def get_gateway_provider(
    settings: Annotated[Settings, Depends(get_settings)],
) -> Provider:
    """Aktiver Provider aus den Settings (in Tests via Override injizierbar)."""
    return build_provider(settings)


@router.post("/chat", response_model=ChatResult)
def chat(
    body: ChatRequest,
    user: CurrentUser,  # noqa: ARG001 - erzwingt Authentifizierung
    provider: Annotated[Provider, Depends(get_gateway_provider)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> ChatResult:
    """Führt einen Chat-Aufruf über den konfigurierten Provider aus."""
    if body.model not in settings.allowed_models:
        raise UnknownModelError(f"Modell nicht erlaubt: {body.model!r}")
    return provider.chat(body.messages, body.model, body.params)
