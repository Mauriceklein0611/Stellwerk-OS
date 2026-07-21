---
module: platform
type: architecture
status: current
updated: 2026-07-21
owner: Maurice
source_of_truth_for: implementierter Architektur-Ist-Zustand (Einstieg/Index)
related_issues: [63]
related_adrs: [ADR-006, ADR-011, ADR-013]
---

# Architektur – Überblick (arc42-lite)

Beschreibt den **implementierten Ist-Zustand** (`current`). Das Zielbild bis v1.0
(Agent Runtime, Workflows, Audit-Härtung, OIDC, Cloud …) steht in der
[roadmap.md](../platform/roadmap.md) und ist dort als `proposed` gekennzeichnet.
Detailseiten: [runtime-and-dataflows.md](runtime-and-dataflows.md) ·
[deployment.md](deployment.md) · [data-model.md](data-model.md).

## 1. System-Kontext

Stellwerk ist ein schlanker **Kern** (`services/core`, FastAPI) mit geteilten Diensten,
darauf gleichrangige **Fachmodule** (`apps/*`). Aus dem Kern generierte Verträge liegen
in `packages/contracts`. Externe Welt: LLM-Provider (nur über den Gateway), PostgreSQL,
optional Ollama und Prometheus/Grafana.

## 2. Bausteine (Container)

| Container | Technik | Ist-Zustand |
|---|---|---|
| `services/core` | FastAPI, SQLAlchemy 2, Alembic, uv | **current** – Health, Model Gateway, Telemetrie/Kosten, DevAuth |
| `apps/pm-studio` | Next.js | **current** – UI mit **Mock**-Agent-Service; noch keine BFF-Run-Routen |
| `packages/contracts` | openapi-typescript | **current** – generierte Typen, Drift-Check |
| PostgreSQL | postgres:16 | **current** – Tabellen `platform_info`, `gateway_calls` |
| Ollama / Prometheus / Grafana | Container | **current**, aber **optionale** Compose-Profile |

**Nur `proposed` (Roadmap, noch nicht implementiert):** Agent Runtime/Registry,
Event/Audit (gehärtet), Eval Harness, Workflow/Gates/Artifact Store, OIDC, Cloud-Provider,
Leitstand/IDP/RAG/Flow.

## 3. Logische Kernfähigkeiten – Reifegrad

| Fähigkeit | Status | Doku |
|---|---|---|
| Model Gateway | **current** | [services/model-gateway.md](../services/model-gateway.md) |
| Telemetrie/Kosten | **current** (Kostenprovenienz-Erweiterung `proposed`, #60) | [services/telemetry-costs.md](../services/telemetry-costs.md) |
| Identity | **current** = DevAuth (OIDC `proposed`, v0.4) | [services/identity.md](../services/identity.md) |
| Agent Runtime | `proposed` | [roadmap.md §1.2/§Teil 2](../platform/roadmap.md) |
| Event/Audit (gehärtet) | `proposed` (v0.4) | roadmap ADR-018 |
| Eval Harness | `proposed` (v0.6) | roadmap ADR-022 |

## 4. Trust-Grenzen (Grundlage aller Entscheidungen)

1. **Browser → BFF:** Browser ist untrusted; keine Core-URL-Credentials, keine
   Provider-Secrets, `NEXT_PUBLIC_*` nie vertraulich. *(BFF-Schicht selbst ist noch
   `proposed`, ADR-013 — heute ruft PM Studio nur seinen Mock.)*
2. **BFF → Core:** Service- und Nutzer-Kontext getrennt (`service` vs. `user`);
   ab v0.4 OIDC (ADR-013/019).
3. **Core → Provider:** **nur** der Gateway spricht LLM-Provider (ADR-006);
   Provider-Auswahl allein per Env. Kein Provider-SDK außerhalb des Gateways.

## 5. Qualitätsziele

Nachvollziehbarkeit, Determinismus in CI (kein Live-LLM im Pflicht-Gate, ADR-006),
Datenminimierung/Sicherheit, würdevolle Degradation, Betreibbarkeit (Ein-Befehl-Install),
ehrliche Reifeaussagen. Details/Nachweise: [roadmap.md §Teil 6](../platform/roadmap.md),
[../testing/strategy.md](../testing/strategy.md), [../security/README.md](../security/README.md).

## 6. Tragende Entscheidungen

Kern-Architekturbegründung: der detaillierte Kern steht in
[../core/architecture.md](../core/architecture.md); Entscheidungen im
[ADR-Index](../platform/adrs/README.md) (ADR-006 Gateway, ADR-011–015 v0.2).
