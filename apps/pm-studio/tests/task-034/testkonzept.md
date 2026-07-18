# Testkonzept TASK-034 – Fälligkeitsdaten & Überfällig-Hinweis

## Automatisiert

| Datei | Prüfung |
|-------|---------|
| `tests/task-034/due.test.ts` | Reine Helfer: `isOverdue` (Vergangenheit/heute/Zukunft, Done-Ausnahme, ohne Datum), `dueStatus` (overdue/today/upcoming, Done immer neutral), `DUE_STATUS_TOKEN` (danger/warning/neutral), `formatDueDate` (`DD.MM.`, leer bei ungültig). |
| `tests/task-034/board-filter-due.test.ts` | `filterBoardTasks` mit `OVERDUE`: nur überfällige (Vergangenheit + offen) bleiben; `ALL` unverändert; ohne `today`-Referenz wird die Bedingung übersprungen; `isBoardFilterActive` erkennt den Due-Filter. |
| `tests/task-034/DueBadge.test.tsx` | Komponente: rendert nichts ohne Datum; zeigt kompaktes Datum; `data-due-status` = overdue/today/upcoming je nach Lage; erledigte Tasks nie overdue. |
| `e2e/board.spec.ts` (Playwright) | Überfällig-Badge auf der Karte (`data-due-status="overdue"`), zukünftiges Datum neutral; Filter „Überfällig" reduziert das Board auf den überfälligen Task (Counter stimmen). |

Bestehende Suiten bleiben grün (u. a. `tests/task-030/BoardListView.test.tsx` um die
`today`-Prop ergänzt; `tests/task-022/board-filters.test.ts` weiter grün, Filter-Default
um `due: ALL` erweitert).

## Manuell (Klick-Checkliste)

Voraussetzung: Board geöffnet (`/board`), mindestens ein Task vorhanden.

1. **Termin setzen:** Einen Task öffnen → Feld **„Fällig am"** mit einem Datum in
   der Vergangenheit füllen → Speichern.
   *Erwartet:* Auf der Karte erscheint eine rote Pille `DD.MM.` mit Kalender-Icon
   (überfällig).
2. **Heute:** Bei einem anderen offenen Task „Fällig am" = **heute** setzen.
   *Erwartet:* gelbe (warning) Pille.
3. **Zukunft:** Ein Datum in der Zukunft setzen.
   *Erwartet:* neutrale (graue) Pille – kein Warnton.
4. **Erledigt schlägt Termin:** Den überfälligen Task in die Spalte **Done** ziehen.
   *Erwartet:* Pille wird neutral (nicht mehr rot) – erledigte Arbeit ist nie überfällig.
5. **Löschen:** Task öffnen → Datum im Feld leeren → Speichern.
   *Erwartet:* keine Fälligkeits-Pille mehr.
6. **Liste:** Auf „Liste" umschalten → Spalte **„Fällig"** zeigt dieselben Termine/
   Färbungen; nach der Spalte sortierbar.
7. **Filter:** In der Filterleiste **„Fälligkeit" → „Überfällig"** wählen.
   *Erwartet:* nur überfällige Tasks bleiben sichtbar, „Filter zurücksetzen" erscheint;
   Reset zeigt wieder alles.
8. **Persistenz/SSR:** Seite neu laden.
   *Erwartet:* Termine/Färbungen bleiben erhalten, kein Flackern/Hydration-Fehler in
   der Konsole.

## DoD-Abgleich (`docs/testing-strategy.md`)

- [x] Funktion erfüllt die Akzeptanzkriterien der Task-Datei
- [x] TypeScript strict, kein `any`; Logik in `src/lib/due.ts`, nicht in Komponenten
- [x] Reine Helfer unit-getestet (Edge Cases: ohne Datum, Done, heute, Zukunft)
- [x] Komponententest + E2E (Anzeige + Filter)
- [x] Loading/Empty/SSR berücksichtigt (Hydration-Gate für „heute")
- [x] Status-Farben ausschließlich über die StatusBadge-Token-Quelle
- [x] Doku aktualisiert (`design-system.md`, `task-index.md`, dieses Testkonzept)
- [x] Lint/Typecheck/Test/Build grün
