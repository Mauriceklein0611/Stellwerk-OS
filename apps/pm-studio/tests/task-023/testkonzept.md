# Testkonzept TASK-023 – Board-Ansichtswechsel: Kanban & Scrum-Liste

## Automatisiert

| Datei | Prüfung |
|---|---|
| `board-rows.test.ts` | `buildBoardRows`: löst Assignee-Name (People), Sprint-Name (Story→Sprint), Spalten-Label/-Status (aus `BOARD_COLUMNS`) und Kurz-ID auf; saubere Fallbacks ohne Assignee/Sprint/Schätzung |
| `board-view.test.ts` | `useBoardStore.view` Default `kanban`; `setView` schaltet um; `partialize` persistiert `view` |
| `e2e/board.spec.ts` | Umschalten auf „Liste" zeigt Tabellenzeilen (kein Kanban) und **überlebt einen Reload** (persistiert) |

Ausführen: `npm run test` (Unit) · `npx playwright test` (E2E) · Gate zusätzlich `npm run lint`, `npx tsc --noEmit`, `npm run build`.

> Hinweis: `BoardListView` nutzt – wie `IdeaTable`/`RiskTable` – TanStack Table;
> dabei meldet der React-Compiler die bekannte Info-Warnung „incompatible
> library" (kein Fehler, identisch zu den bestehenden Tabellen).

## Manuell (Klick-Checkliste)

Voraussetzung: `npm run dev`, einige Tasks im Board (ideal zugewiesen + in Sprints).

1. **Umschalter:** `/board` öffnen. Oben rechts der Segmented-Control „Kanban |
   Liste". → *Erwartet:* Default „Kanban".
2. **Listenansicht:** „Liste" klicken. → *Erwartet:* Octane-artige Tabelle mit
   Spalten ID, Titel, Status, Priorität, PT, Assignee (Avatar+Name), Sprint,
   Projekt.
3. **Sortierung:** Spaltenkopf (z. B. „Priorität", „Titel") klicken. → *Erwartet:*
   Zeilen sortieren auf-/absteigend.
4. **Zeilenklick:** Eine Zeile anklicken. → *Erwartet:* derselbe `TaskDialog` wie
   im Kanban öffnet sich; Änderungen wirken in beiden Ansichten.
5. **Gemeinsame Filter:** Einen Filter (z. B. Person) setzen → in beiden Ansichten
   identisch wirksam; Umschalten ändert die Filter nicht.
6. **Persistenz:** Auf „Liste" stehen, Seite neu laden (F5). → *Erwartet:* Ansicht
   bleibt „Liste".
7. **Empty-States:** Ohne Tasks zeigt die Liste „Keine Tasks vorhanden"; bei
   leerem Filterergebnis erscheint der gemeinsame Filter-Empty-State.

## DoD-Abgleich (`docs/testing-strategy.md`)

- [x] Funktioniert lokal (dev) – Umschalten, sortierbare Liste, Zeilenklick
- [x] Typsicher (`tsc --noEmit` grün), kein `any`
- [x] Lint grün (`npm run lint`; nur die bekannte TanStack-Info-Warnung)
- [x] Unit- & E2E-Tests vorhanden & grün (`tests/task-023/`, `e2e/board.spec.ts`)
- [x] Build grün (`npm run build`)
- [x] Empty-States in beiden Ansichten; SSR-sicher (`useHydrated`-Gate)
- [x] Statusfarben nur via `<StatusBadge>`; Spalten-/Statusquelle = `BOARD_COLUMNS`
- [x] Doku aktualisiert (`frontend-plan.md`, `task-index.md`, dieses Testkonzept)
