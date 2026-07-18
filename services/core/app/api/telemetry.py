"""Telemetrie-Aggregation: ``GET /api/v1/telemetry/summary?days=7``."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.auth.dependencies import CurrentUser
from app.db.models import GatewayCall
from app.db.session import get_session

router = APIRouter(prefix="/telemetry", tags=["telemetry"])


class ModelSummary(BaseModel):
    """Aggregierte Kennzahlen eines Modells im Zeitfenster."""

    model: str
    calls: int
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    cost_estimate: float


class SummaryResponse(BaseModel):
    """Antwort des Summary-Endpunkts."""

    days: int
    since: datetime
    models: list[ModelSummary]


@router.get("/summary", response_model=SummaryResponse)
def summary(
    user: CurrentUser,  # noqa: ARG001 - erzwingt Authentifizierung
    session: Annotated[Session, Depends(get_session)],
    days: Annotated[int, Query(ge=1, le=365)] = 7,
) -> SummaryResponse:
    """Summen je Modell über die letzten ``days`` Tage."""
    since = datetime.now(UTC) - timedelta(days=days)
    stmt = (
        select(
            GatewayCall.model,
            func.count().label("calls"),
            func.coalesce(func.sum(GatewayCall.prompt_tokens), 0).label("prompt_tokens"),
            func.coalesce(func.sum(GatewayCall.completion_tokens), 0).label(
                "completion_tokens"
            ),
            func.coalesce(func.sum(GatewayCall.cost_estimate), 0).label("cost_estimate"),
        )
        .where(GatewayCall.ts >= since)
        .group_by(GatewayCall.model)
        .order_by(GatewayCall.model)
    )
    rows = session.execute(stmt).all()
    models = [
        ModelSummary(
            model=r.model,
            calls=r.calls,
            prompt_tokens=int(r.prompt_tokens),
            completion_tokens=int(r.completion_tokens),
            total_tokens=int(r.prompt_tokens) + int(r.completion_tokens),
            cost_estimate=round(float(r.cost_estimate), 6),
        )
        for r in rows
    ]
    return SummaryResponse(days=days, since=since, models=models)
