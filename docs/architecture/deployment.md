---
module: platform
type: architecture
status: current
updated: 2026-07-21
owner: Maurice
source_of_truth_for: Deployment-/Laufzeit-Topologie (Ist); Wahrheit = Compose/Dockerfiles
related_issues: [63]
---

# Deployment und Laufzeit-Topologie

> **Wahrheit ist der Code:** [docker-compose.yml](../../docker-compose.yml),
> [compose.prod.yml](../../compose.prod.yml), die Dockerfiles und das
> [Makefile](../../Makefile). Diese Seite erklärt Topologie und Trust-Grenzen.

## Compose-Profile (Ist)

| Profil | Enthält | Zweck |
|---|---|---|
| `core` | postgres, migrate, core | Kern + DB (Standard, `make up`) |
| `llm` | + ollama | lokale Modelle |
| `monitoring` | + prometheus, grafana | Dashboards |
| `pms` | pm-studio | Fach-App (eigenständig startbar) |

Ein-Befehl-Install (`make up`) bleibt heilig; optionale Infrastruktur ist immer ein
**Profil**, nie heimliche Pflicht (Degradation: jedes Modul startet ohne die anderen).

## Images (Ist)

- Kern: Multi-Stage-Dockerfile (`services/core/Dockerfile`), non-root.
- PM Studio: `apps/pm-studio/Dockerfile`.
- CI baut das Kern-Image; **beide Images bauen+starten in CI** ist `proposed` (#55).
- GHCR-Push versionierter Images auf `main`/Tags.

## Produktions-Overlay

`docker compose -f docker-compose.yml -f compose.prod.yml --profile core up -d`
(Restart-Policy, Ressourcen-Limits, Log-Rotation). **Prod-Fail-Fast** bei unsicheren
Defaults (`STW_ENV=prod` verweigert DevAuth, keine offenen Infra-Ports, Grafana-Anon aus)
ist `proposed` (#56).

> **Reifegrad:** „produktionsähnlich". Ein realer Produktionsbetrieb ist nicht
> nachgewiesen; Backup/Restore ist geprobt erst ab v0.3 (#E12.1). Siehe
> [../operations/README.md](../operations/README.md).

## Trust-Grenzen im Deployment

- Provider-Welt ist **nur aus dem Gateway** erreichbar (ADR-006).
- Browser erhält keine Secrets; `NEXT_PUBLIC_*` nie vertraulich (ADR-013).
- PostgreSQL/Ollama sind interne Dienste (Prod: keine öffentlichen Ports, #56).
Details: [README.md §4](README.md), [../security/README.md](../security/README.md).
