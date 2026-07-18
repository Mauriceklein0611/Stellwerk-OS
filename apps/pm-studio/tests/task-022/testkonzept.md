# Testkonzept TASK-022 – Filter für Board & Sprintansicht

## Automatisiert

| Datei | Prüfung |
|---|---|
| `board-filters.test.ts` | `isBoardFilterActive`: leer = inaktiv, gesetztes Kriterium = aktiv |
| `board-filters.test.ts` | `filterBoardTasks`: Projekt, Sprint + „ohne Sprint", Person + „nicht zugewiesen", Spalte; Kombination mehrerer Filter (UND) |
| `board-filters.test.ts` | `isSprintViewFilterActive`, `sprintStatusMatches` (Sprint-Status), `storyMatchesFilter` (Person, Done/Offen) |

Ausführen: `npm run test` · Gate zusätzlich `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npx playwright test` (inkl. angepasstem Board-Projektfilter-Test).

## Manuell (Klick-Checkliste)

### Board (`/board`)
Voraussetzung: Tasks im Board (ggf. zugewiesen/Stories in Sprints).

1. **Sprint-Filter:** Filter „Sprint" → einen Sprint wählen. → *Erwartet:* nur
   Tasks, deren Story diesem Sprint zugeordnet ist. „Ohne Sprint" zeigt nur Tasks
   ohne Sprintzuordnung.
2. **Person-Filter:** „Person" → eine Person. → *Erwartet:* nur deren Tasks.
   „Nicht zugewiesen" zeigt nur Tasks ohne Assignee.
3. **Priorität / Spalte:** „Priorität" bzw. „Spalte" wählen → entsprechend
   reduzierte Tasks.
4. **Kombination (UND):** z. B. Sprint + Priorität „Hoch" gleichzeitig. →
   *Erwartet:* nur Tasks, die beide Bedingungen erfüllen.
5. **Leeres Ergebnis:** Filter so kombinieren, dass nichts passt. → *Erwartet:*
   Empty-State „Keine Tasks für die aktuellen Filter" mit „Filter zurücksetzen".
6. **Zurücksetzen:** Button „Filter zurücksetzen" (erscheint, sobald ein Filter
   aktiv ist) → vollständige Ansicht zurück.

### Sprintansicht (`/sprints`)
7. **Person:** Filter „Person" → nur Stories, deren Board-Task der Person gehört.
8. **Sprint-Status:** „Sprint-Status" = Aktiv → nur aktive Sprint-Spalten (die
   „Nicht zugeordnet"-Spalte wird ausgeblendet).
9. **Item-Status:** „Erledigt" / „Offen" → nur erledigte bzw. offene Stories.
10. **Leeres Ergebnis & Zurücksetzen:** wie Board – Empty-State + Reset.

## DoD-Abgleich (`docs/testing-strategy.md`)

- [x] Funktioniert lokal (dev) – Filter auf Board und Sprintansicht
- [x] Typsicher (`tsc --noEmit` grün), kein `any`
- [x] Lint grün (`npm run lint`)
- [x] Unit-Tests vorhanden & grün (`tests/task-022/`)
- [x] Build grün (`npm run build`)
- [x] Empty-States bei leerem Filterergebnis (mit Reset), Performance via `useMemo`
- [x] Bestehende E2E-Tests grün (Board-Projektfilter-Test auf benannten Combobox angepasst)
- [x] Doku aktualisiert (`frontend-plan.md`, `task-index.md`, dieses Testkonzept)
