---
module: platform
type: vision
status: current
updated: 2026-07-07
---

# Stellwerk – Open-Source Enterprise AI Platform

> Arbeitstitel gemäß ADR-001 (unten). Der Name ist im gesamten Dokument per
> Suchen-Ersetzen tauschbar; kein Modul heißt wie die Plattform.

## Vision

Stellwerk ist eine modulare Open-Source-Plattform für Enterprise AI. Wie ein
Stellwerk im Bahnbetrieb Weichen, Signale und Fahrstraßen stellt, damit viele
Züge sicher durch ein gemeinsames Netz laufen, stellt diese Plattform die
Weichen für KI im Unternehmen: Sie orchestriert Agenten und Workflows, setzt
Freigabe-Signale (Human-in-the-Loop-Gates) und behält im Leitstand (Governance)
jederzeit den Überblick über Modelle, Kosten, Qualität und Audit-Spuren.

Stellwerk ist kein einzelner Chatbot und auch kein einzelnes Fachtool, sondern
eine Architektur: ein schlanker Plattform-Kern mit geteilten Diensten, auf dem
gleichrangige Fachmodule laufen – Projektmanagement, Dokumentenverarbeitung,
Wissensplattform, Workflow-Automatisierung und mehr. Jedes Modul ist einzeln
nutzbar, aber alle teilen sich Identität, Modellzugang, Audit, Telemetrie und
Evaluation. Genau diese Trennung – Kern vs. Module – ist das, was
Enterprise-Plattformen von Feature-Sammlungen unterscheidet, und sie ist der
eigentliche Lerngegenstand des Projekts.

Die Plattform ist lokal-first (Ollama, lokale Embeddings, Docker Compose, keine
laufenden Kosten) und cloud-ready (austauschbarer Modell-Gateway für Azure
OpenAI, OpenAI, Bedrock). Sie wird wie ein echtes Softwareprodukt entwickelt:
mit PRDs, ADRs, Backlog, Releases, CI und Definition of Done – geplant und
gesteuert mit dem eigenen Projektmanagement-Modul.

## ADR-001: Name des Gesamtsystems

**Kontext.** Der bisherige Arbeitstitel „ProjectMind OS" beschreibt nur das
Projektmanagement-Modul und taugt nicht als Dach für eine Plattform, in der
dieses Modul gleichrangig neben RAG, IDP, Governance u. a. steht. Die im
AI-Markt naheliegende „Orchestra"-Namensfamilie (Orchestral.ai, Orchestra AI,
getorchestra.io, Orchestro.ai) ist kommerziell mehrfach besetzt.

**Optionen.** Stellwerk (Bahn-Leittechnik-Metapher), Leitstand (Fertigungs-IT,
generisch belegt), Kontor (Musiklabel dominiert), Agentwerk (Kunstwort,
Agentur-Kollisionen möglich).

**Entscheidung.** *Stellwerk.* Begründung: (1) semantisch präzise – Weichen,
Signale und Fahrstraßen entsprechen Routing, HITL-Gates und Workflows; (2) im
Enterprise-/AI-Namespace unverbraucht (Kollisionen nur im
Eisenbahn-Hobby-Umfeld); (3) deutsch-industrielle Identität passt zum Profil
(Finanzsektor, Regulatorik, Governance); (4) trägt eine konsistente
Benennungswelt für Kernkomponenten (Leitstand, Fahrplan, Signal, Weiche).

**Status.** Angenommen als Arbeitstitel; vor Veröffentlichung GitHub-Namen
(`stellwerk-os` o. ä.) und Domain final prüfen.

## Architekturprinzip: ein Kern, gleichrangige Module

Der wichtigste Schnitt der Plattform ist die Trennung zwischen dem, was **alle**
brauchen, und dem, was **ein Fachgebiet** braucht. Alles Querliegende gehört in
den Kern – kein Modul implementiert eigenes Login, eigenen Modellzugang oder
eigenes Audit-Log. Damit korrigiert diese Vision auch die ursprüngliche
Modulliste: „Benutzer- und Rollenverwaltung" ist kein Modul, sondern
Kern-Infrastruktur; „Governance" teilt sich in Kern-Dienste (Erfassung) und ein
Modul (Auswertung/Dashboard).

### Der Plattform-Kern (services/core)

Der Kern ist ein FastAPI-Backend mit PostgreSQL und stellt sechs Dienste bereit,
die jedes Modul konsumiert:

1. **Identity & Access** – Login, Rollen (Admin/User/Auditor), Teams, API-Keys.
   Umsetzung über Keycloak (lokal, Docker); Module erhalten nur Tokens und
   Berechtigungsprüfungen. (Die vorbereitete Naht in PM Studio,
   `resolveMyWorkPersonId`, dockt genau hier an.)
2. **Model Gateway** – eine Schnittstelle für alle LLM-/Embedding-Aufrufe mit
   Providern Ollama (Default, lokal) und Azure OpenAI/OpenAI (optional).
   Zentraler Ort für Modellverwaltung, Timeouts, Retries – und die Quelle aller
   Telemetriedaten.
3. **Telemetrie & Kosten** – jeder Gateway-Aufruf protokolliert Modell,
   Tokens in/out, Latenz und geschätzte Kosten (lokal: simulierte Preistabelle;
   Cloud: echte Preisperioden – das bestehende Azure-Cost-Mapping-Projekt ist
   der fertige Prototyp dieser Komponente).
4. **Audit & Activity** – append-only Ereignis- und Entscheidungs-Log über alle
   Module (wer/welcher Agent hat wann was getan, inkl. Provenienz
   agent/human/human_edited). Das Muster ist in PM Studio bereits gebaut
   (Activity Feed + Decision Log) und wird in den Kern generalisiert.
5. **Evaluation Harness** – Testfälle, Prompt-Versionierung, Modellvergleich,
   Regressionsläufe als Kern-Dienst, den jedes Modul für seine Agenten nutzt
   (Basis: DeepEval/promptfoo/RAGAS-Konzepte).
6. **Agent Runtime** – LangGraph-basierte Ausführung von Agenten und Workflows
   mit HITL-Gates (Signal-Prinzip: kein Weiterfahren ohne Freigabe, sofern das
   Gate es verlangt). Definitionen und Läufe (`WorkflowDefinition`/`WorkflowRun`)
   sind Kern-Konzepte, nicht Modul-Eigentum.

### Der Modul-Vertrag

Ein Fachmodul ist gleichrangig, wenn es diesen Vertrag erfüllt – er ist bewusst
kurz, damit Module unabhängig entstehen können:

- Es authentifiziert ausschließlich über den Kern (kein eigenes Login).
- Alle Modellaufrufe laufen über den Model Gateway (keine direkten
  Provider-SDKs im Modul).
- Es emittiert Audit-Events und Provenienz für agentisch erzeugte Inhalte;
  Agenten schreiben nie direkt in Bestandsdaten, sondern über Vorschlags-Inbox
  oder Gate.
- Es bringt eigene Doku (`docs/<modul>/`), eigenen Task-Nummernkreis
  (`PMS-`, `IDP-`, `RAG-` …) und eigene Tests mit derselben Definition of Done.
- Es ist einzeln startbar (Docker-Compose-Profil) und degradiert würdevoll,
  wenn andere Module fehlen.

## Modul-Landkarte und Reifegrade

Gleichrangig heißt architektonisch gleichberechtigt – nicht gleichzeitig. Die
Module sind in drei Reifegrade eingeteilt; die Zuordnung nutzt ehrlich, was
bereits existiert:

| Modul | Inhalt (Kurzform) | Tier | Ist-Stand / Startkapital |
|---|---|---|---|
| PM Studio | Agentisches Projektmanagement: Backlog, Sprints, Releases, Ceremonies, PO-/Scrum-Agenten | **1 – in Arbeit** | MVP fertig (v0.5.0), Welle TASK-056–066 geschnitten; liefert die UI-Muster (Inbox, Gates, Provenienz) für alle Module |
| Kern (services/core) | Identity, Model Gateway, Telemetrie, Audit, Eval, Agent Runtime | **1 – als Nächstes** | Nähte vorhanden: `AgentService`-Interface, Activity/Decision-Log, Cost-Mapper-Prototyp, Login-Naht |
| IDP | Dokumentenpipeline OCR → LLM → Validierung → strukturierte Daten | **2** | Bachelorarbeit (Note 1,3) ist der fertige Fachkern: PyMuPDF, PaddleOCR, Hybrid-Extraktion, 0.846 F1 – „nur" hinter Kern + Upload-UI setzen |
| Leitstand (Governance & Analytics) | Dashboard über Kern-Telemetrie: Modelle, Kosten, Qualität, Audit, DSGVO-Sicht | **2** | Kern liefert die Daten frei Haus; Azure-Cost-Dashboard-Erfahrung vorhanden |
| Knowledge & RAG | Dokumentensuche mit Quellen, Chunking, Versionierung, Rechteprüfung über Kern-Identity | **3** | Architekturwissen aus DekaGPT-/RAG-Deep-Dive; lokale Embeddings (nomic-embed-text) + Chroma/Qdrant |
| Flow (Workflow Automation) | Low-Code-Canvas über der Agent Runtime; Fake-Enterprise-Konnektoren (fake_jira, fake_outlook, fake_sap) | **3** | React-Flow-Erfahrung aus `/workflows`; Visual-Agent-Orchestrator-Konzept liegt vor |
| Fernziele | Agent Marketplace, Voice/Computer-Use, MCP-Server, M365-/SAP-Anbindung echt, Mobile | **Backlog** | bewusst unpriorisiert; erst wenn ≥2 Fachmodule auf dem Kern laufen |

Zwei Streichungen gegenüber der Ursprungsliste, mit Begründung: „Benutzer- und
Rollenverwaltung" wandert vollständig in den Kern (ein Modul „Login" ergibt
keinen Sinn), und „Agent Management" teilt sich auf – Runtime und
Modellverwaltung in den Kern, der visuelle Agent Builder wird ein späteres
Feature des Flow-Moduls statt eines eigenen Moduls.

## Repository- und Arbeitsstruktur

Bis zum Kern-Start bleibt PM Studio ein eigenständiges Repo (laufende Welle
nicht unterbrechen). Mit dem ersten Kern-Commit beginnt das Monorepo:

```
stellwerk/
├── apps/
│   ├── pm-studio/        ← bestehendes Next.js-Projekt, umgezogen
│   ├── idp/              ← später
│   └── leitstand/        ← später
├── services/
│   └── core/             ← FastAPI: Identity, Gateway, Telemetrie, Audit, Eval, Runtime
├── packages/
│   ├── ui/               ← geteilte Komponenten (StatusBadge, Inbox-Karten, Design-Tokens)
│   └── contracts/        ← geteilte Typen/Schemas (OpenAPI-generiert)
├── docs/
│   ├── platform/         ← diese Vision, Kern-Architektur, ADRs, Modul-Vertrag
│   └── <modul>/          ← je Modul eigene Doku
└── docker-compose.yml    ← Profile: core, pm-studio, idp, …
```

Das bewährte Arbeitssystem (CLAUDE.md, Task-Dateien, task-index, Archiv,
Qualitäts-Gate, Testkonzepte) bleibt unverändert – es wird nur je Modul
namespaced: Nummernkreise `PMS-TASK-###`, `CORE-TASK-###`, `IDP-TASK-###`;
Branch-Schema `feat/pms-056-…`. Bestehende PM-Studio-Tasks 001–066 behalten
ihre Nummern (historisch), neue Tasks nutzen den Präfix.

## Enterprise-Engineering: Betrieb, Qualität, Sicherheit

Enterprise-reif heißt hier nicht Hochverfügbarkeit für Millionen Nutzer,
sondern: Das Projekt demonstriert dieselben Engineering-Standards, die in einem
Unternehmens-Team gelten würden – vollständig, nachvollziehbar und in CI
erzwungen. Diese Standards sind Teil des Modul-Vertrags; kein Modul geht ohne
sie in ein Release.

### Containerisierung & Installation

Die gesamte Plattform installiert sich mit einem Befehl: `docker compose up`
(plus `cp .env.example .env`). Dahinter stehen Multi-Stage-Dockerfiles je
App/Service (schlanke Runtime-Images, kein Node/Poetry im Endimage),
Compose-Profile je Modul (`core`, `pm-studio`, `idp`, `monitoring` – Module
einzeln startbar, wie der Vertrag verlangt), Healthchecks an jedem Container
(`depends_on: condition: service_healthy` statt Sleep-Hacks), benannte Volumes
für Postgres/Ollama-Modelle/Chroma und ein `Makefile`/`justfile` für die
Alltagsbefehle (`make up`, `make test`, `make seed`). Datenbankschema-Änderungen
laufen ausschließlich über Alembic-Migrationen; ein Seed-Skript füllt die
Plattform mit realistischen Demo-Daten (fiktive Projekte, Dokumente, Läufe),
damit jeder Recruiter-Klon sofort etwas zu sehen hat. Ein
Produktionsähnliches Profil (`compose.prod.yml`: ohne Bind-Mounts, mit
Ressourcen-Limits und Log-Rotation) zeigt, dass der Unterschied dev/prod
verstanden ist.

### CI/CD (GitHub Actions, Monorepo)

Die bestehende PM-Studio-Pipeline (Lint, Typecheck, Test, Build bei PRs) wird
zur Monorepo-Pipeline mit Pfad-Filtern ausgebaut – es baut nur, was sich
geändert hat. Stufen je PR nach `dev`: Lint + Typecheck (ESLint/tsc bzw.
ruff/mypy) → Unit-Tests (Vitest bzw. pytest) → Build → E2E (Playwright gegen
einen per Compose hochgefahrenen Stack) → Docker-Image-Build. Auf `main`
zusätzlich: Versions-Tag, Image-Push in die GitHub Container Registry (GHCR),
GitHub Release mit generierten Notes – Releases sind damit reproduzierbare
Artefakte, nicht nur Git-Tags. Branch-Protection auf `dev`/`main`
(nur PRs, CI muss grün sein) bleibt wie im bestehenden Arbeitsmodell.

### Test-Strategie (Pyramide + KI-Besonderheit)

Vier Ebenen, alle in CI: **Unit** (Vitest/RTL im Frontend, pytest im Kern –
reine Logik wie Gates, Kostenrechnung, Chunking), **Contract** (der Kern
publiziert sein OpenAPI-Schema; `packages/contracts` generiert daraus die
TypeScript-Typen – Schema-Drift zwischen Backend und Frontends bricht den
Build, nicht die Demo), **E2E** (Playwright-Kernflüsse je Modul, z. B. Idee →
Gate-Freigabe → Story-Übernahme), und als KI-spezifische vierte Ebene
**Agent-Evals**: promptfoo/DeepEval-Testfälle je Agent (Erwartungen an
Struktur, Groundedness, Verbotenes) laufen als eigener CI-Job gegen ein kleines
lokales Modell – Prompt-Änderungen sind damit regressionsgetestet wie Code.
Die bewährte Testkonzept-Konvention (`tests/<task-id>/testkonzept.md`,
Definition of Done) gilt unverändert in allen Modulen.

### Sicherheit & Compliance

Keine Secrets im Repo (`.env` + `.env.example`, in CI GitHub Secrets);
Dependabot/Renovate für Abhängigkeits-Updates; CodeQL-Scanning für den Code und
Trivy-Scan der Docker-Images als CI-Jobs; Rollenmodell (Admin/User/Auditor)
über Keycloak mit Berechtigungsprüfung im Kern statt im Frontend; das
Audit-Log ist append-only und die Auditor-Rolle kann lesen, aber nichts ändern
– eine kleine, aber sehr erzählbare Governance-Entscheidung (BAIT/MaRisk lassen
grüßen). Ein `SECURITY.md` und Lizenz-Hygiene (License-Check der Dependencies)
runden das Open-Source-Bild ab.

### Observability

Strukturierte JSON-Logs mit Korrelation (Request-Id, Run-Id) im Kern;
Prometheus-Metriken aus FastAPI (Latenz, Fehlerraten, Gateway-Tokens/Kosten als
Counter); Grafana mit zwei vorkonfigurierten Dashboards (Plattform-Gesundheit,
Modell-/Kostenmetriken) im `monitoring`-Compose-Profil. Der Leitstand
(Fach-Dashboard) und Grafana (Betriebs-Dashboard) bleiben bewusst getrennt –
auch das eine Architekturentscheidung, die man im Gespräch begründen kann.

## Bausteine-Landkarte: was du wo lernst (und erzählen kannst)

| Baustein | Was du dabei lernst | Munition fürs Gespräch |
|---|---|---|
| Kern vs. Module + Modul-Vertrag | Plattform-Architektur, Schnittstellen-Design, Conway's Law | „Warum ist Login kein Modul?" – souverän beantwortbar |
| Model Gateway (Ollama/Azure-Switch) | Provider-Abstraktion, Adapter-Pattern, Kosten-/Latenz-Trade-offs | „Wie würdet ihr Vendor-Lock-in vermeiden?" |
| HITL-Gates + Vorschlags-Inbox | Agentic Patterns, Human-in-the-Loop, Provenienz | EU-AI-Act-/BAIT-Anschlussfähigkeit – dein Deka-Differenzierer |
| Keycloak + RBAC | OIDC/JWT, Rollen, Token-Flows | „Wie setzt du Authentifizierung um?" mit echtem Setup statt Theorie |
| Alembic + Seeds + Compose-Profile | Datenbank-Lifecycle, Migrationsdisziplin, reproduzierbare Umgebungen | „Wie deployt ihr Schemaänderungen?" |
| Monorepo-CI mit Pfadfiltern + GHCR | Build-Systeme, Artefakt-Denken, Release-Engineering | „Wie sieht eure Pipeline aus?" – du hast eine gebaut |
| Contract-Tests aus OpenAPI | API-First, Schema-Drift, generierte Typen | „Wie verhindert ihr Breaking Changes zwischen Teams?" |
| Agent-Evals in CI | LLM-Qualitätssicherung, Regressionstests für Prompts | Das können 2026 die wenigsten Bewerber zeigen |
| Prometheus/Grafana + strukturierte Logs | Observability, SLI-Denken | „Woher weißt du, dass es läuft?" |
| Telemetrie & Kosten (Cost-Mapper im Kern) | FinOps für KI, Token-Ökonomie | Direkte Brücke zu deinem echten Azure-Cost-Projekt |
| IDP-Modul aus der Thesis | Wiederverwendung, Produktisierung von Forschung | „Von der Bachelorarbeit zum Plattform-Modul" – starke Story |
| ADRs + PRDs + Backlog im eigenen Tool | Product-/Architektur-Dokumentation | Du planst die Plattform mit ihrem eigenen PM-Modul – Dogfooding |

Die Reihenfolge der Roadmap ist zugleich der Lernpfad: erst Architektur- und
Container-Grundlagen (v0.1), dann Agentic Engineering (v0.2), dann
Enterprise-Security (v0.3), dann Observability/Governance (v0.4) – jede
Bewerbungsrunde kannst du mit dem jeweils neuesten Baustein bestreiten.

## Roadmap (Releases des Gesamtsystems)

- **v0.1 – Foundation:** Monorepo, Kern-Skeleton (FastAPI, Postgres, Alembic),
  Ein-Befehl-Installation (`docker compose up` mit Profilen, Healthchecks,
  Seeds), Monorepo-CI mit Pfadfiltern + Image-Push (GHCR), Model Gateway mit
  Ollama, Telemetrie-Schreibpfad, `monitoring`-Profil (Prometheus/Grafana
  Basis); PM Studio als erste App eingezogen (unverändert lauffähig).
- **v0.2 – Erster echter Agent:** PM-Studio-Planungsagent (Entwurf →
  Requirements → Story-Vorschläge) läuft über Runtime + Gateway statt Mock;
  die Vorschlags-Inbox aus PMS-TASK-060 wird produktiv. HITL-Gates im Kern.
- **v0.3 – Identity & Audit:** Keycloak, Rollen Admin/User/Auditor, zentrales
  Audit-Log; PM Studio „My Work" nutzt echte Identität.
- **v0.4 – Leitstand v1:** Governance-Dashboard über Kern-Telemetrie (Modelle,
  Tokens, Kosten, Läufe, Gate-Entscheidungen).
- **v0.5 – IDP-Modul v1:** Thesis-Pipeline hinter dem Kern, Upload-UI,
  Ergebnisse mit Provenienz und Audit; Eval-Harness v1 mit Testfällen für IDP
  und PM-Agent.
- **v0.6+ – RAG-Modul, Flow-Modul,** danach Fernziele nach Bedarf.

## Portfolio-Erzählung

„Ich habe eine modulare Enterprise-AI-Plattform entworfen und gebaut: ein
lokal-first Kern (FastAPI, Ollama, Keycloak, Postgres) mit Model Gateway,
Telemetrie, Audit und HITL-Agent-Runtime – darauf gleichrangige Fachmodule, von
denen zwei produktiv sind: ein agentisches Projektmanagement-Studio und eine
Dokumentenverarbeitungs-Pipeline aus meiner Bachelorarbeit. Jede
Architekturentscheidung ist als ADR dokumentiert, jedes Modul erfüllt denselben
Vertrag (zentrale Identität, ein Modellzugang, Audit-Pflicht, Vorschläge statt
Direktschreiben), und die Plattform wurde mit ihrem eigenen PM-Modul geplant."

Das Projekt bleibt dabei, was es ist: Lernplattform, Portfolio und
Experimentierumgebung – aber mit einer Architektur, die man einem
Enterprise-Architekten vorlegen kann, ohne sich zu entschuldigen.
