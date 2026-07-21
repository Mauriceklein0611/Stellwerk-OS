---
module: core
type: reference
status: current
updated: 2026-07-21
owner: Maurice
source_of_truth_for: Index der logischen Dienste und ihres Reifegrads
related_issues: [63]
---

# Dienste – Index

Ein Deployment (`services/core`), mehrere **logische** Dienste (keine eigenen
Microservices). Ein Handbuch wird **erst angelegt, wenn der Dienst real existiert** –
keine leeren Zukunftsdokumente. Handbuch-Schablone: siehe
[roadmap.md §8.2](../platform/roadmap.md) bzw.
[templates/service-documentation-template.md](../templates/service-documentation-template.md).

## Implementiert (`current`)

| Dienst | Handbuch | Kern-Endpunkte |
|---|---|---|
| Model Gateway | [model-gateway.md](model-gateway.md) | `POST /api/v1/gateway/chat` |
| Telemetrie/Kosten | [telemetry-costs.md](telemetry-costs.md) | `GET /api/v1/telemetry/summary`, `GET /metrics` |
| Identity | [identity.md](identity.md) | (DevAuth-Dependency, kein eigener Endpunkt) |
| Core (Health/Betrieb) | — | `GET /healthz`, `GET /readyz` |

## Geplant (`proposed`, noch kein Handbuch)

Agent Runtime (#44), Event/Audit gehärtet (v0.4), Eval Harness (v0.6) – Planung
ausschließlich in [roadmap.md](../platform/roadmap.md) und den ADRs, bis ein realer
Implementierungsschnitt existiert.
