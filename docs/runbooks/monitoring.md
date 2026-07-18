---
module: platform
type: runbook
status: current
updated: 2026-07-08
---

# Runbook: Monitoring (Prometheus + Grafana)

Das `monitoring`-Profil zeigt Plattform-Gesundheit und Gateway-/Kosten-Metriken
(Issue #7) in Grafana. Bewusst getrennt vom späteren fachlichen Leitstand-Modul.

## Starten

```bash
cp .env.example .env
docker compose --profile monitoring up -d
```

Das Profil startet **auch** Postgres/Migrate/Core (der Kern ist Teil des
`monitoring`-Profils), sodass Prometheus sofort `/metrics` scrapen kann.

| Dienst | URL | Hinweis |
|---|---|---|
| Grafana | <http://localhost:3001> | anonymes Lesen an; Login `admin` / `GRAFANA_ADMIN_PASSWORD` |
| Prometheus | <http://localhost:9090> | Targets unter *Status → Targets* |
| Core-Metriken | <http://localhost:8000/metrics> | Quelle der Gateway-Metriken |

## Dashboards (automatisch provisioniert, Ordner „Stellwerk")

- **Plattform** – Core erreichbar (`up`), Gateway-Calls & Fehler gesamt,
  Latenz p95, Calls/s nach Status.
- **Modelle & Kosten** – Tokens, geschätzte Kosten (USD) und Latenz p95 **je
  Modell** sowie Calls je Modell.

Provisioning (kein Klick nötig):
`monitoring/grafana/provisioning/` (Datasource `uid: prometheus` +
Dashboard-Provider) lädt `monitoring/grafana/dashboards/*.json`.

## Daten erzeugen (Demo)

Die Metriken sind In-Prozess-Zähler des Kerns; sie füllen sich mit echten
Gateway-Aufrufen:

```bash
curl -s localhost:8000/api/v1/gateway/chat -H 'content-type: application/json' \
  -d '{"model":"stub-echo","messages":[{"role":"user","content":"hallo"}]}'
```

Historische Demo-Daten in der DB liefert `make seed` (Tabelle `gateway_calls`,
Grundlage späterer DB-basierter Auswertungen).

## Konfiguration

- Scrape-Ziel & Intervall: `monitoring/prometheus.yml` (`core:8000`, 15s).
- Grafana-Admin-Passwort/Ports/anonymes Lesen: `.env`
  (`GRAFANA_ADMIN_PASSWORD`, `GRAFANA_PORT`, `PROMETHEUS_PORT`,
  `GRAFANA_ANON_ENABLED`).
- Persistenz: benannte Volumes `prometheus-data`, `grafana-data`.

## Troubleshooting

- **Target `stellwerk-core` DOWN:** Kern healthy? `docker compose --profile
  monitoring ps`; `/metrics` erreichbar?
- **Panels leer:** noch keine Gateway-Aufrufe seit Kern-Start (Zähler starten
  bei 0) – ein paar Chat-Calls absetzen.
- **Grafana-Datasource-Fehler:** `docker compose logs grafana`; die Datasource
  ist read-only provisioniert (`uid: prometheus`).
