"""Tests für die Request-ID-Middleware."""

from __future__ import annotations

from fastapi.testclient import TestClient

from app.middleware import REQUEST_ID_HEADER


def test_request_id_is_generated(client: TestClient) -> None:
    resp = client.get("/healthz")
    assert resp.headers.get(REQUEST_ID_HEADER)


def test_request_id_is_passed_through(client: TestClient) -> None:
    resp = client.get("/healthz", headers={REQUEST_ID_HEADER: "abc-123"})
    assert resp.headers[REQUEST_ID_HEADER] == "abc-123"
