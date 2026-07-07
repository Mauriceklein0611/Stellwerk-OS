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
| **PM Studio** (`apps/pm-studio`) | Agentisches Projektmanagement | Tier 1 – in Arbeit |
| **Kern** (`services/core`) | Identity, Gateway, Telemetrie, Audit, Eval, Runtime | Tier 1 – als Nächstes |
| **IDP** | Dokumentenpipeline OCR → LLM → strukturierte Daten | Tier 2 |
| **Leitstand** | Governance- & Analytics-Dashboard | Tier 2 |
| **Knowledge & RAG** | Dokumentensuche mit Quellen | Tier 3 |
| **Flow** | Low-Code Workflow-Automation | Tier 3 |

## Quickstart

> ⏳ Platzhalter – vollständige Ein-Befehl-Installation folgt mit v0.1 (Issue #5).

```bash
cp .env.example .env
make up          # kommt mit Issue #5 (Compose-Profile + Makefile)
```

Aktuell steht das Repo-Grundgerüst; die einzelnen Bausteine werden über
GitHub-Issues des Milestones **v0.1 Foundation** aufgebaut.

## Doku & Arbeitsweise

- **Verbindlicher Bauplan:** [docs/platform/build-spec.md](docs/platform/build-spec.md)
- **Vision & Architektur:** [docs/platform/vision.md](docs/platform/vision.md)
- **Arbeitssystem (Tickets/Doku):** [docs/platform/arbeitssystem.md](docs/platform/arbeitssystem.md)
- **Glossar:** [docs/platform/glossar.md](docs/platform/glossar.md)
- **Arbeitsregeln für Beiträge:** [CLAUDE.md](CLAUDE.md)

Entwickelt wird ausschließlich über GitHub Issues: genau ein Issue pro
Feature-Branch/PR (`Closes #N`).

## Herkunft

PM Studio entstand als eigenständiges Projekt (Tags v0.1–v0.5) und wird als erste
App in dieses Monorepo eingezogen (Issue #10). Das Alt-Repo wird archiviert und
hier verlinkt, sobald der Einzug erfolgt ist.

## Lizenz

[MIT](LICENSE)
