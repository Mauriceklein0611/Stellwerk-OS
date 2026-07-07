# Testkonzept TASK-036 – Swimlanes (Gruppierung im Board)

> Das Kanban-Board lässt sich optional in horizontale **Swimlanes** gruppieren –
> nach Assignee, Sprint oder Tag. Spalten (konfigurierbare Phasen, TASK-032)
> werden je Lane wiederholt. Reine Gruppierung in `src/lib/swimlanes.ts`
> (`buildSwimlanes`/`laneReassignment`), die Auswahl ist im `useBoardStore`
> persistiert (`groupBy`, Persist v7→v8 additiv). Komponenten bleiben dumm
> (`BoardSwimlanes`, `SwimlaneSelect`).

## D&D-Verhalten (dokumentiert)

- **Innerhalb einer Lane:** verschiebt nur die **Spalte** (wie bisher) – `moveTask`.
- **Zwischen Lanes:** verschiebt die Spalte **und** ändert die Gruppen-Zuordnung:
  - **Assignee:** `updateTask(id, { assigneeId })` (Ziel-Lane „Nicht zugewiesen" ⇒ `undefined`).
  - **Sprint:** `assignStory(storyId, sprintId|null)` – **nur** wenn der Task eine
    `storyId` hat (Sprint-Zugehörigkeit liegt auf Story-Ebene). Tasks ohne Story
    ändern nur die Spalte.
  - **Tag:** **keine** Tag-Änderung per Drag (nur Spalte). Tag-Lanes gruppieren
    nach dem **ersten** Tag (`tagIds[0]`); Mehrfach-Tags werden im Task-Dialog
    gepflegt – ein Drag dürfte sonst andere Tags zerstören.
- Umsetzung über das Drag-Payload (`data`) auf `KanbanColumn`-Droppable und
  `TaskCard`-Sortable (`{ type, columnId, laneId }`) statt Id-Parsing – flache und
  Swimlane-Ansicht teilen sich denselben `handleDragEnd`.

## Automatisiert

| Datei | Prüfung |
| --- | --- |
| `tests/task-036/swimlanes.test.ts` | `buildSwimlanes`: `none` = eine Lane mit allen Tasks; Assignee/Sprint/Tag-Gruppierung in Referenz-Reihenfolge; „ohne Zuordnung"-Lane immer zuletzt; keine leeren Lanes; Sprint über `storyId`; Tag über `tagIds[0]`. `laneReassignment`: Assignee→`assigneeId` (ungrouped→undefined), Sprint→`sprintId` (ungrouped→null), Tag/None→`{kind:"none"}` |
| `tests/task-036/board-store-groupby.test.ts` | `groupBy` default `none`; `setGroupBy` setzt die Dimension; `groupBy` ist Teil der persistierten Partition |
| `tests/task-036/SwimlaneSelect.test.tsx` | rendert vier Optionen, markiert die aktive (`aria-checked`), `onChange` mit gewähltem Modus |
| `tests/task-036/BoardSwimlanes.test.tsx` | eine Lane je Gruppe (Label + „ohne Zuordnung"); Spalten pro Lane namespaced (`board-column-<lane>-<col>`); Lane-Counter zählt nur Lane-Tasks; Empty-State ohne Lanes |
| `e2e/board.spec.ts` (ergänzt) | „Gruppieren nach: Assignee" → Swimlane „Nicht zugewiesen" mit Tasks; flache Spalten verschwinden; Auswahl überlebt Reload (persist) |

## Manuell (vom Nutzer klickbar)

1. **Board öffnen** → flache Ansicht wie bisher; Umschalter „Gruppieren nach: Keine / Assignee / Sprint / Tag" oben rechts (nur in der Kanban-Ansicht). ✅
2. **„Assignee" wählen** → das Board teilt sich in Lanes je Person plus „Nicht zugewiesen"; jede Lane wiederholt die Spalten. ✅
3. **Counter prüfen** → die Lane-Pille zeigt die Task-Anzahl der Lane, die Spalten-Pillen je Lane×Spalte. ✅
4. **„Sprint" wählen** → Lanes je Sprint plus „Ohne Sprint"; Tasks ohne Story landen in „Ohne Sprint". ✅
5. **„Tag" wählen** → Lanes je (erstem) Tag plus „Ohne Tag". ✅
6. **Drag innerhalb einer Lane** → Task wechselt die Spalte, bleibt in der Lane. ✅
7. **Drag in eine andere Lane** (Assignee/Sprint) → Task wechselt Spalte **und** Gruppe (z. B. neuer Assignee bzw. Sprint der Story). Im Tag-Modus ändert sich nur die Spalte. ✅
8. **„Keine" wählen** → exakt die heutige flache Ansicht inkl. Quick-Add. ✅
9. **Reload** → die gewählte Gruppierung bleibt erhalten (`pm-studio-board`). ✅

## DoD-Abgleich (`docs/testing-strategy.md`)

- [x] Typsicher (TS strict, kein `any`), Lint sauber (0 Errors)
- [x] Gruppierlogik in `src/lib/swimlanes.ts`, Komponenten dumm; eine Quelle
- [x] Status-Farben unverändert ausschließlich über `<StatusBadge>`-Tokens
- [x] Empty-States (keine Lanes; „Keine Tasks" je Spalte) + Hydration-Gate vorhanden
- [x] Unit- + Component- + E2E-Tests grün; Build grün
- [x] Persist-Migration ohne Datenverlust (`groupBy` additiv v7→v8, Default `none`)
- [x] Doku aktualisiert (`task-index`, `frontend-plan`)
