---
module: platform
type: reference
status: current
updated: 2026-07-21
owner: Maurice
source_of_truth_for: Betriebsindex (produktionsähnlich); Verfahren verlinkt
related_issues: [63]
---

# Betrieb – Production Handbook (Index)

> **Reifegrad ehrlich:** „**produktionsähnlich**". Ein realer Produktionsbetrieb ist
> nicht nachgewiesen. Runbooks werden nur für **existierende** Betriebsfälle angelegt.

## Installation & Start

- Quickstart: [README.md §Quickstart](../../README.md) — `cp .env.example .env && make up`.
- Compose-Topologie/Profile: [../architecture/deployment.md](../architecture/deployment.md).
- Health/Readiness: `GET /healthz`, `GET /readyz` (Migrationscheck `proposed` #57).

## Konfiguration

Settings über Env-Präfix `STW_` (`services/core/app/settings.py`) + `.env.example`.
Das ist die Konfigurations-Wahrheit; hier nicht duplizieren.

## Vorhandene Runbooks

- CI/Release-Pipeline: [../runbooks/ci.md](../runbooks/ci.md).
- Monitoring (Prometheus/Grafana): [../runbooks/monitoring.md](../runbooks/monitoring.md).

## Geplant (`proposed`)

- **Backup/Restore** der Postgres-Volumes (geprobt) — v0.3 (E12.1).
- **Prod-Fail-Fast** unsicherer Defaults — #56.
- **Release-/Rollback-Verfahren** (Tags, Images, Migration) auf verifiziertem
  Branch-Modell — E12.6.
- Disaster Recovery, Incident-Response, Alerting-Basis — v0.4–v0.6.

Bis diese Verfahren existieren und geprobt sind, werden **keine** Platzhalter-Runbooks
angelegt (siehe [roadmap.md §Teil 6 Nr. 5](../platform/roadmap.md)).
