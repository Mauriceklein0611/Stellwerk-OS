"""Model-Gateway-Endpunkt: ``POST /api/v1/gateway/chat`` (ADR-006).

Der eine Weg für LLM-Aufrufe. Authentifiziert via DevAuth-Dependency. Die
Modell-Allowlist wird hier geprüft (400), Provider-Fehler übersetzt der zentrale
Exception-Handler (502/504). Jeder Provider-Aufruf wird telemetriert (#7) – das
Erfassen kann den Request nie scheitern lassen.
"""

from __future__ import annotations

import time
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from starlette.requests import Request

from app.auth.dependencies import CurrentUser
from app.db.session import get_session
from app.gateway.base import ChatRequest, ChatResult, Provider
from app.gateway.errors import GatewayError, UnknownModelError
from app.gateway.registry import build_provider
from app.settings import Settings, get_settings
from app.telemetry.recorder import record_call

router = APIRouter(prefix="/gateway", tags=["gateway"])


def get_gateway_provider(
    settings: Annotated[Settings, Depends(get_settings)],
) -> Provider:
    """Aktiver Provider aus den Settings (in Tests via Override injizierbar)."""
    return build_provider(settings)


@router.post("/chat", response_model=ChatResult)
def chat(
    request: Request,
    body: ChatRequest,
    user: CurrentUser,
    provider: Annotated[Provider, Depends(get_gateway_provider)],
    settings: Annotated[Settings, Depends(get_settings)],
    session: Annotated[Session, Depends(get_session)],
) -> ChatResult:
    """Führt einen Chat-Aufruf über den konfigurierten Provider aus."""
    if body.model not in settings.allowed_models:
        raise UnknownModelError(f"Modell nicht erlaubt: {body.model!r}")

    request_id = getattr(request.state, "request_id", None)
    start = time.monotonic()
    try:
        result = provider.chat(body.messages, body.model, body.params)
    except GatewayError as exc:
        record_call(
            session,
            user=user.username,
            provider=settings.gateway_provider,
            model=body.model,
            prompt_tokens=0,
            completion_tokens=0,
            latency_ms=int((time.monotonic() - start) * 1000),
            status=exc.error_code,
            request_id=request_id,
        )
        raise

    record_call(
        session,
        user=user.username,
        provider=result.provider,
        model=result.model,
        prompt_tokens=result.usage.prompt_tokens,
        completion_tokens=result.usage.completion_tokens,
        latency_ms=result.latency_ms,
        status="ok",
        request_id=request_id,
    )
    return result
