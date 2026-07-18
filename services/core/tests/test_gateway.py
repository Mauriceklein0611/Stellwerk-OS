"""Tests für den Model Gateway (ADR-006).

Alle Tests laufen gegen den Stub-Provider (deterministisch, kein Netzwerk).
Fehlerpfade werden über einen injizierten Stub simuliert – kein Test spricht
Ollama direkt an.
"""

from __future__ import annotations

from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from app.api.gateway import get_gateway_provider
from app.db.session import get_session
from app.gateway.base import ChatMessage, ChatResult
from app.gateway.errors import ProviderError, ProviderTimeoutError
from app.gateway.ollama import OllamaProvider
from app.gateway.registry import GatewayConfigError, build_provider
from app.gateway.stub import StubProvider
from app.main import create_app
from app.settings import Settings
from tests._dbstub import override_get_session

CHAT_URL = "/api/v1/gateway/chat"


def _body(model: str = "stub-echo") -> dict[str, object]:
    return {"model": model, "messages": [{"role": "user", "content": "Hallo Welt"}]}


def _client_with_provider(provider: StubProvider) -> Iterator[TestClient]:
    app = create_app()
    app.dependency_overrides[get_gateway_provider] = lambda: provider
    app.dependency_overrides[get_session] = override_get_session
    with TestClient(app) as client:
        yield client


def test_stub_chat_is_deterministic_with_usage(client: TestClient) -> None:
    r1 = client.post(CHAT_URL, json=_body())
    r2 = client.post(CHAT_URL, json=_body())
    assert r1.status_code == 200
    assert r1.json() == r2.json()  # deterministisch
    data = r1.json()
    assert data["content"] == "stub-echo: Hallo Welt"
    assert data["provider"] == "stub"
    assert data["model"] == "stub-echo"
    assert data["usage"] == {"prompt_tokens": 2, "completion_tokens": 3}


def test_unknown_model_returns_400(client: TestClient) -> None:
    r = client.post(CHAT_URL, json=_body(model="gpt-nicht-erlaubt"))
    assert r.status_code == 400
    assert r.json()["error"] == "unknown_model"


def test_provider_error_maps_to_502() -> None:
    provider = StubProvider(error=ProviderError("boom"))
    client = next(_client_with_provider(provider))
    r = client.post(CHAT_URL, json=_body())
    assert r.status_code == 502
    assert r.json()["error"] == "provider_error"


def test_provider_timeout_maps_to_504() -> None:
    provider = StubProvider(error=ProviderTimeoutError("zu langsam"))
    client = next(_client_with_provider(provider))
    r = client.post(CHAT_URL, json=_body())
    assert r.status_code == 504
    assert r.json()["error"] == "provider_timeout"


def test_scripted_stub_returns_sequence() -> None:
    provider = StubProvider(script=["erste", "zweite"])
    client = next(_client_with_provider(provider))
    a = client.post(CHAT_URL, json=_body()).json()["content"]
    b = client.post(CHAT_URL, json=_body()).json()["content"]
    assert (a, b) == ("erste", "zweite")


def test_empty_messages_is_422(client: TestClient) -> None:
    r = client.post(CHAT_URL, json={"model": "stub-echo", "messages": []})
    assert r.status_code == 422  # Pydantic-Validierung (min_length=1)


def test_provider_switch_via_env_only() -> None:
    """Provider-Wechsel allein über Settings – ohne Codeänderung."""
    stub = build_provider(Settings(gateway_provider="stub"))
    ollama = build_provider(Settings(gateway_provider="ollama"))
    assert stub.__class__.__name__ == "StubProvider"
    assert ollama.__class__.__name__ == "OllamaProvider"
    with pytest.raises(GatewayConfigError):
        build_provider(Settings(gateway_provider="unbekannt"))


def test_ollama_connection_failure_maps_to_provider_error() -> None:
    """Ollama-Fehlerpfad ohne Server: verweigerte Verbindung → ProviderError."""
    provider = OllamaProvider(base_url="http://127.0.0.1:1", timeout_s=1, retries=0, backoff_s=0)
    with pytest.raises(ProviderError):
        provider.chat([ChatMessage(role="user", content="x")], "llama3.2")


def test_stub_result_shape_matches_contract() -> None:
    result = StubProvider().chat(
        messages=[ChatMessage(role="user", content="ping")],
        model="stub-echo",
    )
    assert isinstance(result, ChatResult)
    assert result.usage.total_tokens == (
        result.usage.prompt_tokens + result.usage.completion_tokens
    )
