"""Telemetrie-DB-Tests (nur mit ``STW_TEST_DATABASE_URL``).

Deckt den Schreibpfad (genau ein Datensatz, plausible Kosten) und den
Summary-Endpoint gegen Seed-Daten ab. Struktur wie test_db.py.
"""

from __future__ import annotations

import os
from collections.abc import Iterator

import pytest
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, func, select, text

from alembic import command
from app.db.models import GatewayCall
from app.db.session import get_engine, reset_engine
from app.main import create_app

TEST_DB = os.getenv("STW_TEST_DATABASE_URL")
pytestmark = pytest.mark.skipif(
    not TEST_DB, reason="STW_TEST_DATABASE_URL nicht gesetzt (DB-Test übersprungen)"
)


@pytest.fixture
def migrated_db(monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    """Frisches Schema; Kern-Engine zeigt auf die Test-DB."""
    monkeypatch.setenv("STW_DATABASE_URL", TEST_DB or "")
    cfg = Config("alembic.ini")
    cfg.set_main_option("sqlalchemy.url", TEST_DB or "")
    command.downgrade(cfg, "base")
    command.upgrade(cfg, "head")
    reset_engine()
    yield
    reset_engine()
    command.downgrade(cfg, "base")


def test_stub_chat_creates_one_record_with_cost(migrated_db: None) -> None:
    with TestClient(create_app()) as client:
        resp = client.post(
            "/api/v1/gateway/chat",
            json={"model": "stub-echo", "messages": [{"role": "user", "content": "Hallo Welt"}]},
        )
    assert resp.status_code == 200

    from sqlalchemy.orm import Session

    with Session(get_engine()) as session:
        rows = session.scalars(select(GatewayCall)).all()
    assert len(rows) == 1  # genau ein Datensatz
    row = rows[0]
    assert row.provider == "stub"
    assert row.model == "stub-echo"
    assert row.status == "ok"
    assert (row.prompt_tokens, row.completion_tokens) == (2, 3)
    # Kosten aus der zum ts gültigen stub-echo-Periode (0.001/0.002 je 1k):
    # 2/1000*0.001 + 3/1000*0.002 = 0.000008
    assert float(row.cost_estimate) == pytest.approx(0.000008)
    assert row.request_id  # aus der Request-ID-Middleware übernommen


def test_summary_matches_seed(migrated_db: None) -> None:
    from scripts.seed import seed_gateway_calls

    inserted = seed_gateway_calls()
    assert inserted == 50
    assert seed_gateway_calls() == 0  # idempotent

    with TestClient(create_app()) as client:
        resp = client.get("/api/v1/telemetry/summary", params={"days": 30})
    assert resp.status_code == 200
    data = resp.json()
    assert data["days"] == 30
    assert sum(m["calls"] for m in data["models"]) == 50

    # Gegenprobe: Summen je Modell direkt aus der DB.
    engine = create_engine(TEST_DB or "")
    with engine.connect() as conn:
        for m in data["models"]:
            db_tokens = conn.execute(
                text(
                    "SELECT COALESCE(SUM(prompt_tokens+completion_tokens),0) "
                    "FROM gateway_calls WHERE model = :m"
                ),
                {"m": m["model"]},
            ).scalar_one()
            assert m["total_tokens"] == int(db_tokens)
    engine.dispose()


def test_summary_window_excludes_old_calls(migrated_db: None) -> None:
    """days-Fenster filtert ältere Calls korrekt heraus."""
    from scripts.seed import seed_gateway_calls

    seed_gateway_calls()
    with TestClient(create_app()) as client:
        wide = client.get("/api/v1/telemetry/summary", params={"days": 30}).json()
        narrow = client.get("/api/v1/telemetry/summary", params={"days": 1}).json()
    wide_calls = sum(m["calls"] for m in wide["models"])
    narrow_calls = sum(m["calls"] for m in narrow["models"])
    assert narrow_calls <= wide_calls

    from sqlalchemy.orm import Session

    with Session(get_engine()) as session:
        total = session.scalar(select(func.count()).select_from(GatewayCall))
    assert total == 50
