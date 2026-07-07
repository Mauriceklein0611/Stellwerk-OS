"""Idempotentes Seed-Skript: füllt platform_info mit Demo-/Basisdaten.

Aufruf (aus services/core): ``uv run python scripts/seed.py``.
Zweiter Lauf ändert nichts (nur fehlende Schlüssel werden ergänzt).
Wird in #7 um Telemetrie-Demo-Daten erweitert.
"""

from __future__ import annotations

import sys
from datetime import UTC, datetime
from pathlib import Path

# services/core auf den Pfad legen, damit ``app`` importierbar ist,
# wenn das Skript direkt (nicht als Modul) gestartet wird.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select  # noqa: E402
from sqlalchemy.orm import Session  # noqa: E402

from app.db.models import PlatformInfo  # noqa: E402
from app.db.session import get_engine  # noqa: E402


def _defaults() -> dict[str, str]:
    return {
        "platform": "stellwerk",
        "version": "0.1.0",
        "installed_at": datetime.now(UTC).isoformat(),
    }


def seed() -> int:
    """Fügt fehlende Schlüssel ein. Gibt die Anzahl neu eingefügter Zeilen zurück."""
    inserted = 0
    with Session(get_engine()) as session:
        for key, value in _defaults().items():
            exists = session.scalar(select(PlatformInfo).where(PlatformInfo.key == key))
            if exists is None:
                session.add(PlatformInfo(key=key, value=value))
                inserted += 1
        session.commit()
    return inserted


if __name__ == "__main__":
    count = seed()
    print(f"seed: {count} neue Zeile(n) eingefügt.")
