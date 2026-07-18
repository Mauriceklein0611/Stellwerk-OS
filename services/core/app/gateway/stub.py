"""Deterministischer Stub-Provider (ADR-006): Grundlage aller Gateway-Tests.

Kein Netzwerk, keine Zeitabhängigkeit → reproduzierbare Antworten und usage.
Für Fehlerpfad-Tests injizierbar: ``script`` (feste Antwortfolge) und ``error``
(zu werfende Ausnahme).
"""

from __future__ import annotations

from collections.abc import Sequence
from typing import Any

from app.gateway.base import ChatMessage, ChatResult, Usage
from app.gateway.errors import GatewayError


def _count_tokens(text: str) -> int:
    """Simulierte Tokenzählung (wortbasiert) – deterministisch, kein Tokenizer."""
    return len(text.split())


class StubProvider:
    """Antwortet deterministisch; erfüllt strukturell das ``Provider``-Protocol."""

    def __init__(
        self,
        script: Sequence[str] | None = None,
        error: GatewayError | None = None,
        latency_ms: int = 1,
    ) -> None:
        self._script = list(script) if script is not None else None
        self._error = error
        self._latency_ms = latency_ms
        self._i = 0

    def chat(
        self,
        messages: list[ChatMessage],
        model: str,
        params: dict[str, Any] | None = None,
    ) -> ChatResult:
        if self._error is not None:
            raise self._error

        if self._script is not None:
            reply = self._script[self._i % len(self._script)]
            self._i += 1
        else:
            last_user = next(
                (m.content for m in reversed(messages) if m.role == "user"), ""
            )
            reply = f"stub-echo: {last_user}"

        usage = Usage(
            prompt_tokens=sum(_count_tokens(m.content) for m in messages),
            completion_tokens=_count_tokens(reply),
        )
        return ChatResult(
            content=reply,
            usage=usage,
            latency_ms=self._latency_ms,
            provider="stub",
            model=model,
        )
