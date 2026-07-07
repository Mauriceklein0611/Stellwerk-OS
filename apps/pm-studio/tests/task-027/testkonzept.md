# Testkonzept TASK-027 – Board-UI-Überarbeitung

## Automatisiert

| Datei | Prüfung |
|---|---|
| `board-column.test.ts` | `sumEstimatePt`: summiert PT, fehlende Werte = 0, leere Liste = 0 |
| `board-column.test.ts` | `isWipExceeded`: false ohne konfiguriertes Limit; false ≤ Limit; true > Limit |
| `board-column.test.ts` | `BOARD_COLUMN_STATUS`: für jede Spalte ein Status-Akzent vorhanden |
| `e2e/board.spec.ts` | Spalten-Counter (`board-column-*-count`) bleiben exakt; Drag&Drop verschiebt + überlebt Reload; View-Toggle; Projektfilter |

Ausführen: `npm run test` (Unit) · `npx playwright test` (E2E) · Gate zusätzlich `npm run lint`, `npx tsc --noEmit`, `npm run build`.

## Manuell (Klick-Checkliste)

Voraussetzung: `npm run dev`, ein Projekt mit Board-Tasks in mehreren Spalten
(inkl. PT-Schätzungen und Zuweisungen).

1. **Vollbild-Layout:** `/board` in Kanban-Ansicht öffnen. → *Erwartet:* Alle
   6 Spalten teilen sich die Breite, **kein** Horizontal-Scrollen; jede Spalte
   hat oben einen farbigen Status-Streifen.
2. **Spaltenkopf:** → *Erwartet:* Titel links, rechts eine **Count-Pille** und
   – falls > 0 PT – eine **PT-Summen-Pille**. Beide gut lesbar (dunkler Chip,
   kein grau-auf-grau). Leere Spalten zeigen nur die `0`-Count-Pille.
3. **Internes Scrollen:** Eine Spalte mit vielen Tasks füllen (oder Fenster
   verkleinern). → *Erwartet:* Die Spalte scrollt **intern** mit dezenter
   Scrollleiste; die Seite selbst scrollt nicht endlos mit.
4. **Schmales Fenster:** Browserfenster verkleinern. → *Erwartet:* Lange Titel
   (z. B. „In Progress") **kürzen mit „…"**, der Kopf bricht nicht hässlich um;
   Pillen bleiben rechts. Erst auf sehr schmalen Screens (< ~1150 px) erscheint
   der horizontale Scroll-Fallback.
5. **Drag & Drop:** Eine Karte per Maus in eine andere Spalte ziehen. →
   *Erwartet:* Karte wechselt die Spalte, Counter/PT-Summe aktualisieren sich;
   nach Reload (F5) bleibt der Stand erhalten.
6. **Tastatur-D&D:** Karte fokussieren (Tab), Leertaste, Pfeiltasten, Leertaste.
   → *Erwartet:* Verschieben funktioniert weiterhin.
7. **WIP-Hinweis:** In „In Progress" mehr als 4 Tasks legen. → *Erwartet:* Im
   Spaltenkopf erscheint ein dezenter Warn-Badge „WIP n/4" (StatusBadge-Token).
8. **Karten-Feinschliff:** → *Erwartet:* Titel (max. 2 Zeilen), darunter
   Projekt · Story, dann Priorität + PT-Chip, dann Assignee/Avatar – ruhig
   gruppiert, lesbare Chips.
9. **Empty-State:** Eine Spalte leeren. → *Erwartet:* „Keine Tasks"-Platzhalter.

## DoD-Abgleich (`docs/testing-strategy.md`)

- [x] Funktioniert lokal (dev) – Board-Layout, Spaltenköpfe, internes Scrollen
- [x] Typsicher (`tsc --noEmit` grün), kein `any`
- [x] Lint grün (`npm run lint`) – keine neuen Warnungen
- [x] Unit-Tests vorhanden & grün (`tests/task-027/`); Board-E2E grün
- [x] Build grün (`npm run build`)
- [x] Empty-/Null-Zustände korrekt (leere Spalte, 0 PT → keine PT-Pille)
- [x] SSR-sicher: keine clientseitigen Werte im ersten Render (Hydration-Gate in page)
- [x] Status-Akzent nur über `BOARD_COLUMN_STATUS`/Design-Tokens, keine Ad-hoc-Farben
- [x] Doku aktualisiert (`design-system.md`, `task-index.md`, dieses Testkonzept)
