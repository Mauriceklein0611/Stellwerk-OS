---
module: core
type: reference
status: current
updated: 2026-07-21
owner: Maurice
source_of_truth_for: menschliche Erklärung der HTTP-API (Wahrheit = generiertes OpenAPI)
related_issues: [63]
related_adrs: [ADR-006, ADR-027]
---

# Kern-API – Überblick

> **Maschinelle Wahrheit:** das aus dem Code exportierte **OpenAPI**-Schema
> (`app/export_openapi.py`) und das daraus generierte `packages/contracts`. Diese
> Seite erklärt Nutzung und verlinkt — sie **dupliziert keine Request-/Response-Schemas**.
> Contract-Pipeline und Drift-Check: [../core/api.md](../core/api.md).

## Endpunkte (Ist)

| Methode/Pfad | Zweck | Auth |
|---|---|---|
| `GET /healthz` | Liveness | nein |
| `GET /readyz` | Readiness (DB erreichbar; Migrationscheck `proposed` #57) | nein |
| `POST /api/v1/gateway/chat` | LLM-Aufruf (ADR-006) | DevAuth |
| `GET /api/v1/telemetry/summary` | Kosten-/Usage-Aggregat | DevAuth |
| `GET /metrics` | Prometheus | nein |

## Authentifizierung

Heute **DevAuth** (statischer Nutzer, Rolle per Env). OIDC/RBAC ist `proposed` (v0.4).
Siehe [../services/identity.md](../services/identity.md).

## Fehlermodell

Gateway-Fehler haben ein strukturiertes `error`-Feld (`unknown_model`, `provider_error`,
`provider_timeout`, `gateway_misconfigured`); Body-Validierung → `422`. Zentraler Handler
in `app/main.py`. Details: [../services/model-gateway.md](../services/model-gateway.md).

## Versionierung

Pfadpräfix `/api/v1`. Health/Metrics liegen bewusst ohne Präfix.

## Idempotenz & Events

- **Idempotenz:** noch nicht relevant (keine Run-Erstellung). Zielvertrag
  (`Idempotency-Key` + Request-Hash, 409 bei Konflikt) ist `proposed`
  ([ADR-012](../platform/adrs/ADR-012-lifecycles-idempotency-execution.md), #44).
- **Events:** kein externer Event-Vertrag. `run_events`/SSE sind `proposed` (v0.3/v0.4).

## Kompatibilität

Additive Änderungen bevorzugt; Breaking Changes brauchen Major-Version + Migrationspfad.
Als Policy noch `proposed` (ADR-027, vor dem zweiten Konsumenten zu entscheiden).
