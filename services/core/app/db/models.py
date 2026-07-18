"""ORM-Modelle des Kerns."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class PlatformInfo(Base):
    """Schlüssel/Wert-Smoke-Objekt zum Verifizieren von Migration + Persistenz."""

    __tablename__ = "platform_info"

    id: Mapped[int] = mapped_column(primary_key=True)
    key: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    value: Mapped[str] = mapped_column(String(500))


class GatewayCall(Base):
    """Ein auswertbarer Datensatz je Modellaufruf (Telemetrie/FinOps, Issue #7).

    Grundlage des Leitstand-Dashboards; hier zählt der Schreibpfad. ``cost_estimate``
    wird aus der zum ``ts`` gültigen Preisperiode berechnet (app/telemetry).
    """

    __tablename__ = "gateway_calls"

    id: Mapped[int] = mapped_column(primary_key=True)
    ts: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    # "user" ist in Postgres ein reserviertes Wort – SQLAlchemy/Alembic quoten es.
    user: Mapped[str] = mapped_column(String(100), index=True)
    provider: Mapped[str] = mapped_column(String(50), index=True)
    model: Mapped[str] = mapped_column(String(100), index=True)
    prompt_tokens: Mapped[int] = mapped_column()
    completion_tokens: Mapped[int] = mapped_column()
    latency_ms: Mapped[int] = mapped_column()
    cost_estimate: Mapped[float] = mapped_column(Numeric(12, 6))
    status: Mapped[str] = mapped_column(String(40))
    request_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
