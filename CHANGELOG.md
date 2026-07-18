# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden hier dokumentiert.

Das Format orientiert sich an [Keep a Changelog](https://keepachangelog.com/de/1.1.0/),
die Versionierung folgt [Semantic Versioning](https://semver.org/lang/de/).

## [Unreleased]

## [0.1.0] – 2026-07-08 – Foundation

Erster Meilenstein: schlanker Plattform-Kern mit geteilten Diensten, Ein-Befehl-
Installation, CI/CD, Security-Basis, Monitoring und der ersten Fach-App.
Gruppiert nach Modulen.

### Plattform
- Monorepo-Grundgerüst (npm-Workspaces `apps/*`/`packages/*`, Basisdateien,
  Ordnerstruktur) und Plattform-Doku mit YAML-Frontmatter. (#1, #2)
- Ein-Befehl-Installation: Compose-Profile (`core`/`llm`/`monitoring`),
  Multi-Stage-Dockerfile (non-root), `compose.prod.yml`, `Makefile`. (#5)
- Monorepo-CI: pfadgefilterte Gates (Python + TS), Docker-Build, GHCR-Push auf
  `main`/Tags, Sammel-Gate `ci-ok`. (#8)
- Security-Basis: Dependabot, CodeQL (Python + JS/TS), Trivy-Image-Scan,
  `SECURITY.md`. (#9)
- Monitoring-Profil: Prometheus + Grafana mit vorprovisionierten Dashboards
  „Plattform" und „Modelle & Kosten". (#12)

### Kern (`services/core`)
- FastAPI-Skeleton: App-Factory, `/healthz`, Pydantic-Settings, strukturiertes
  JSON-Logging, Request-ID-Middleware, DevAuth. (#3)
- Persistenz: Postgres, SQLAlchemy 2 (typed), Alembic-Migrationen, `/readyz`,
  idempotentes Seed-Skript. (#4)
- Model Gateway v1: `POST /api/v1/gateway/chat`, austauschbarer Provider
  (Ollama + deterministischer Stub), Modell-Allowlist, Fehlerbilder. (#6)
- Telemetrie: `gateway_calls` je Aufruf, Prometheus-`/metrics`, Kosten aus
  versionierten Preisperioden, `GET /api/v1/telemetry/summary`. (#7)
- Contract-Pipeline: deterministischer OpenAPI-Export → `@stellwerk/contracts`
  (openapi-typescript), Drift-Check in CI. (#11)

### PM Studio (`apps/pm-studio`)
- Einzug der Next.js-App aus dem Alt-Repo `projectmind-os` als Workspace-App –
  reiner Umzug, CI-integriert (Vitest, Build, CodeQL). (#10)
