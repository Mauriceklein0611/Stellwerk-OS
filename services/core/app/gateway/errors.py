"""Fehlerklassen des Gateways mit HTTP-Statuszuordnung.

Ein einziger Exception-Handler (siehe app/main.py) übersetzt sie in die im
Issue geforderten Fehlerbilder: 400 (unbekanntes Modell), 502 (Provider-Fehler),
504 (Timeout).
"""

from __future__ import annotations


class GatewayError(Exception):
    """Basisklasse aller Gateway-Fehler; trägt den passenden HTTP-Status."""

    status_code: int = 500
    error_code: str = "gateway_error"


class UnknownModelError(GatewayError):
    """Angefragtes Modell steht nicht auf der Allowlist → 400."""

    status_code = 400
    error_code = "unknown_model"


class ProviderError(GatewayError):
    """Der Provider hat den Aufruf nicht beantwortet (z. B. 5xx/Netzfehler) → 502."""

    status_code = 502
    error_code = "provider_error"


class ProviderTimeoutError(ProviderError):
    """Der Provider hat innerhalb des Timeouts nicht geantwortet → 504."""

    status_code = 504
    error_code = "provider_timeout"
