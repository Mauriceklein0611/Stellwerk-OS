"""Schreibpfad der Telemetrie – darf einen Request NIE scheitern lassen.

Ein Fehler beim Erfassen (DB weg, Preis fehlt) führt zu einer Log-Warnung, der
Chat-Call läuft weiter. Metriken (in-memory) und DB-Persistenz sind getrennt
gekapselt, damit ein DB-Ausfall die Zähler nicht mitreißt.
"""

from __future__ import annotations

import contextlib
from datetime import UTC, datetime

import structlog
from sqlalchemy.orm import Session

from app.db.models import GatewayCall
from app.telemetry import metrics
from app.telemetry.pricing import estimate_cost

log = structlog.get_logger()


def _persist(
    session: Session,
    *,
    ts: datetime,
    user: str,
    provider: str,
    model: str,
    prompt_tokens: int,
    completion_tokens: int,
    latency_ms: int,
    cost_estimate: float,
    status: str,
    request_id: str | None,
) -> None:
    session.add(
        GatewayCall(
            ts=ts,
            user=user,
            provider=provider,
            model=model,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            latency_ms=latency_ms,
            cost_estimate=cost_estimate,
            status=status,
            request_id=request_id,
        )
    )
    session.commit()


def record_call(
    session: Session,
    *,
    user: str,
    provider: str,
    model: str,
    prompt_tokens: int,
    completion_tokens: int,
    latency_ms: int,
    status: str,
    request_id: str | None = None,
    ts: datetime | None = None,
) -> None:
    """Erfasst einen Gateway-Call in Metriken und DB. Wirft niemals."""
    ts = ts or datetime.now(UTC)
    cost = estimate_cost(model, prompt_tokens, completion_tokens, ts)

    # Metriken zuerst (in-memory): bleiben auch bei DB-Ausfall aktuell.
    try:
        metrics.observe(
            provider=provider,
            model=model,
            status=status,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            cost_estimate=cost,
            latency_ms=latency_ms,
        )
    except Exception as exc:  # pragma: no cover - Metriken sind robust
        log.warning("telemetry.metrics_failed", error=str(exc))

    try:
        _persist(
            session,
            ts=ts,
            user=user,
            provider=provider,
            model=model,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            latency_ms=latency_ms,
            cost_estimate=cost,
            status=status,
            request_id=request_id,
        )
    except Exception as exc:
        log.warning("telemetry.persist_failed", error=str(exc))
        with contextlib.suppress(Exception):  # Rollback best effort
            session.rollback()
