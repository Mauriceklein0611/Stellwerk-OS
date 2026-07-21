---
module: core
type: reference
status: current
updated: 2026-07-21
owner: Maurice
source_of_truth_for: erklärt Telemetrie-/Kosten-Dienst (Wahrheit = OpenAPI + Migrationen + Code)
related_issues: [63, 60]
related_adrs: [ADR-014]
---

# Dienst · Telemetrie / Kosten

> Schnittstellen-/Schema-Wahrheit: OpenAPI + [`packages/contracts`](../core/api.md) +
> Alembic-Migrationen. Datenmodell: [../architecture/data-model.md](../architecture/data-model.md).

## Verantwortung

Erfasst je Gateway-Call einen auswertbaren Datensatz (Usage, Latenz, Kosten) und stellt
Aggregate bereit – Grundlage für FinOps und (später) den Leitstand.

## API / Signale (Ist)

- `GET /api/v1/telemetry/summary` – Aggregat je Provider/Modell.
- `GET /metrics` – Prometheus-Export (In-Memory-Zähler).
- Persistenz: Tabelle `gateway_calls` (`app/db/models.py`).

## Schreibpfad

`app/telemetry/recorder.py::record_call(...)` schreibt **robust** (wirft nie): Metriken
zuerst (in-memory), dann DB; ein DB-Ausfall reißt die Zähler nicht mit. Kosten aus
versionierten Preisperioden (`app/telemetry/pricing.py`, `prices.json`).

## Bekannte Grenzen (Ist)

- `cost_estimate` ist heute **nicht nullable** und wird bei unbekanntem Preis als `0.0`
  berechnet — das widerspricht der Zielsemantik und wird in **#60** korrigiert.
- Metriken sind **in-memory** (Single-Instance-Grenze, siehe
  [roadmap.md §Teil 6 Nr. 10](../platform/roadmap.md)).

## Geplant (`proposed`, #60 / ADR-014)

Kosten-/Preisprovenienz: `currency`, `pricing_status ∈ {real,simulated,unknown}`,
`price_version`, `service`, `user_context`, optional `run_id`; **unbekannt = NULL, nie 0**;
Überlappungsprüfung der Preisperioden; Provenienz in Summary/UI sichtbar.
[ADR-014](../platform/adrs/ADR-014-cost-pricing-provenance.md).
