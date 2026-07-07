"""Unit-Tests für Liveness/Readiness und OpenAPI (ohne echte DB)."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import create_app


def test_healthz_ok(client: TestClient) -> None:
    resp = client.get("/healthz")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_docs_reachable(client: TestClient) -> None:
    assert client.get("/docs").status_code == 200
    assert client.get("/openapi.json").status_code == 200


def test_readyz_503_when_db_unreachable(monkeypatch: pytest.MonkeyPatch) -> None:
    # Nicht erreichbare DB (Port 1) -> readyz muss 503 liefern.
    monkeypatch.setenv(
        "STW_DATABASE_URL", "postgresql+psycopg://x:x@127.0.0.1:1/none"
    )
    with TestClient(create_app()) as client:
        resp = client.get("/readyz")
    assert resp.status_code == 503
    assert resp.json() == {"status": "unavailable"}
