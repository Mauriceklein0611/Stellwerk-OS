"""Gemeinsame Test-Fixtures für den Kern."""

from __future__ import annotations

from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from app.db.session import reset_engine
from app.main import create_app
from app.settings import get_settings


@pytest.fixture(autouse=True)
def _reset_state() -> Iterator[None]:
    """Settings-Cache und DB-Engine je Test zurücksetzen (Env-Overrides greifen)."""
    get_settings.cache_clear()
    reset_engine()
    yield
    get_settings.cache_clear()
    reset_engine()


@pytest.fixture
def client() -> Iterator[TestClient]:
    with TestClient(create_app()) as test_client:
        yield test_client
