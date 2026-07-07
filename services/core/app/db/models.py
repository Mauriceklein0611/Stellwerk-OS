"""ORM-Modelle des Kerns. Bewusst minimal – Telemetrie-Schema folgt in #7."""

from __future__ import annotations

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class PlatformInfo(Base):
    """Schlüssel/Wert-Smoke-Objekt zum Verifizieren von Migration + Persistenz."""

    __tablename__ = "platform_info"

    id: Mapped[int] = mapped_column(primary_key=True)
    key: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    value: Mapped[str] = mapped_column(String(500))
