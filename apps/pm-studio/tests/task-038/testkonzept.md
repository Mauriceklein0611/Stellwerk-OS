# Testkonzept – TASK-038: Story-Done-Semantik korrigieren

Eine User Story gilt erst als **fertig**, wenn sie **mindestens einen** Task hat
und **alle** ihre Story-Tasks in einer terminalen Spalte liegen. Vorher reichte
**ein** terminaler Task – Velocity, Burndown und Sprint-Fortschritt waren dadurch
fachlich zu optimistisch. Quelle bleibt die **eine** Funktion `isStoryDone`
(`src/lib/sprint-progress.ts`); alle Kennzahlen konsumieren sie.

## Automatisiert (Vitest)

| Datei | Prüfung |
| --- | --- |
| `story-done-semantics.test.ts` | **`isStoryDone`**: 0 Tasks → offen, 1/2 terminal → offen, 2/2 terminal → done, einzelner terminaler Task → done, Tasks fremder Stories beeinflussen die Bewertung nicht. **`sprintProgress`**: teilweise terminale Story zählt als offen, zugewiesene Story ohne Tasks bleibt offen. **`storyTaskRollup.storyDone`**: false bei 1/2, true bei 2/2, false ohne Tasks. **`sprintBurndown`**: brennt nicht, solange ein Task offen ist; bei vollständig terminaler Story am **spätesten** `doneAt`. **`selectVelocity`**: zählt PT nur bei vollständig terminaler Story. |
| `tests/task-037/story-tasks.test.ts` | (bestehend, angepasst) `storyTaskRollup("US-1")` mit 1 von 3 terminalen Tasks → `storyDone: false` (vorher `true`). |
| `tests/task-032/is-terminal.test.ts` | (bestehend, angepasst) `storyTaskRollup` mit 1 terminalem + 1 nicht-terminalem („done" ≠ terminal) Task → `storyDone: false`. |
| `tests/task-026/burndown.test.ts` | (bestehend, angepasst) Story mit zwei terminalen Tasks brennt am **spätesten** `doneAt` (`[3, 0]` statt vorher `[0, 0]`). |
| `tests/task-021/sprint-progress.test.ts` | (bestehend, unverändert grün) jede Story hat dort genau einen terminalen Task → neue Semantik liefert dasselbe Ergebnis. |
| `tests/task-011/dashboard-selectors.test.ts` | (bestehend, unverändert grün) `selectVelocity` mit einem Task pro Story → unverändert. |

Ausführen: `npx vitest run tests/task-038` (bzw. `npm run test` für die Gesamt-Suite).

## Manuell (Schritt-für-Schritt, klickbare Akzeptanz)

Voraussetzung: ein Projekt mit generiertem Backlog; eine Story in einen Sprint
zugeordnet (`/sprints`), zwei Story-Tasks angelegt (Backlog-Tab → Block
„Aufgaben").

1. **Teilweise erledigt = noch offen:** Genau **einen** der beiden Story-Tasks
   im Board (`/board`) nach **Done** ziehen, den zweiten in **To Do** lassen.
   → Im Backlog-Block „Aufgaben" steht das Roll-up `1/2`, die Story zeigt
   **kein** „Fertig". Auf `/sprints` zeigt die Story-Karte **kein** „Fertig"-Badge,
   der Spaltenkopf zählt sie **nicht** zu „erledigt".
2. **Vollständig erledigt = fertig:** Auch den zweiten Task nach **Done** ziehen.
   → Roll-up `2/2`; Backlog- und Sprint-Karte zeigen jetzt **„Fertig"**, der
   Sprint-Fortschrittsbalken/„erledigt X / geplant Y PT" springt entsprechend hoch.
3. **Story ohne Tasks:** Eine Story ohne jeden Story-Task im Sprint betrachten.
   → Sie gilt **nie** als fertig (kein „Fertig"-Badge), unabhängig vom Board.
4. **Burndown:** Dashboard öffnen, den Sprint im Burndown-Chart wählen. → Die
   Ist-Linie sinkt erst an dem Tag, an dem der **letzte** Task der Story erledigt
   wurde, nicht schon beim ersten.
5. **Velocity:** Dashboard-Velocity prüfen. → Eine nur teilweise terminale Story
   trägt **0 PT** bei; erst vollständig terminale Stories erhöhen „erledigt".

## DoD-Abgleich (`docs/testing-strategy.md`)

- [x] Funktioniert lokal (Backlog-Tab, `/sprints`, Dashboard)
- [x] TypeScript strict, kein `any`
- [x] Lint/Typecheck/Test/Build grün; bestehende Board-/Sprint-E2E grün
- [x] Automatisierte Tests (neue Edge-Cases + angepasste Bestandstests, keine gelöscht/geskippt)
- [x] Eine einzige Done-Quelle (`isStoryDone`) – keine zweite `.some/.every`-Logik
- [x] Keine Secrets, keine neuen Dependencies
- [x] Doku aktualisiert (`docs/task-index.md`, `docs/future-scope.md`, `docs/audit-2026-06.md`)
- [x] Testkonzept vorhanden (diese Datei)
