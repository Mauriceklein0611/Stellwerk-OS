"""Telemetrie-Unit-Tests ohne DB: Pricing-Perioden, /metrics, Resilienz.

Diese Tests laufen immer (Docker-frei). Der DB-Schreibpfad und Summary werden
in ``test_telemetry_db.py`` env-gegated geprüft.
"""

from __future__ import annotations

from datetime import UTC, datetime

import pytest
from fastapi.testclient import TestClient

from app.telemetry import recorder
from app.telemetry.metrics import CALLS_TOTAL
from app.telemetry.pricing import estimate_cost, price_period

CHAT_URL = "/api/v1/gateway/chat"


def _body(model: str = "stub-echo") -> dict[str, object]:
    return {"model": model, "messages": [{"role": "user", "content": "Hallo Welt"}]}


def test_price_period_selects_by_timestamp() -> None:
    """Zwei Perioden für gpt-4o: Preis richtet sich nach dem ts."""
    old = price_period("gpt-4o", datetime(2024, 6, 1, tzinfo=UTC))
    new = price_period("gpt-4o", datetime(2025, 6, 1, tzinfo=UTC))
    assert old is not None and new is not None
    assert old["prompt"] == 0.005
    assert new["prompt"] == 0.0025  # Preissenkung ab 2025


def test_estimate_cost_uses_period_price() -> None:
    # 1000 prompt + 1000 completion @ 2025er gpt-4o: 0.0025 + 0.010 = 0.0125
    cost = estimate_cost("gpt-4o", 1000, 1000, datetime(2025, 6, 1, tzinfo=UTC))
    assert cost == pytest.approx(0.0125)


def test_estimate_cost_unknown_model_is_zero() -> None:
    assert estimate_cost("unbekannt", 1000, 1000, datetime(2025, 6, 1, tzinfo=UTC)) == 0.0


def test_metrics_endpoint_exposes_counters(client: TestClient) -> None:
    client.post(CHAT_URL, json=_body())  # ein Aufruf, damit Serien existieren
    resp = client.get("/metrics")
    assert resp.status_code == 200
    assert "stw_gateway_calls_total" in resp.text
    assert "stw_gateway_tokens_total" in resp.text


def test_chat_increments_call_counter(client: TestClient) -> None:
    before = CALLS_TOTAL.labels("stub", "stub-echo", "ok")._value.get()
    client.post(CHAT_URL, json=_body())
    after = CALLS_TOTAL.labels("stub", "stub-echo", "ok")._value.get()
    assert after == before + 1


def test_telemetry_failure_does_not_break_chat(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Simulierter Telemetrie-Ausfall (DB-Persist wirft) → Chat bleibt 200."""

    def _boom(*_args: object, **_kwargs: object) -> None:
        raise RuntimeError("telemetry down")

    monkeypatch.setattr(recorder, "_persist", _boom)
    resp = client.post(CHAT_URL, json=_body())
    assert resp.status_code == 200
    assert resp.json()["content"] == "stub-echo: Hallo Welt"
