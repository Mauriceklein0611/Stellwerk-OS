"""Kostenschätzung aus einer versionierten Preistabelle (Preisperioden!).

Fortführung des Azure-Cost-Mapping-Musters: je Modell mehrere Perioden mit
``valid_from`` (inklusive) / ``valid_to`` (exklusiv, ``null`` = offen). Die zum
Zeitstempel des Calls gültige Periode bestimmt den Preis.
"""

from __future__ import annotations

import json
from datetime import date, datetime
from functools import lru_cache
from pathlib import Path
from typing import Any

_PRICES_PATH = Path(__file__).with_name("prices.json")


@lru_cache
def _table() -> dict[str, Any]:
    data: dict[str, Any] = json.loads(_PRICES_PATH.read_text(encoding="utf-8"))
    return data


def _as_date(value: str | None) -> date | None:
    return date.fromisoformat(value) if value else None


def price_period(model: str, ts: datetime) -> dict[str, Any] | None:
    """Liefert die zum ``ts`` gültige Preisperiode eines Modells (oder ``None``)."""
    on = ts.date()
    periods: list[dict[str, Any]] = _table()["models"].get(model, [])
    for period in periods:
        start = _as_date(period["valid_from"])
        end = _as_date(period["valid_to"])
        if start is not None and on >= start and (end is None or on < end):
            return period
    return None


def estimate_cost(
    model: str, prompt_tokens: int, completion_tokens: int, ts: datetime
) -> float:
    """Kosten = (Tokens/1000) × Periodenpreis; unbekannt/ohne Periode → 0.0."""
    period = price_period(model, ts)
    if period is None:
        return 0.0
    cost = (prompt_tokens / 1000) * float(period["prompt"]) + (
        completion_tokens / 1000
    ) * float(period["completion"])
    return round(cost, 6)
