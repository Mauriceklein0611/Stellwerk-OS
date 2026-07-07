"""Ollama-Provider: HTTP-Aufruf gegen ``/api/chat`` mit Timeout, Retry & Backoff.

Einziger Ort im Kern, der Ollama direkt spricht – kein Modul-/Testcode ruft
Ollama selbst auf (grep-Beweis im PR). v1 ohne Streaming (Nicht-Ziel).
"""

from __future__ import annotations

import time
from typing import Any

import httpx
import structlog

from app.gateway.base import ChatMessage, ChatResult, Usage
from app.gateway.errors import ProviderError, ProviderTimeoutError

log = structlog.get_logger()


class OllamaProvider:
    """Spricht die Ollama-Chat-API; normalisiert Antwort und Fehlerbilder."""

    def __init__(
        self,
        base_url: str,
        timeout_s: float = 30.0,
        retries: int = 2,
        backoff_s: float = 0.5,
    ) -> None:
        self._base_url = base_url.rstrip("/")
        self._timeout = timeout_s
        self._retries = retries
        self._backoff = backoff_s

    def chat(
        self,
        messages: list[ChatMessage],
        model: str,
        params: dict[str, Any] | None = None,
    ) -> ChatResult:
        payload = {
            "model": model,
            "messages": [{"role": m.role, "content": m.content} for m in messages],
            "stream": False,
            "options": params or {},
        }
        url = f"{self._base_url}/api/chat"
        start = time.monotonic()
        last_timeout = False
        last_exc: Exception | None = None

        # Erstversuch + ``retries`` Wiederholungen bei transienten Fehlern.
        for attempt in range(self._retries + 1):
            try:
                with httpx.Client(timeout=self._timeout) as client:
                    resp = client.post(url, json=payload)
                resp.raise_for_status()
                data = resp.json()
                latency_ms = int((time.monotonic() - start) * 1000)
                return ChatResult(
                    content=data["message"]["content"],
                    usage=Usage(
                        prompt_tokens=int(data.get("prompt_eval_count", 0)),
                        completion_tokens=int(data.get("eval_count", 0)),
                    ),
                    latency_ms=latency_ms,
                    provider="ollama",
                    model=model,
                )
            except httpx.TimeoutException as exc:
                last_timeout, last_exc = True, exc
            except httpx.HTTPStatusError as exc:
                # 4xx sind nicht wiederholbar; nur 5xx erneut versuchen.
                last_timeout, last_exc = False, exc
                if exc.response.status_code < 500:
                    break
            except httpx.HTTPError as exc:
                last_timeout, last_exc = False, exc

            if attempt < self._retries:
                time.sleep(self._backoff * (2**attempt))

        log.warning("gateway.ollama_failed", model=model, timeout=last_timeout)
        if last_timeout:
            raise ProviderTimeoutError(
                f"Ollama antwortete nicht innerhalb von {self._timeout}s"
            ) from last_exc
        raise ProviderError(f"Ollama-Aufruf fehlgeschlagen: {last_exc}") from last_exc
