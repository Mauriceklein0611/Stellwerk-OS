---
module: core
type: architecture
status: current
updated: 2026-07-21
owner: Maurice
source_of_truth_for: implementierte Laufzeit-/Datenflüsse (Ist)
related_issues: [63]
related_adrs: [ADR-006]
---

# Laufzeit- und Datenflüsse

## Ist-Zustand: ein Gateway-Chat-Call

Der heute implementierte LLM-Pfad (ADR-006). Alle Module gehen über diesen einen Weg;
kein Modul spricht einen Provider direkt.

```
Aufrufer (authentifiziert via DevAuth)
  → POST /api/v1/gateway/chat   {model, messages, params}
      · Modell-Allowlist prüfen (sonst 400 unknown_model)
      · Provider aus Settings wählen (stub | ollama)  — app/gateway/registry.py
      · provider.chat(messages, model, params) → ChatResult{content, usage, latency_ms, provider, model}
      · Telemetrie: record_call(...) → gateway_calls (+ /metrics)   — app/telemetry/recorder.py
  ← 200 ChatResult
```

**Fehlerbilder** (zentraler Handler in `app/main.py`, siehe
[../core/architecture.md](../core/architecture.md)): `400 unknown_model`,
`502 provider_error`, `504 provider_timeout`, `500 gateway_misconfigured`,
`422` (Body-Validierung).

**Telemetrie-Naht:** `ChatResult.usage` (prompt/completion tokens), `latency_ms`,
`provider`, `model` fließen in `gateway_calls`; Kosten aus versionierten Preisperioden
(`app/telemetry/pricing.py`). Details: [../services/telemetry-costs.md](../services/telemetry-costs.md).

## Weitere Ist-Endpunkte

- `GET /healthz` – Liveness (reine Prozessantwort).
- `GET /readyz` – Readiness; **heute nur DB-Erreichbarkeit** (`SELECT 1`). Der
  Migrationsstand-Check ist `proposed` (#57).
- `GET /api/v1/telemetry/summary` – Aggregat (siehe Telemetrie-Handbuch).
- `GET /metrics` – Prometheus.

## Geplant (`proposed`): der Agent-Run end-to-end

Der zentrale Agent-Run-Datenfluss (`UI → BFF → Agent Runtime → Gateway → Telemetrie`,
`pms.draft@1.0.0`) ist **noch nicht implementiert**. Zielsequenz, Idempotenz,
Repair-Retry und `run_events` stehen in [roadmap.md §1.2](../platform/roadmap.md) und
[ADR-011/012](../platform/adrs/README.md); Umsetzung in #44. Bis dahin nutzt PM Studio
einen sichtbaren Mock (kein stiller Fallback als Zielregel).
