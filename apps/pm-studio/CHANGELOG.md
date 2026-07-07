# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden hier dokumentiert.
Format angelehnt an [Keep a Changelog](https://keepachangelog.com/de/1.1.0/).
Versionsschema laut `CLAUDE.md`: `v0.1.0` = M1 … `v0.5.0` = MVP (M5), `v1.0.0` = M8.

## [0.5.0] – 2026-06-15 – Meilenstein 5: PM-Kern (MVP)

Ein komplettes Dummy-Projekt ist durchgängig verwaltbar – **MVP (M1–M5) fertig.**

### Added
- **Kanban-Board** `/board`: Spalten Backlog / To Do / In Progress / Review / Testing /
  Done mit Spalten-Zählern, Drag&Drop inkl. Tastatur-Support (`@dnd-kit/core`,
  `@dnd-kit/sortable`) und Persistenz im Zustand-Store (TASK-008).
- **TaskCard** (Titel, Projekt, Story-Referenz, Schätzung, Prioritäts-Badge,
  Assignee-Platzhalter), **TaskDialog** zum Ansehen/Bearbeiten (Titel, Beschreibung,
  Spalte, Priorität) und **Projektfilter** über dem Board (TASK-008).
- Backlog-Aktion **„In Board übernehmen"**: erzeugt aus einer User Story einen Task
  in Backlog, Duplikate werden verhindert (TASK-008).
- Playwright-Tests (`e2e/board.spec.ts`) für Rendering, Drag&Drop-Persistenz über
  Reload und Projektfilter; Testkonzept in `tests/task-008/`.

## [0.4.0] – 2026-06-15 – Meilenstein 4: Agenten-System als UI

Pipeline visuell nachvollziehbar, Agenten-Status live (simuliert).

### Added
- **Agenten-Übersicht** `/agents`: 10 Agenten-Karten (Icon, Rolle, Status), Detailseite
  mit Tabs (Beschreibung, Run-Historie, letzter Output), Run-Simulation
  (`idle → running → success`) und Output-Sheet (TASK-005).
- **Workflow-Visualisierung** `/workflows`: React-Flow-Canvas der Standard-Pipeline
  Input → Draft → Requirements → Scrum → PO → Risk → Review → Output, Custom Nodes
  mit StatusBadge, Dark-Theme, animierte Kanten bei `running`, Button
  „Pipeline simulieren" (sequenzieller Lauf links→rechts), Klick auf Knoten öffnet
  Side-Sheet mit Link zur Agenten-Detailseite (TASK-006).
- Playwright-Setup (`e2e/`, `npm run test:e2e`) mit Smoke-Test für die Workflow-Seite (TASK-006).
- `docs/agent-system.md`: HITL-Schritt-Lebenszyklus, Review-Aktionen, Workflow-Typen,
  Datenmodell `WorkflowDefinition`/`WorkflowRun`, Artefakt-zentrierte Zusammenarbeit
  (Konversation, Versionierung, Downstream-Konsistenz). Roadmap M7/M8 angepasst;
  TASK-012..016 als Stubs angelegt.

### Changed
- Workflow-Automatisierung: nach grünem lokalen Gate (inkl. E2E bei UI-Tasks) folgen
  Push → PR → CI-Wartezeit → Merge inkl. Branch-Löschung automatisch; ist damit ein
  Meilenstein abgeschlossen, läuft der Release-Flow direkt weiter.
  `.claude/settings.json` mit Permission-Allowlist + `acceptEdits`.

## [0.3.0] – 2026-06-12 – Meilenstein 3: Projektideen-Workflow

Flow „Idee → Entwurf → Anzeige" ist durchgängig klickbar.

### Added
- Validiertes **Projektideen-Formular** (zod + react-hook-form) mit Persistenz im
  Zustand-Store (localStorage) und **Projektliste** (TanStack Table, sortierbar) (TASK-004).
- **Mock-Agenten-Pipeline** hinter dem `AgentService`-Interface: aus einer Idee
  entstehen deterministisch Draft, Requirements, Backlog und Risiken; Läufe/Artefakte
  in den Stores. `getAgentService()` als einzige Naht (API-Tausch ohne UI-Änderung) (TASK-009).
- **Projektdetailseite** `/projects/[id]` mit „Pipeline ausführen (Simulation)",
  Tabs (Entwurf/Requirements/Backlog/Risiken), sortierbarer Risikotabelle und
  Empty-States (TASK-007).
- **Redesign der Detailseite** (TASK-007b): kompakter Header mit einklappbarer
  Beschreibung, immer sichtbarer **Pipeline-Stepper**, horizontale Line-Tabs mit
  primary-Indikator, neuer **Übersicht**- (Default) und **Idee**-Tab.

### Changed
- Tab-Komponente nutzt den Design-Token-`primary`-Indikator statt der grauen
  `bg-muted`-Leiste.
- Workflow-Regel: vor dem Push manuelle Freigabe des Nutzers; Release-Prozess um
  einen GitHub-Release-Schritt erweitert.

### Added (Geplant)
- `TASK-011` (Dashboard – Live-Daten) angelegt, eingeplant nach M5.

## [0.2.0] – 2026-06-11 – Meilenstein 2: Dashboard

### Added
- Dashboard mit Metrik-Karten, Agenten-Aktivitäts-Feed, Status-Grid und
  Projektfortschritt aus typisierten Dummy-Daten (TASK-003).
- Zentrale Domänen-Typen (`src/types`) und `StatusBadge` als einzige
  Status-Farbquelle (TASK-003).
- Test-Setup: Vitest + React Testing Library (`npm run test`) sowie die
  Konvention `tests/<task-id>/` mit `testkonzept.md` (TASK-003).
- Dashboard-Charts mit Recharts (über shadcn Chart): Sparklines in den
  MetricCards, Sprint-Burndown mit Ideallinie, Task-Status-Donut,
  Velocity-Balken und horizontale Agentenlauf-Balken (TASK-003b).
- `useReducedMotion`-Hook; Chart-Farben ausschließlich aus Design-Tokens.

### Changed
- Dashboard-Stub durch das vollständige, datengetriebene Dashboard ersetzt.

## [0.1.0] – 2026-06-11 – Meilenstein 1: Projektgrundlage

### Added
- Next.js (App Router) mit TypeScript (strict), Tailwind und ESLint (TASK-001).
- Dunkles Theme, Design-Tokens und Schriften (Inter, JetBrains Mono) (TASK-001).
- shadcn/ui-Basis: `button`, `card`, `badge`, `sheet`, `command`, `tooltip`,
  `separator` (+ `dialog`, `input`, `textarea`, `input-group` als Abhängigkeiten).
- App-Shell in der Route-Gruppe `(dashboard)`: feste 240px-Sidebar, Top-Command-Bar
  und max-width Content-Bereich (TASK-002).
- Navigation (Overview / Projects / Agents / Delivery) aus einer typisierten Quelle
  (`src/lib/navigation.ts`), aktiver Zustand via `usePathname()` (TASK-002).
- ⌘K/Ctrl+K-Command-Palette und mobile Sidebar als `Sheet` (< md) (TASK-002).
- 7 Routen-Stubs mit `PageHeader`: Dashboard, Projects, New Idea, Agents,
  Workflows, Board, Sprints (TASK-002).
- CI-Pipeline (GitHub Actions): Lint, Typecheck, Test, Build bei PRs nach `dev`/`main`.

### Changed
- Smoke-Test-Startseite durch den Dashboard-Stub in der `(dashboard)`-Gruppe ersetzt (TASK-002).
