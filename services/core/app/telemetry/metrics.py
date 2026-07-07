"""Prometheus-Metriken des Gateways (modulweit einmalig registriert).

Zähler je ``provider``+``model``: Tokens, geschätzte Kosten, Aufrufe (nach
Status) und Fehler; Latenz als Histogramm. ``/metrics`` rendert die Registry.
"""

from __future__ import annotations

from prometheus_client import Counter, Histogram

TOKENS_TOTAL = Counter(
    "stw_gateway_tokens_total",
    "Über den Gateway verbrauchte Tokens.",
    ["provider", "model", "kind"],
)
COST_ESTIMATE_TOTAL = Counter(
    "stw_gateway_cost_estimate_total",
    "Geschätzte Kosten (Währung siehe prices.json) über den Gateway.",
    ["provider", "model"],
)
CALLS_TOTAL = Counter(
    "stw_gateway_calls_total",
    "Gateway-Aufrufe nach Status.",
    ["provider", "model", "status"],
)
ERRORS_TOTAL = Counter(
    "stw_gateway_errors_total",
    "Fehlgeschlagene Gateway-Aufrufe.",
    ["provider", "model"],
)
LATENCY_MS = Histogram(
    "stw_gateway_latency_ms",
    "Latenz der Gateway-Aufrufe in Millisekunden.",
    ["provider", "model"],
    buckets=(5, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000),
)


def observe(
    *,
    provider: str,
    model: str,
    status: str,
    prompt_tokens: int,
    completion_tokens: int,
    cost_estimate: float,
    latency_ms: int,
) -> None:
    """Aktualisiert alle Metriken für einen Aufruf (rein in-memory)."""
    CALLS_TOTAL.labels(provider, model, status).inc()
    TOKENS_TOTAL.labels(provider, model, "prompt").inc(prompt_tokens)
    TOKENS_TOTAL.labels(provider, model, "completion").inc(completion_tokens)
    COST_ESTIMATE_TOTAL.labels(provider, model).inc(cost_estimate)
    LATENCY_MS.labels(provider, model).observe(latency_ms)
    if status != "ok":
        ERRORS_TOTAL.labels(provider, model).inc()
