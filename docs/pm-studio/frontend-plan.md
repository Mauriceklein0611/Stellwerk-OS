---
module: pm-studio
type: doc
status: frozen
imported: 2026-07-08
source: projectmind-os
---

# Frontend-Plan

## Stack-Entscheidung & Begründung

| Wahl | Statt | Warum |
|---|---|---|
| Next.js App Router | Vite+React | Routing, Layouts, später API-Routes als Proxy, Industriestandard |
| Zustand | Redux | Deutlich weniger Boilerplate, ausreichend für Single-User-App, leichter zu lernen |
| shadcn/ui | MUI/Ant | Komponenten liegen im eigenen Code → maximaler Lerneffekt, perfekt für eigenes Design-System |
| React Flow | eigene SVG-Lösung | Ausgereift, MIT-Lizenz, ideal für Agenten-Workflows |
| Recharts (via shadcn Chart) | eigene SVG-Charts | shadcn-integriert, MIT, über Design-Tokens themebar (Dashboard-Charts, TASK-003b) |
| TanStack Table | eigene Tabellen | Sortierung/Filter wie in PM-Tools ohne Eigenbau |
| Vitest + RTL | Jest | Schneller, native ESM/TS-Unterstützung |
| Playwright | Cypress | Bessere Performance, Multi-Browser, kostenlos parallelisierbar |

## Seiten & Routen

| Route | Inhalt | Meilenstein |
|---|---|---|
| `/` | Dashboard | M2 |
| `/ideas/new` | Projektideen-Formular | M3 |
| `/projects` | Projektliste (TanStack Table) | M3 |
| `/projects/[id]` | Projektzentrale: Übersicht, Idee, Entwurf, Requirements, **Backlog-Verweis** (Rollup + Deep-Link nach `/backlog`, TASK-061), Risiken (Store-Entitäten), Verlauf | M5 |
| `/agents` | Agenten-Übersicht (Karten + Status) | M4 |
| `/agents/[id]` | Agentendetail + letzte Läufe/Outputs | M4 |
| `/workflows` | Workflow-Visualisierung (React Flow) | M4 |
| `/board` | Kanban-Board | M5 |
| `/sprints` | Sprintübersicht, Reviews, Retros | M5 |
| `/sprints/[id]` | Sprint-Detailseite: Kopf (Ziel/Zeitraum/Fortschritt/Burndown) + klickbare Story-/Task-Liste (öffnet `TaskDialog`) (TASK-053) | 5++ |
| `/ceremonies` | Ceremonies-Bereich: historische Review-/Retro-Liste + „Neue Review/Retro"-Flow mit Scope (TASK-054) | 5++ |
| `/releases` | Releases verwalten + automatische Sprint-Generierung | 5++ |
| `/my-work` | „Meine Aufgaben": Person-Auswahl + zugewiesene/offene/überfällige Tasks (TASK-042) | 5++ |

## Komponentenrichtlinien

- shadcn/ui-Basis: Button, Card, Badge, Dialog, Tabs, Table, Input, Textarea, Select, Tooltip, Sheet, Command
- Eigene Komposit-Komponenten immer in Feature-Ordnern, Props strikt typisiert
- Status-Badges zentral: `<StatusBadge status={...}/>` mit gemapptem Farbschema (siehe Design-System)
- Loading-/Empty-/Error-States für jede Liste von Anfang an mitdenken

## State-Konzept (Zustand)

- `useProjectStore`: Projekte, Ideen, Entwürfe, Requirements
- `useBoardStore`: Tasks, Drag&Drop-Status
- `useBoardColumnsStore` (TASK-032): konfigurierbare Board-Phasen als Daten
  (`BoardColumnDef`), persist `pm-studio-board-columns`. **Einzige Quelle** für
  Phasen-Reihenfolge/Label/Status-Akzent/WIP; ersetzt die statischen Konstanten
  in `src/lib/board.ts` (dort nur noch `DEFAULT_BOARD_COLUMNS`). CRUD über den
  `ColumnManager`; Löschen verschiebt Tasks per `useBoardStore.reassignColumn`
- Filterung von Board & Sprintansicht über reine Funktionen in
  `src/lib/board-filters.ts` (`filterBoardTasks`, `storyMatchesFilter`,
  `sprintStatusMatches`) + generische `FilterBar` (`src/components/common/`);
  Filterstate lokal je Seite (TASK-022)
- Board-Ansichtswechsel Kanban ↔ Scrum-Liste (`BoardViewToggle`,
  `BoardListView` als TanStack-Grid, Zeilen aus `src/lib/board-rows.ts`); die
  Auswahl `view` liegt persistiert im `useBoardStore` (TASK-023)
- Inline-Editing der Listenansicht (TASK-030): wiederverwendbare Zellen
  `EditableTextCell`/`EditableSelectCell` (`src/components/board/cells/`) für
  Titel/PT (Inline-Feld) bzw. Status/Priorität/Assignee/Sprint (Dropdown);
  Speichern via `updateTask`/`assignStory`, Handler über die TanStack-`meta`.
  Zellklick editiert (Propagation gestoppt), übrige Zeile öffnet den `TaskDialog`
- Swimlanes (TASK-036): Kanban-Board optional in horizontale Lanes nach
  **Assignee/Sprint/Tag** gruppieren – die konfigurierbaren Phasen (TASK-032)
  wiederholen sich je Lane. Reine Gruppierung in `src/lib/swimlanes.ts`
  (`buildSwimlanes` → Lanes in Store-Reihenfolge der Referenz-Entität, „ohne
  Zuordnung"-Lane zuletzt, keine leeren Lanes; Sprint via `storyId`, Tag via
  `tagIds[0]`). Auswahl `groupBy` persistiert im `useBoardStore` (v7→v8 additiv),
  Umschalter `SwimlaneSelect` (nur Kanban). Layout dumm in `BoardSwimlanes`
  (wiederverwendet `KanbanColumn` je Lane). **D&D-Datenfluss:** `KanbanColumn`
  (Droppable) und `TaskCard` (Sortable) tragen ein Drag-`data`
  (`{type, columnId, laneId}`); `board/page.tsx#handleDragEnd` liest daraus Spalte
  + Lane (statt Id-Parsing) und teilt sich so flache + Swimlane-Ansicht. Drop
  **innerhalb** einer Lane = nur Spalte (`moveTask`); **zwischen** Lanes zusätzlich
  Gruppen-Neuzuordnung über `laneReassignment`: Assignee → `updateTask({assigneeId})`,
  Sprint → `assignStory(storyId, …)` (nur mit `storyId`), Tag → nur Spalte
  (Mehrfach-Tags werden im `TaskDialog` gepflegt)
- `useSprintStore`: Sprints je Projekt + Story-Zuordnung (TASK-017); Done-Status &
  Sprint-Fortschritt (erledigt/geplant PT) leiten reine Helfer in
  `src/lib/sprint-progress.ts` aus Board-Tasks ab (TASK-021); Timebox über
  optionale `startDate`/`endDate` (ISO), aktiver Sprint + Zeitraum-Anzeige aus
  reinen Helfern `isActiveSprint`/`formatSprintRange` in `src/lib/sprint.ts`,
  `today` clientseitig nach Hydration-Gate (SSR-sicher) (TASK-024);
  Sprint-Review & -Retro als **historische Liste** (mehrere je Sprint,
  `addReview`/`addRetro`; TASK-054 löst das TASK-018-Upsert ab) – Formulare in
  `src/components/sprint/{ReviewForm,RetroForm,SprintReviewDialog}.tsx` liefern nur
  den Inhalt (`ReviewContent`/`RetroContent`), reine Schema-/Mapping-Helfer in
  `src/lib/sprint-review-schema.ts` (TASK-018). **Ceremonies-Bereich** `/ceremonies`
  (`src/components/ceremony/{CeremonyDialog,CeremonyHistory}.tsx`, TASK-054):
  eigener Bereich mit chronologischer Historie und „Neue Review/Retro"-Flow
  (Sprint + Scope `cross|team|project` (+ `teamId`)); `src/lib/ceremonies.ts`
  ergänzt die Ceremony-Metadaten (`createReview`/`createRetro`, id/now injizierbar)
  und mergt die Historie (`ceremonyHistory`). **Persist-Migration v1→v2** überführt
  die TASK-018-Upsert-Einträge verlustfrei (id/`scope`/`createdAt` backfillen). Der
  Klemmbrett-Einstieg an `active`/`done`-Sprints bleibt und legt Einträge mit
  `scope: "project"` an.
  **Sprint-Detailseite** `/sprints/[id]` (`src/components/sprint/SprintDetail.tsx`,
  TASK-053): Kopf + `SprintBurndownChart` + klickbare Story-/Task-Liste
  (`tasksForStory`), Task-Klick öffnet denselben `TaskDialog` wie das Board;
  Fortschritt/Done nur über `sprintProgress`/`isStoryDone` (TASK-038, keine
  Doppellogik). Navigation über `detailHref`-Prop an `SprintSection` (Öffnen-Icon).
  **Sprint-Übersicht v2** (`/sprints`, TASK-059): vertikal gestapelte, ein-/
  ausklappbare `SprintSection`-Abschnitte (ersetzt das horizontale `SprintColumn`),
  Backlog-Sektion zuletzt; Stories per Drag zwischen den Sektionen (`assignStory`),
  kompakte Story-Zeilen (`SprintStoryCard variant="row"`, Griff + Klick aus
  TASK-058). Commitment-Warnung (`sprintCommitment` in `src/lib/capacity.ts`) als
  `<StatusBadge>` „Überplant", wenn geplante PT die Team-Kapazität übersteigen.
- `usePeopleStore`: Personen & Teams als Stammdaten mit Kapazität (TASK-019); Route `/team`.
  Zuweisung erfolgt über `BoardTask.assigneeId`; reine Auslastungsrechnung in
  `src/lib/capacity.ts` (`sprintWorkload`, `loadStatus`) vergleicht zugewiesene PT
  je Person mit ihrer Kapazität (TASK-020)
- `useReleaseStore`: Releases je Projekt (Zeitraum + Sprint-Dauer), Route `/releases`
  (TASK-025). Reiner Helfer `generateSprints`/`sprintWindows` in `src/lib/release.ts`
  teilt den Release-Zeitraum lückenlos in datierte Timeboxes (letztes Fenster geklemmt);
  der Sprint-Store erzeugt sie idempotent über `releaseId` (`setReleaseSprints`) und
  entkoppelt sie beim Löschen (`detachRelease` → `releaseId: undefined`), manuelle
  Sprints bleiben unberührt. **Release-Management (TASK-041):** Feld `Release.status`
  (`planned|active|done`, Persist v1→v2 additiv) per `<StatusBadge>` (Map
  `RELEASE_STATUS`); **Fortschritt rein berechnet** über `releaseProgress` (summiert
  `sprintProgress` der Release-Sprints → eine Done-Quelle `isStoryDone`, TASK-038,
  keine Doppellogik) und Timeline via `releaseSprints` (sortiert, aktiver Sprint
  per `isActiveSprint`). `ReleaseCard` zeigt Status/Scope/Fortschritt/Timeline,
  Daten (Stories aus `artifacts`, terminale Spalten, `today`) reicht `releases/page` durch
- `useTagStore`: frei vergebbare Tags/Labels (TASK-031), Verwaltung im `TagManager`
  (Dialog auf dem Board). Zuweisung über `BoardTask.tagIds`; feste Token-Farbpalette
  + reine Helfer (`tagsForIds`, `taskHasTag`, `detachTaskTags`) in `src/lib/tags.ts`.
  Löschen eines Tags entkoppelt ihn aus allen Items (`removeTag` → `useBoardStore.detachTag`);
  Board nach `tagId` filterbar (einwertig) über `filterBoardTasks`/`FilterBar`
- `useAgentStore`: Agenten, Läufe, Outputs, Pipeline-Status
- Persist-Middleware für Projekt-, Board-, Sprint-, People-, Release- und Tag-Store
- **Confirm/Undo-Pattern (TASK-040):** eine gemeinsame Mechanik für destruktive
  Aktionen statt Ad-hoc-Dialoge. `useConfirmStore.confirm(options)` (imperatives
  Promise) wird vom `ConfirmDialog`-Host gerendert; `useToastStore` + `Toaster`
  zeigen einen Toast mit **Undo**. Beide Hosts hängen einmalig im
  `(dashboard)/layout`. Der Hook `useConfirmDelete` bündelt den Ablauf
  **bestätigen → löschen → Toast mit Undo**; Konsumenten liefern nur `perform`/
  `undo`-Closures. **Undo = Snapshot + `restore`:** jeder betroffene Store hat eine
  `restore(slice)`-Action, die die vorherige Slice 1:1 zurückspielt (inkl.
  Cascade-Aufräumung). **Referenz-Aufräumung beim Löschen** wie bei Tags:
  `removePerson` → `useBoardStore.detachAssignee` (reiner Helfer
  `src/lib/assignment.ts`), so bleibt kein dangling `assigneeId`. Abgedeckte
  Entitäten: Projekt/Idee, Board-Task, Person, Team, Release, Board-Phase.

## Datenfluss Stores → Dashboard (ab TASK-011)

Das Dashboard ist clientseitig und liest ausschließlich aus den Stores (keine
hartkodierten Dummy-Arrays im JSX). Reine, testbare Selektoren in
`src/lib/dashboard-selectors.ts` leiten die View-Modelle ab:

| Bereich | Quelle | Selektor |
|---|---|---|
| Metrik-Karten (Projekte, Sprints, Aufgaben, Risiken) | `useProjectStore` (ideas, artifacts) + `useBacklogStore` (stories) + `useRiskStore` (risks, TASK-061) | `selectMetrics` |
| Projektfortschritt | `useProjectStore` (ideas) + `useBoardStore` (tasks) | `selectProjects` |
| Aufgaben nach Status (Donut) | `useBoardStore` (tasks) | `selectTaskStatusDistribution` |
| Velocity (erledigte vs. geplante PT/Sprint) | `useProjectStore` (artifacts) + `useBoardStore` (tasks) | `selectVelocity` (TASK-021) |
| Sprint-Burndown (Ideal- vs. Ist-Linie) | `useSprintStore` (Timebox) + `useProjectStore` (Stories) + `useBoardStore` (`doneAt`) | `sprintBurndown` (TASK-026) |
| Agenten-Aktivität (Feed) | `useAgentStore` (runs, transient) | direkt |

- **SSR-Sicherheit:** `useHydrated()` gated den Render; vor der Hydration wird ein
  stabiler „Lädt …"-Platzhalter gezeigt (kein Hydration-Mismatch).
- **Empty-States mit CTA:** Frischer Zustand zeigt den `DashboardEmpty`-Banner
  („Erste Idee anlegen") sowie pro Bereich aussagekräftige Platzhalter.
- **Echte Sprint-Burndown (TASK-026):** Die Burndown nutzt echte Daten – Default
  ist der aktive Sprint (Timebox enthält heute), per Dropdown wählbar.
  `BoardTask.doneAt` (gesetzt beim Wechsel nach `done`, entfernt beim Verlassen)
  liefert die datierte Ist-Linie; `sprintBurndown` in `src/lib/burndown.ts` ist
  rein und unit-getestet. Ohne Sprint mit Zeitraum greift ein Empty-State.
- **Beispiel-Bereich:** Status-Grid (CI/Tests) und Agentenlauf-Dauern haben noch
  keine echte Quelle; sie kommen als Seed aus `src/data/dashboard.ts` und sind im
  UI klar als „Demo/Beispiel" gekennzeichnet (bis M6+).

## My Work & globale Suche (TASK-042)

- **My Work (`/my-work`):** zeigt die Arbeit **einer Person** projekt-/
  storyübergreifend. Reine Selektoren in `src/lib/my-work.ts`:

  | Zweck | Funktion |
  |---|---|
  | Tasks einer Person | `tasksForPerson(tasks, personId)` |
  | Offen (nicht terminal) / überfällig | `isTaskOpen` / `isTaskOverdue` (delegiert an `src/lib/due.ts`) |
  | Zähler (assigned/open/overdue) | `myWorkCounts` |
  | Scope-Filter (assigned/open/overdue) | `filterMyWork` |
  | Person-Auflösung (zukünftiger Login) | `resolveMyWorkPersonId(preferredId, persons)` |

  Done-Semantik kommt aus `terminalColumnIds` (TASK-032), Überfällig aus
  `due.ts` (TASK-034) – **keine zweite Logik**. Die Liste wiederverwendet
  `BoardListView`/`buildBoardRows`/`FilterBar`. **Person-Auflösung gekapselt:**
  mit späterem Login wird der eingeloggte User (eine `Person`) als `preferredId`
  eingesetzt, die Seite bleibt unverändert.

- **Globale Suche (CommandBar):** indexfreie `searchEntities(query, sources)` in
  `src/lib/search.ts` über Projects/Tasks/Stories/People/Releases (case-insensitiv,
  pro Art gekappt, mit Navigations-`href`). Die `CommandBar` läuft mit
  `shouldFilter={false}` und kontrollierter Query, gruppiert Treffer nach Art und
  bietet **Create-Aktionen** („Neue Idee/Person/Release"). Aktionen, die einen
  Dialog auf einer anderen Seite öffnen, nutzen den ephemeren
  `useCommandActionStore` (Intent), den die Zielseite **deklarativ** im Render
  ausliest – kein `setState` im Effect.
