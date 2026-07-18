"""Tests für DevAuth über die ``get_current_user``-Dependency."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import create_app


def test_me_returns_dev_user_default(client: TestClient) -> None:
    resp = client.get("/api/v1/me")
    assert resp.status_code == 200
    assert resp.json() == {"username": "dev", "role": "admin"}


def test_dev_role_switchable_via_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("STW_DEV_ROLE", "auditor")
    with TestClient(create_app()) as client:
        resp = client.get("/api/v1/me")
    assert resp.status_code == 200
    assert resp.json() == {"username": "dev", "role": "auditor"}
