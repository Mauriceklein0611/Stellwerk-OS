"""DB-Tests gegen echtes Postgres.

Laufen nur, wenn ``STW_TEST_DATABASE_URL`` gesetzt ist (lokal: docker-Postgres,
CI: Service-Container). So bleibt die schnelle Unit-Suite Docker-frei
(CORE-ADR-001).
"""

from __future__ import annotations

import os

import pytest
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, inspect, text

from alembic import command
from app.main import create_app

TEST_DB = os.getenv("STW_TEST_DATABASE_URL")
pytestmark = pytest.mark.skipif(
    not TEST_DB, reason="STW_TEST_DATABASE_URL nicht gesetzt (DB-Test übersprungen)"
)


def _alembic_config() -> Config:
    cfg = Config("alembic.ini")
    cfg.set_main_option("sqlalchemy.url", TEST_DB or "")
    return cfg


@pytest.fixture
def migrated_db() -> object:
    """Frisches Schema: upgrade head vor, downgrade base nach dem Test."""
    cfg = _alembic_config()
    command.downgrade(cfg, "base")  # sauberer Ausgangszustand
    command.upgrade(cfg, "head")
    yield
    command.downgrade(cfg, "base")


def test_migration_creates_and_drops_schema() -> None:
    cfg = _alembic_config()
    command.upgrade(cfg, "head")
    engine = create_engine(TEST_DB or "")
    assert "platform_info" in inspect(engine).get_table_names()
    command.downgrade(cfg, "base")
    assert "platform_info" not in inspect(engine).get_table_names()
    engine.dispose()


def test_readyz_ok_with_db(
    monkeypatch: pytest.MonkeyPatch, migrated_db: object
) -> None:
    monkeypatch.setenv("STW_DATABASE_URL", TEST_DB or "")
    with TestClient(create_app()) as client:
        resp = client.get("/readyz")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ready"}


def test_seed_is_idempotent(
    monkeypatch: pytest.MonkeyPatch, migrated_db: object
) -> None:
    monkeypatch.setenv("STW_DATABASE_URL", TEST_DB or "")
    from app.db.session import reset_engine
    from scripts.seed import seed

    reset_engine()
    first = seed()
    second = seed()
    assert first > 0  # erster Lauf füllt
    assert second == 0  # zweiter Lauf ändert nichts

    engine = create_engine(TEST_DB or "")
    with engine.connect() as conn:
        count = conn.execute(text("SELECT count(*) FROM platform_info")).scalar_one()
    engine.dispose()
    assert count == first
    reset_engine()
