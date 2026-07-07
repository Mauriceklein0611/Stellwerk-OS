# Testkonzept TASK-032 – Anpassbare Board-Phasen (Spalten-CRUD + `isTerminal`)

> **032a** – Phasen als Daten (`BoardColumnDef`) im `useBoardColumnsStore`,
> Spalten-CRUD-UI (`ColumnManager`), Verdrahtung aller Board-Konsumenten auf die
> dynamischen Phasen.
> **032b** – Done-Semantik hängt nicht mehr am literalen `column === "done"`,
> sondern am `isTerminal`-Flag: `terminalColumnIds`/`isTerminalColumn` versorgen
> `stampDone` (`doneAt`), `sprintBurndown`, `sprintProgress`/`isStoryDone`
> (Velocity), `storyTaskRollup`, Überfällig (`filterBoardTasks`) und den
> Projektfortschritt/Donut (`dashboard-selectors`). Mind. eine terminale Phase ist
> im Store erzwungen; alle Helfer defaulten auf die Standard-Terminal-Id (`done`).

## Automatisiert

| Datei | Prüfung |
| --- | --- |
| `tests/task-032/useBoardColumnsStore.test.ts` | Default-Phasen; `addColumn` (Trim, leere ignoriert, append); rename/recolor/WIP setzen+löschen; `reorderColumns` (Re-Sequenz + fehlende Ids hinten); `setColumnTerminal`-Guard (letzte terminale Phase bleibt); `removeColumn` (Task-Umzug auf Fallback, Re-Sequenz; Schutz der letzten terminalen Phase; No-Op bei Fallback==Ziel) |
| `tests/task-032/dynamic-columns.test.ts` | `columnLabel`/`columnStatus`/Fallback gegen übergebene Phasen; `buildBoardRows` nutzt Custom-Label/-Status; `tasksForStory` ordnet nach Custom-Reihenfolge |
| `tests/task-032/ColumnManager.test.tsx` | Phase anlegen; Inline-Rename; Move-up-Button; Löschen verschiebt Tasks auf erste verbleibende Phase; Löschen der einzigen terminalen Phase ist deaktiviert |
| `tests/task-027/board-column.test.ts` (angepasst) | `isWipExceeded(def, count)`; `DEFAULT_BOARD_COLUMNS` Status/Terminal; `findColumn` |
| `tests/task-030/BoardListView.test.tsx` (angepasst) | neue `columns`-Prop durchgereicht |
| `tests/task-032/is-terminal.test.ts` (032b) | `terminalColumnIds`/`isTerminalColumn`; `isStoryDone`/`sprintProgress`/`storyTaskRollup`/`sprintBurndown` zählen die **terminale** Phase (nicht literal „done"); Überfällig-Filter überspringt terminale Tasks; `selectProjects`/`selectVelocity`/`selectTaskStatusDistribution` mit Custom-Phasen (kein Crash bei fremder Spalten-Id) |
| `tests/task-032/board-store-terminal.test.ts` (032b) | `doneAt`-Stempel folgt `isTerminal`: Eintritt in die terminale Phase stempelt, Verlassen löscht, Umsortieren innerhalb behält den Zeitstempel |
| `e2e/board.spec.ts` (ergänzt) | Phase „QA" über „Spalten verwalten" anlegen → erscheint als Board-Spalte und überlebt Reload (eigener Persist-Store) |

## Manuell (vom Nutzer klickbar)

1. **Board öffnen** → es erscheinen die 6 Standardphasen (Backlog … Done) wie bisher. ✅
2. **„Spalten verwalten"** klicken → Dialog mit allen Phasen (Reihenfolge-Pfeile, Name, Status, WIP, „Abgeschlossen", Löschen) und einer „Neue Phase"-Zeile. ✅
3. **Neue Phase „QA" anlegen** (Name eingeben, Status „Info", Hinzufügen) → Dialog zeigt die neue Zeile, das Board eine neue Spalte „QA" am Ende. ✅
4. **Phase umbenennen** (z. B. „To Do" → „Aufgaben") → Spaltenkopf und Status-Auswahl im Task-Dialog/Listenansicht zeigen sofort das neue Label. ✅
5. **Status/WIP ändern** → Spaltenkopf-Akzentstreifen ändert die Farbe; WIP-Limit setzen und Spalte über das Limit füllen → Warnhinweis „WIP n/m". ✅
6. **Reihenfolge ändern** (Pfeil hoch/runter) → Spalten verschieben sich live auf dem Board; nach Reload bleibt die Reihenfolge erhalten. ✅
7. **Phase löschen** (mit Tasks darin) → Tasks wandern in die erste verbliebene Phase, nichts geht verloren. ✅
8. **Letzte „Abgeschlossen"-Phase** lässt sich weder abwählen noch löschen (Schutz, Tooltip). ✅
9. **Reload** → angelegte/umbenannte/sortierte Phasen bleiben erhalten (`pm-studio-board-columns`). ✅
10. **Drag & Drop, Filter „Spalte", Listenansicht, View-Toggle, Quick-Add** funktionieren mit den (auch geänderten) Phasen weiter. ✅

## DoD-Abgleich (`docs/testing-strategy.md`)

- [x] Typsicher (TS strict, kein `any`), Lint sauber (0 Errors)
- [x] Logik in `src/lib`/Store, Komponenten dumm; eine Quelle für Phasen
- [x] Status-Farben ausschließlich über `<StatusBadge>`-Tokens
- [x] Loading/Empty/Disabled-States vorhanden (Hydration-Gate Board, Schutz-Disabled im Manager)
- [x] Unit- + E2E-Tests grün; Build grün
- [x] Persist-Migration ohne Datenverlust (neuer Store v1 = Default-Phasen; Task-`column`-Ids unverändert = Default-Ids)
- [x] Doku aktualisiert (`task-index`, `design-system`, `frontend-plan`, `architecture`)
- [x] **032b:** Done-Semantik via `isTerminal` in Burndown/Velocity/`doneAt`/Überfällig/Projektfortschritt (kein literal `done` mehr)
</content>
