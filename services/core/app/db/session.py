"""Engine- und Session-Verwaltung (lazy, damit Import ohne DB möglich bleibt)."""

from __future__ import annotations

from collections.abc import Iterator

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session

from app.settings import get_settings

_engine: Engine | None = None


def get_engine() -> Engine:
    """Liefert die (gecachte) Engine; ``pool_pre_ping`` fängt tote Verbindungen ab."""
    global _engine
    if _engine is None:
        _engine = create_engine(get_settings().database_url, pool_pre_ping=True)
    return _engine


def reset_engine() -> None:
    """Engine verwerfen (Tests, die die DB-URL wechseln)."""
    global _engine
    if _engine is not None:
        _engine.dispose()
    _engine = None


def get_session() -> Iterator[Session]:
    """FastAPI-Dependency: liefert eine Session pro Request und schließt sie."""
    with Session(get_engine()) as session:
        yield session
