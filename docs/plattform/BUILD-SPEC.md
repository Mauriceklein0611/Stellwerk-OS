---
module: platform
type: guide
status: current
updated: 2026-07-05
---

# Stellwerk BUILD-SPEC – verbindlicher Bauplan für Claude Code (Opus 4.8)

## 0. Wie dieses Dokument zu benutzen ist

Dieses Dokument ist die **einzige Wahrheit für den Aufbau** des
Stellwerk-Monorepos (Release v0.1.0 „Foundation"). Es konsolidiert drei
Konzeptdokumente (`vision.md`, `arbeitssystem.md`, PM-Studio-Review) und löst
deren Widersprüche auf (Abschnitt 2). Arbeitsregeln stehen in `CLAUDE.md` –
bei Widerspruch zwischen BUILD-SPEC und CLAUDE.md gilt CLAUDE.md, bei
Widerspruch zwischen BUILD-SPEC und Nutzeranweisung: nachfragen.

Arbeitsmodus für Claude Code:
1. Bootstrap einmalig ausführen (Abschnitt 3, `scripts/bootstrap-github.sh`).
2. Danach IMMER: genau EIN Issue ziehen (Board-View „Ready" bzw.
   `gh issue list`), umsetzen nach CLAUDE.md, PR mit `Closes #N`, nächstes Issue.
3. Die Issue-Reihenfolge in Abschnitt 5 ist topologisch sortiert –
   Abhängigkeiten stehen im jeweiligen Issue-Body und sind verbindlich.
4. Nichts bauen, was nicht durch ein Issue gedeckt ist. Nebenbefunde →
   neues Issue mit Label `triage`, nicht umsetzen.

## 1. Zielbild v0.1.0 (Definition of Done des Releases)

Ein frischer Klon führt aus: `cp .env.example .env && make up` – und erhält:
- laufenden Kern (FastAPI, `/healthz` grün, OpenAPI unter `/docs`)
- Postgres mit Alembic-Migrationen und Seed-Daten
- Model Gateway mit zwei Providern (Ollama lokal, Stub deterministisch),
  jeder Aufruf erzeugt einen Telemetrie-Datensatz (Modell, Tokens, Kosten, Latenz)
- PM Studio unter `apps/pm-studio` unverändert lauffähig (localStorage-Modus)
- `monitoring`-Profil: Prometheus + Grafana mit Basis-Dashboard
- CI: Pfadgefilterte Pipeline (TS- und PY-Gates, Docker-Builds), Security-Scans,
  Contract-Pipeline (OpenAPI → TS-Typen, Drift bricht Build)
- GitHub Release v0.1.0 mit gepushten Images (GHCR) und CHANGELOG-Abschnitt

## 2. Verbindliche Entscheidungen (konsolidiert, Widersprüche aufgelöst)

| # | Entscheidung | Auflösung / Begründung |
|---|---|---|
| ADR-001 | Name **Stellwerk** | Arbeitstitel; überall so verwenden |
| ADR-002 | **GitHub Issues + Projects** führend | Jira höchstens später als unidirektionaler Spiegel; PM Studio erst Phase 3 (Dogfooding) |
| ADR-003 | **ID-System:** Issue-Nummer = Task-ID, Modul via Titel-Präfix `[CORE]`/`[PMS]`/… + Label `module:*` | Ersetzt die in der Vision genannten Nummernkreise `PMS-TASK-###` (galten für die Task-Datei-Welt; im Ticket-System überflüssig). ADRs behalten Modul-Präfixe (`ADR-###` platform, `CORE-ADR-###` …) |
| ADR-004 | **Versionierung:** neues Repo startet bei Plattform-`v0.1.0` | PM-Studio-Tags v0.1–v0.5 bleiben im Alt-Repo (wird archiviert, Link im README). Kein Tag-Import, keine Doppelzählung |
| ADR-005 | **Phase-0-Abgrenzung:** PM-Studio-Welle TASK-056–066 läuft im Alt-Repo zu Ende | Der Einzug (Issue #10) importiert den jeweils aktuellen `dev`-Stand; Backlog-Refactor ist KEINE Voraussetzung für v0.1.0 |
| ADR-006 | **CI ruft nie echte LLMs.** Gateway hat `STUB`-Provider (deterministisch, injizierbare Antworten); alle Tests laufen gegen Stub | Ollama im CI wäre langsam/flaky. Agent-Evals (promptfoo/DeepEval) sind ein separater, manuell/nightly startbarer Job – ab v0.2, nicht v0.1 |
| ADR-007 | **Dev-Auth-Stub statt Keycloak in v0.1** | Kern hat ein `AuthProvider`-Interface; v0.1 liefert `DevAuth` (statischer Nutzer, Rolle aus Header/Env). Keycloak = v0.3, blockiert so nichts |
| ADR-008 | **Python-Stack Kern:** FastAPI + SQLAlchemy 2 + Alembic + Pydantic v2; **uv** als Paketmanager; ruff + mypy + pytest | Ein Standard, keine Diskussion pro Issue |
| ADR-009 | **Monorepo-Tooling schlank:** npm workspaces (kein Nx/Turbo in v0.1), Pfadfilter in CI statt Build-Graph | Overengineering-Grenze; Wechsel später möglich |
| ADR-010 | **Docs as Code** mit YAML-Frontmatter (`module,type,status,updated`) in jeder Datei unter `docs/` | RAG-Vorbereitung; `status: frozen` für Alt-Dokumente |

## 3. Bootstrap (einmalig, vor dem ersten Issue)

1. Neues GitHub-Repo `stellwerk` (privat ok), `main` + `dev` anlegen,
   Branch-Protection: PRs only, CI required.
2. Dieses Paket ins Repo-Root entpacken: `CLAUDE.md`, `.github/`, `docs/`
   (Konzeptdokumente aus dem Chat: `vision-stellwerk.md` →
   `docs/platform/vision.md`, `arbeitssystem-v2-tickets-doku.md` →
   `docs/platform/arbeitssystem.md`; Frontmatter ergänzen), `scripts/`,
   dieses BUILD-SPEC.md → `docs/platform/build-spec.md`.
3. `bash scripts/bootstrap-github.sh` ausführen: legt Labels, Milestone
   „v0.1 Foundation" und die zwölf Start-Issues (Abschnitt 5) aus `issues/` an.
4. GitHub Project „Stellwerk" (Projects v2) manuell anlegen: Status-Feld
   (Backlog/Ready/In Progress/In Review/Done), Views „Ready" + je Modul;
   Workflow „Auto-add to project" aktivieren. (UI-Schritt, nicht scriptbar
   ohne zusätzliche Scopes – als Teil von Issue #2 verifizieren.)
5. Erstes Issue ziehen: #1.

## 4. Ziel-Repostruktur (nach v0.1.0)

```
stellwerk/
├── CLAUDE.md · README.md · CHANGELOG.md · SECURITY.md · LICENSE
├── Makefile · docker-compose.yml · compose.prod.yml · .env.example
├── .github/ (ISSUE_TEMPLATE/task.yml, workflows/ci.yml, dependabot.yml)
├── apps/pm-studio/            ← importierter Next.js-Stand (eigene package.json)
├── services/core/             ← FastAPI: app/ (api, gateway, telemetry, auth, db), alembic/, tests/, pyproject.toml, Dockerfile
├── packages/contracts/        ← aus OpenAPI generierte TS-Typen (npm workspace)
├── docs/platform/ · docs/core/ · docs/pm-studio/ (Alt-Doku, frozen) · docs/runbooks/
├── monitoring/ (prometheus.yml, grafana/provisioning + dashboard.json)
├── scripts/ (bootstrap-github.sh, seed.py, export-issues.sh)
└── tests/ → liegt je Workspace: apps/pm-studio/tests bleibt wie im Alt-Repo (tests/, e2e/); Kern-Tests in services/core/tests; issue-bezogene Testkonzepte unter tests/issue-###/ im jeweiligen Workspace
```

## 5. Issue-Backlog v0.1 (Reihenfolge = Abarbeitungsreihenfolge)

| # | Titel | Modul | Größe | Hängt ab von |
|---|---|---|---|---|
| 1 | [PLATFORM] Monorepo-Grundgerüst & Doku-Umzug | platform | M | – |
| 2 | [PLATFORM] GitHub-Arbeitssystem verifizieren (Board, Automation, Templates) | platform | S | 1 |
| 3 | [CORE] FastAPI-Skeleton: App-Factory, /healthz, Settings, Logging | core | M | 1 |
| 4 | [CORE] Postgres + SQLAlchemy + Alembic + Seed-Skript | core | M | 3 |
| 5 | [PLATFORM] Compose-Profile + Multi-Stage-Dockerfiles + Makefile | platform | M | 3,4 |
| 6 | [CORE] Model Gateway v1 (Provider-Interface, Ollama + Stub) | core | L | 3 |
| 7 | [CORE] Telemetrie: Gateway-Calls → tokens/costs/latency in DB + /metrics | core | M | 4,6 |
| 8 | [PLATFORM] Monorepo-CI: Pfadfilter, TS+PY-Gates, Docker-Builds, GHCR | platform | L | 1,3,5 |
| 9 | [PLATFORM] Security-Basis: Dependabot, CodeQL, Trivy, SECURITY.md | platform | S | 8 |
| 10 | [PMS] PM Studio als Workspace-App einziehen (CI grün, unverändert lauffähig) | pms | M | 1,8 |
| 11 | [CORE] Contract-Pipeline: OpenAPI-Export → packages/contracts, Drift-Check in CI | core | M | 3,8 |
| 12 | [PLATFORM] Monitoring-Profil (Prometheus/Grafana) + Release v0.1.0 | platform | M | 5,7,8,9,10,11 |

Vollständige Issue-Bodies (Ziel, Kontext, technische Anforderungen,
Akzeptanzkriterien) liegen in `issues/issue-01.md` … `issue-12.md` und werden
vom Bootstrap-Skript 1:1 angelegt. Sie sind Teil dieser Spezifikation.

## 6. Ausblick v0.2 (nur Kontext, NICHT in v0.1 bauen)

Agent Runtime (LangGraph) mit HITL-Gates im Kern; PM-Studio-Planungsagent über
Gateway statt Mock; Vorschlags-Inbox produktiv; Agent-Evals als CI-Nightly.
Issues dafür werden erst nach dem v0.1.0-Release geschnitten.

## 7. Nicht-Ziele (verbindliche Grenzen für v0.1)

Kein Kubernetes, kein Multi-Tenant, kein Keycloak (ADR-007), keine echte
LLM-Nutzung in CI (ADR-006), kein Nx/Turborepo (ADR-009), keine Änderungen an
PM-Studio-Features beim Einzug (Issue #10 ist reiner Umzug), kein RAG/kein
Chroma in v0.1, keine Jira-Anbindung.
