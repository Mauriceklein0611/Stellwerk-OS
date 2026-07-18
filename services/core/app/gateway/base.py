"""Gateway-Vertrag: Nachrichten-/Ergebnis-Modelle und das ``Provider``-Protocol.

Alle LLM-Aufrufe der Plattform laufen über einen austauschbaren Provider
(ADR-006). Die Antwort trägt bereits ``usage`` – die Naht, an die #7 die
Telemetrie (tokens/costs/latency) hängt.
"""

from __future__ import annotations

from typing import Any, Literal, Protocol

from pydantic import BaseModel, Field

Role = Literal["system", "user", "assistant"]


class ChatMessage(BaseModel):
    """Eine Chat-Nachricht (Rolle + Textinhalt)."""

    role: Role
    content: str


class Usage(BaseModel):
    """Token-Verbrauch eines Aufrufs (Grundlage der Kostentelemetrie, #7)."""

    prompt_tokens: int
    completion_tokens: int

    @property
    def total_tokens(self) -> int:
        return self.prompt_tokens + self.completion_tokens


class ChatResult(BaseModel):
    """Normalisiertes Ergebnis eines Chat-Aufrufs – providerunabhängig."""

    content: str
    usage: Usage
    latency_ms: int
    provider: str
    model: str


class Provider(Protocol):
    """Strukturelles Interface für Model-Provider (Ollama, Stub, später Azure)."""

    def chat(
        self,
        messages: list[ChatMessage],
        model: str,
        params: dict[str, Any] | None = None,
    ) -> ChatResult:
        """Führt einen (nicht-streamenden) Chat-Aufruf aus und liefert ``ChatResult``."""
        ...


class ChatRequest(BaseModel):
    """Eingabe des ``/gateway/chat``-Endpunkts."""

    model: str
    messages: list[ChatMessage] = Field(min_length=1)
    params: dict[str, Any] = Field(default_factory=dict)
