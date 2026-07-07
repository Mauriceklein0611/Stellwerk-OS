"""Provider-Registry: wählt den aktiven Provider allein aus den Settings.

Provider-Wechsel erfolgt per Env (``STW_GATEWAY_PROVIDER``) ohne Codeänderung.
"""

from __future__ import annotations

from app.gateway.base import Provider
from app.gateway.errors import GatewayError
from app.gateway.ollama import OllamaProvider
from app.gateway.stub import StubProvider
from app.settings import Settings


class GatewayConfigError(GatewayError):
    """Unbekannter Provider-Name in der Konfiguration → 500 (Fehlkonfiguration)."""

    status_code = 500
    error_code = "gateway_misconfigured"


def build_provider(settings: Settings) -> Provider:
    """Erzeugt den in den Settings konfigurierten Provider."""
    name = settings.gateway_provider.lower()
    if name == "stub":
        return StubProvider()
    if name == "ollama":
        return OllamaProvider(
            base_url=settings.ollama_url,
            timeout_s=settings.gateway_timeout_s,
            retries=settings.gateway_retries,
            backoff_s=settings.gateway_backoff_s,
        )
    raise GatewayConfigError(f"Unbekannter Gateway-Provider: {settings.gateway_provider!r}")
