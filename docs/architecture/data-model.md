---
module: core
type: architecture
status: current
updated: 2026-07-21
owner: Maurice
source_of_truth_for: erklärt Datenmodell-Ist-Zustand und Ownership (Wahrheit = Migrationen)
related_issues: [63]
---

# Datenmodell – Ownership und Lebenszyklen

> **Wahrheit ist der Code:** Das tatsächliche Schema definieren die
> **Alembic-Migrationen** (`services/core/alembic/versions/`) und die ORM-Modelle
> (`services/core/app/db/models.py`). Diese Seite **erklärt** Ownership und Grenzen,
> sie **dupliziert kein Schema**.

## Ist-Zustand (implementiert)

Eine PostgreSQL-Instanz. Migrationen bis `0002_gateway_calls`.

| Tabelle | Owner (Dienst) | Zweck | Migration |
|---|---|---|---|
| `platform_info` | Plattform/Smoke | Schlüssel/Wert-Objekt zum Verifizieren von Migration + Persistenz | `0001_platform_info` |
| `gateway_calls` | Telemetrie | ein Datensatz je Modellaufruf (user, provider, model, tokens, latency, `cost_estimate`, status, request_id) | `0002_gateway_calls` |

## Schema-/Migrations-Ownership

Kern-Tabellen migriert **nur der Kern**. Fachmodule mit eigener Persistenz erhalten
später eigene PostgreSQL-Schemas, Alembic-Bäume und DB-Rollen mit per Grant erzwungenen
Grenzen (ADR-023, ab IDP/RAG) – nicht bloß Tabellenpräfixe. Zugriff auf Kern-Daten
erfolgt ausschließlich über Kern-APIs, nie durch Cross-Schema-SQL.

## Geplant (`proposed`, nicht implementiert)

Die Kern-Tabellen für Agent Runtime, Kostenprovenienz-Erweiterung, Workflows/Gates,
Audit, Identity, Budgets, Provider-Policy, Eval und RAG sind Zielbild und stehen mit
Owner und Meilenstein in [roadmap.md §1.3](../platform/roadmap.md). Konkret in
Vorbereitung:

- **`gateway_calls`-Erweiterung** (`currency`, `pricing_status`, `price_version`,
  `service`, `user_context`, optional `run_id`; unbekannt = NULL) — #60 (E3.1),
  [ADR-014](../platform/adrs/ADR-014-cost-pricing-provenance.md).
- **`agent_definitions`, `prompt_versions`, `agent_runs`, `run_payloads`,
  `run_events`** — #44,
  [ADR-011](../platform/adrs/ADR-011-runtime-and-definitions-ownership.md)/[ADR-012](../platform/adrs/ADR-012-lifecycles-idempotency-execution.md)/[ADR-015](../platform/adrs/ADR-015-run-data-classification-retention.md).
