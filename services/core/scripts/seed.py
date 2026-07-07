"""Idempotentes Seed-Skript: füllt platform_info + Telemetrie-Demo-Daten.

Aufruf (aus services/core): ``uv run python scripts/seed.py``.
Zweiter Lauf ändert nichts (platform_info: nur fehlende Schlüssel; gateway_calls:
nur, wenn die Tabelle leer ist).
"""

from __future__ import annotations

import random
import sys
import uuid
from datetime import UTC, datetime, timedelta
from pathlib import Path

# services/core auf den Pfad legen, damit ``app`` importierbar ist,
# wenn das Skript direkt (nicht als Modul) gestartet wird.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import func, select  # noqa: E402
from sqlalchemy.orm import Session  # noqa: E402

from app.db.models import GatewayCall, PlatformInfo  # noqa: E402
from app.db.session import get_engine  # noqa: E402
from app.telemetry.pricing import estimate_cost  # noqa: E402

# Deterministische Demo-Daten (reproduzierbar für Grafana in #12).
_DEMO_CALLS = 50
_DEMO_DAYS = 14
_DEMO_MODELS = ["gpt-4o", "gpt-4o-mini", "llama3.2", "stub-echo"]
_DEMO_USERS = ["dev", "alice", "bob"]


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


def seed_gateway_calls() -> int:
    """Füllt ~50 realistische Demo-Calls über 14 Tage. Idempotent (nur wenn leer)."""
    with Session(get_engine()) as session:
        existing = session.scalar(select(func.count()).select_from(GatewayCall)) or 0
        if existing:
            return 0

        rng = random.Random(42)  # deterministisch
        now = datetime.now(UTC)
        rows: list[GatewayCall] = []
        for _ in range(_DEMO_CALLS):
            model = rng.choice(_DEMO_MODELS)
            prompt_tokens = rng.randint(50, 1500)
            completion_tokens = rng.randint(20, 800)
            # 1 von ~12 Calls ist ein Fehler (kein Verbrauch/keine Kosten).
            is_error = rng.random() < 0.08
            ts = now - timedelta(
                days=rng.randint(0, _DEMO_DAYS - 1),
                hours=rng.randint(0, 23),
                minutes=rng.randint(0, 59),
            )
            if is_error:
                prompt_tokens = completion_tokens = 0
            cost = estimate_cost(model, prompt_tokens, completion_tokens, ts)
            rows.append(
                GatewayCall(
                    ts=ts,
                    user=rng.choice(_DEMO_USERS),
                    provider="ollama" if model == "llama3.2" else "stub",
                    model=model,
                    prompt_tokens=prompt_tokens,
                    completion_tokens=completion_tokens,
                    latency_ms=rng.randint(40, 3200),
                    cost_estimate=cost,
                    status="provider_error" if is_error else "ok",
                    request_id=str(uuid.UUID(int=rng.getrandbits(128))),
                )
            )
        session.add_all(rows)
        session.commit()
        return len(rows)


if __name__ == "__main__":
    info = seed()
    calls = seed_gateway_calls()
    print(f"seed: platform_info {info} neu, gateway_calls {calls} neu.")
