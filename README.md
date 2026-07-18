# Stellwerk

> Modulare Open-Source-Plattform für Enterprise AI. Wie ein Stellwerk im
> Bahnbetrieb Weichen und Signale stellt, orchestriert Stellwerk KI im
> Unternehmen: Agenten und Workflows, Freigabe-Signale (Human-in-the-Loop) und
> ein Leitstand für Modelle, Kosten, Qualität und Audit.

Stellwerk ist **ein schlanker Plattform-Kern mit geteilten Diensten**, auf dem
gleichrangige Fachmodule laufen. Jedes Modul ist einzeln nutzbar, aber alle
teilen sich Identität, Modellzugang, Audit, Telemetrie und Evaluation.

## Architektur in einem Satz

Ein Kern (`services/core`, FastAPI) stellt sechs Dienste bereit – Identity,
Model Gateway, Telemetrie/Kosten, Audit, Evaluation, Agent Runtime – und darauf
laufen Fachmodule, die einen kurzen [Modul-Vertrag](docs/platform/vision.md)
erfüllen (kein eigenes Login, alle LLM-Calls über den Gateway, Audit-Pflicht).

## Modul-Landkarte

| Modul | Inhalt | Reifegrad |
|---|---|---|
| **PM Studio** (`apps/pm-studio`) | Agentisches Projektmanagement | Tier 1 – eingezogen (aus [projectmind-os](https://github.com/Mauriceklein0611/projectmind-os)) |
| **Kern** (`services/core`) | Identity, Gateway, Telemetrie, Audit, Eval, Runtime | Tier 1 – als Nächstes |
| **IDP** | Dokumentenpipeline OCR → LLM → strukturierte Daten | Tier 2 |
| **Leitstand** | Governance- & Analytics-Dashboard | Tier 2 |
| **Knowledge & RAG** | Dokumentensuche mit Quellen | Tier 3 |
| **Flow** | Low-Code Workflow-Automation | Tier 3 |

## Quickstart

Voraussetzung: Docker (mit Compose v2). Zwei Befehle bis zur laufenden Plattform:

```bash
cp .env.example .env
make up          # baut & startet Kern + Postgres, migriert automatisch
```

Danach:

- Health: <http://localhost:8000/healthz> → `{"status":"ok"}`
- Readiness (inkl. DB): <http://localhost:8000/readyz> → `{"status":"ready"}`
- API-Docs: <http://localhost:8000/docs>

Weitere Befehle (`make help` zeigt alle):

```bash
make seed        # Demo-/Basisdaten in platform_info (idempotent)
make logs        # Logs folgen
make down        # stoppen (benannte Volumes bleiben erhalten)
```

Optionale Profile:

```bash
docker compose --profile llm up -d          # zusätzlich Ollama (lokale Modelle)
docker compose --profile monitoring up -d   # Prometheus + Grafana (Dashboards vorprovisioniert)
```

Monitoring-Dashboards nach dem Start: Grafana <http://localhost:3001>
(„Plattform" und „Modelle & Kosten"), Prometheus <http://localhost:9090>.
Details: [docs/runbooks/monitoring.md](docs/runbooks/monitoring.md).

Produktions-Overlay (Restart-Policy, Ressourcen-Limits, Log-Rotation):

```bash
docker compose -f docker-compose.yml -f compose.prod.yml --profile core up -d
```

Das Repo-Grundgerüst und die einzelnen Bausteine entstehen über GitHub-Issues des
Milestones **v0.1 Foundation**.

## Doku & Arbeitsweise

- **Verbindlicher Bauplan:** [docs/platform/build-spec.md](docs/platform/build-spec.md)
- **Vision & Architektur:** [docs/platform/vision.md](docs/platform/vision.md)
- **Arbeitssystem (Tickets/Doku):** [docs/platform/arbeitssystem.md](docs/platform/arbeitssystem.md)
- **Glossar:** [docs/platform/glossar.md](docs/platform/glossar.md)
- **Arbeitsregeln für Beiträge:** [CLAUDE.md](CLAUDE.md)

Entwickelt wird ausschließlich über GitHub Issues: genau ein Issue pro
Feature-Branch/PR (`Closes #N`).

## Herkunft

PM Studio entstand als eigenständiges Projekt
([projectmind-os](https://github.com/Mauriceklein0611/projectmind-os), Tags
v0.1–v0.5) und wurde mit Issue #10 als erste App in dieses Monorepo eingezogen
(`apps/pm-studio`) – reiner Umzug, keine Feature-Änderung. Die vollständige
Historie liegt im (zu archivierenden) Alt-Repo; die frozen-Alt-Doku unter
[docs/pm-studio/](docs/pm-studio/).

## Lizenz

[MIT](LICENSE)
