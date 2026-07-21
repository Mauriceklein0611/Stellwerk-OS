---
module: pm-studio
type: doc
status: current
updated: 2026-07-08
imported: 2026-07-08
source: projectmind-os
---

# Architektur

## Architekturentscheidung

**Phase 1 (MVP):** Reine Next.js-App. Alle Daten als typisierte Dummy-Daten + Zustand-Store, Persistenz via localStorage. Kein Backend nötig → maximaler Lernfokus aufs Frontend.

**Phase 2 (KI):** Separates FastAPI-Backend (`/backend`) für Agenten. Begründung: Das KI-Ökosystem (LangGraph, Ollama-Clients, ChromaDB) ist Python-first, und Python-Kenntnisse sind bereits vorhanden. Next.js spricht das Backend über eine REST-API an, Agentenstatus später via WebSocket/SSE.

```
┌────────────────────────────┐
│  Next.js (UI, Boards,      │
│  Workflow-Visualisierung)  │
└─────────────┬──────────────┘
              │ REST / SSE
┌─────────────▼──────────────┐
│  FastAPI (Agent-Runner,    │
│  Orchestrierung, Persistenz│
│  SQLite → PostgreSQL)      │
└─────────────┬──────────────┘
              │
┌─────────────▼──────────────┐
│  Ollama (Qwen 2.5 7B)      │
│  ChromaDB (Embeddings)     │
└────────────────────────────┘
```

## Ordnerstruktur (Repository)

```
agentic-pm-studio/
├── docs/                  # Projektdokumentation
├── tasks/                 # Task-Dateien
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── (dashboard)/   # Layout-Gruppe mit Sidebar
│   │   │   ├── page.tsx           # Dashboard
│   │   │   ├── projects/          # Projektliste + [id]
│   │   │   ├── ideas/new/         # Projektideen-Formular
│   │   │   ├── agents/            # Agenten-Übersicht
│   │   │   ├── workflows/         # Workflow-Builder/-Ansicht
│   │   │   ├── board/             # Kanban
│   │   │   └── sprints/           # Sprints, Reviews, Retros
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/            # shadcn/ui-Komponenten (generiert)
│   │   ├── layout/        # Sidebar, CommandBar, PageHeader
│   │   ├── dashboard/     # MetricCard, ActivityFeed, StatusGrid
│   │   ├── agents/        # AgentCard, AgentStatusBadge, AgentOutput
│   │   ├── board/         # KanbanColumn, TaskCard
│   │   └── workflow/      # FlowCanvas, AgentNode
│   ├── lib/               # Utils, Formatter, cn()
│   ├── store/             # Zustand-Stores (projects, agents, board)
│   ├── types/             # Zentrale Domänen-Typen
│   └── data/              # Dummy-Daten (typisiert, eine Datei pro Domäne)
├── backend/               # ab Meilenstein 6 (FastAPI)
└── e2e/                   # Playwright-Tests
```

## Domänenmodell (Kern-Typen)

`Project`, `ProjectIdea`, `ProjectDraft`, `Requirement`, `Epic`, `UserStory`, `Sprint`, `Task` (Board), `Risk`, `Agent`, `AgentRun`, `AgentOutput`, `Retrospective`, `Review`.

**Hierarchie Epic → Story → Task (ab TASK-037):** Eine `UserStory` wird in
konkrete Dev-Aufgaben zerlegt. Diese Aufgaben sind **Board-Tasks mit `storyId`**
(kein eigenes Entity) – so liegen sie als „eine Quelle" im `useBoardStore` und
sind sofort in Board, Sprint, Filtern und Velocity nutzbar. Reine Helfer in
`src/lib/story-tasks.ts` (`tasksForStory`, `storyTaskRollup`, `detachStoryTasks`)
liefern die Selektion und das Roll-up (konsistent zu `isStoryDone`, TASK-021).
Verschwindet eine Story (Projekt gelöscht oder Backlog neu generiert), entkoppelt
`useProjectStore` ihre Tasks (`detachStory`), statt sie verwaisen zu lassen.
Diese Story→Task-Ebene ist der **Andockpunkt für Agenten** (Tasks automatisch aus
Stories ableiten) und Testautomation (Tasks als ausführbare Einheiten).

**Backlog & Risiken als Store-Entitäten (ab TASK-056/061):** Epics/Stories
(`useBacklogStore`, `pm-studio-backlog`) und das Risikoregister (`useRiskStore`,
`pm-studio-risks`) sind **erstklassige, CRUD-bare Collections** statt Felder im
Agenten-Artefakt. Sie existieren **ohne Pipeline** (manuell anleg-/pflegbar), und
ein Agentenlauf **ergänzt statt ersetzt**: `importBacklog`/`importRisks` sind
**additiv & idempotent** über die Artefakt-Ids und überschreiben von Hand
bearbeitete Einträge nie. Das Artefakt (`ProjectArtifacts.backlog`/`.risks`)
bleibt nur noch **Run-Snapshot**; die UI liest/schreibt in den Stores. Beide
Stores sind **zyklusfrei**: sie importieren **nicht** `useProjectStore` (das sie
für die `removeIdea`-Kaskade importiert), die einmalige Übernahme der Alt-Artefakte
(`migrateFromArtifacts`, Flag-geschützt) liest `pm-studio-projects` **direkt aus
localStorage** in einem `queueMicrotask` (hydrationsreihenfolge-unabhängig).
Projekt-Löschen kaskadiert in beide (`removeProjectItems`/`removeProjectRisks`),
Safe-Delete-Undo snapshottet beide Slices mit.

**Konfigurierbare Board-Phasen & Done-Semantik (ab TASK-032):** Die Kanban-Spalten
sind frei definierbar (`BoardColumnDef` im `useBoardColumnsStore`, einzige Quelle
für Reihenfolge/Label/Status/WIP). „Abgeschlossen" hängt nicht mehr an einem festen
Spaltennamen, sondern am **`isTerminal`-Flag** der Phase. Alle Kennzahlen leiten
„erledigt" über `terminalColumnIds`/`isTerminalColumn` (`src/lib/board.ts`) ab:
`doneAt`-Stempel (`useBoardStore.stampDone`), Burndown (`sprintBurndown`), Velocity/
Sprintfortschritt (`isStoryDone`/`sprintProgress`, `storyTaskRollup`), Überfällig
(`isOverdue`) und Projektfortschritt/Donut (`dashboard-selectors`). So bleiben die
Metriken korrekt, auch wenn Teams ihren Flow umbauen; mind. eine terminale Phase
ist erzwungen. Helfer defaulten auf die Standard-Terminal-Id (`done`).

**Activity Feed & Decision Log (ab TASK-043):** Jede relevante Änderung wird als
`ActivityEvent { entityType, entityId, kind (create|update|delete|review|run),
summary, actor (human|agent), createdAt }` festgehalten – nachvollziehbar je
Entität (Project/Task/Sprint/Release). Geschrieben wird **zentral, append-only**
über genau einen Pfad: `useActivityStore.log` (Wrapper `logActivity`). Der
Activity-Store ist ein **Leaf** (importiert keine andere Store-Datei), daher rufen
die Mutations-Actions der Domänen-Stores `logActivity(...)` gefahrlos **außerhalb**
ihres `set`-Updaters auf – kein Modul-Init-Zyklus, Updater bleiben rein. **Granularität
bewusst gewählt** (gegen Feed-Rauschen): `create`/`delete` für alle vier Entitäten,
`update` nur für **bedeutsame** Änderungen (Task-Spaltenwechsel, Sprint-/Release-Update);
reine Feldedits, Reorder und Cascade-Detaches erzeugen **kein** Event. Reads sind reine,
gefilterte Selektoren (`eventsForEntity`, neueste zuerst). Parallel hält der
`useDecisionStore` menschliche `Decision`s (Kontext/Wahl/Begründung + optionaler
`relatedEntity`-Bezug). Beide sind das Fundament für spätere Agenten-Reviews (HITL,
`review`/`run`-Kinds sind reserviert). UI: `ActivityFeedPanel`/`DecisionLogPanel`,
eingebettet in Project-Tab, Task-/Sprint-/Release-Dialog.

**Orchestrierung / HITL (ab M7, Konzept siehe `docs/agent-system.md`):**
`WorkflowDefinition` (Vorlage: geordnete Schritte + Gate-Konfiguration, vom Builder erzeugt/editiert) vs. `WorkflowRun` (konkrete Ausführung: Status je Schritt, Artefakte, Review-Entscheidungen, Zeitstempel). Dazu `Provenance` (`agent | human_edited`), `ArtifactVersion` (versionierte Artefakte mit Urheber + Änderungskommentar) und `AgentConversation` (dialogfähige Agenten). Diese Trennung erlaubt, Definition und Lauf unabhängig zu speichern und den Builder (M8) sauber an die Definition zu binden.

Regel: **Alle** Dummy-Daten und späteren API-Responses nutzen exakt diese Typen aus `src/types/`. Die Typen sind der Vertrag zwischen Frontend und späterem Backend (im Backend gespiegelt als Pydantic-Modelle).

## Datenfluss im MVP

UI-Event → Zustand-Store-Action → Store-Update → React-Rerender. Persistenz: `zustand/middleware persist` (localStorage). Agentenläufe werden im MVP durch deterministische Mock-Funktionen simuliert (`src/data/mock-agent-outputs.ts`), damit der spätere Tausch gegen echte API-Calls nur die Datenquelle ändert, nicht die UI.

## Architekturprinzipien

1. Server Components als Default, `"use client"` nur bei Interaktivität
2. Feature-Ordner statt Riesen-Komponenten; eine Komponente = eine Verantwortung
3. Keine Business-Logik in Komponenten → `lib/` oder Store
4. Mock-Datenquelle hinter Interface (`AgentService`) kapseln → später 1:1 gegen REST tauschbar
