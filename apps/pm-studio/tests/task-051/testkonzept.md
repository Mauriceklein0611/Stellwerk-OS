# Testkonzept TASK-051 – „+ Spalte"-Kachel am Board

## Automatisiert

| Datei | Prüfung |
|---|---|
| `AddColumnTile.test.tsx` | Trigger öffnet das Inline-Feld; Enter ruft `onAdd` mit **getrimmtem** Label; leeres/whitespace-Label wird ignoriert; Feld bleibt nach Enter offen und leert sich für den nächsten Eintrag; Esc schließt ohne Anlegen; Blur schließt |
| `add-column-default.test.ts` | Aufruf der Kachel `addColumn({ label })` (ohne Status/Terminal): neue Phase landet **am Ende** (rechts), ist **nicht-terminal**; leeres Label legt nichts an (Store als Backstop) |
| `e2e/board.spec.ts` | „+ Spalte"-Kachel legt eine neue Phase an, die **sofort** als Spalte erscheint; Feld bleibt offen/leer; die Phase **überlebt einen Reload** (Store-Persist) |

> Das breitere `addColumn`-Verhalten (Re-Sequencing, eigener Status, Reorder/Remove)
> ist bereits in `tests/task-032/useBoardColumnsStore.test.ts` abgedeckt – hier nicht dupliziert.

Ausführen: `npm run test` (Unit) · `npx playwright test e2e/board.spec.ts` (E2E) · Gate zusätzlich `npm run lint`, `npx tsc --noEmit`, `npm run build`.

## Manuell (Klick-Checkliste)

Voraussetzung: `npm run dev`, Board in der **Kanban-Ansicht** (nicht Liste, keine Swimlanes).

1. **Kachel sichtbar:** Board öffnen. → *Erwartet:* Rechts neben der letzten Spalte
   steht eine gestrichelte Kachel „+ Spalte".
2. **Anlegen:** „+ Spalte" klicken → Feld erscheint. Name eingeben (z. B. „Klärung"),
   **Enter**. → *Erwartet:* Neue Spalte erscheint sofort rechts; Feld bleibt offen und
   ist geleert.
3. **Mehrere hintereinander:** Direkt den nächsten Namen eingeben + Enter. →
   *Erwartet:* Zweite Spalte wird angelegt, ohne erneut zu klicken.
4. **Leer ignoriert:** Leeren Namen / nur Leerzeichen + Enter. → *Erwartet:* Keine
   Spalte angelegt.
5. **Schließen:** **Esc** oder daneben klicken (Blur). → *Erwartet:* Feld schließt,
   zurück zum „+ Spalte"-Trigger.
6. **Eigenschaften:** „Spalten verwalten" öffnen. → *Erwartet:* Die neue Phase steht
   **am Ende**, ist **nicht** als „Abgeschlossen" markiert (nicht-terminal).
7. **Persistenz:** Seite neu laden (F5). → *Erwartet:* Die angelegte Spalte bleibt
   erhalten.
8. **Nur Kanban-flach:** In die **Liste** umschalten bzw. „Gruppieren nach" wählen. →
   *Erwartet:* Die „+ Spalte"-Kachel ist nicht sichtbar.

## DoD-Abgleich (`docs/testing-strategy.md`)

- [x] Funktioniert lokal (dev) – Inline-„+ Spalte" rechts neben der letzten Spalte
- [x] Typsicher (`tsc --noEmit` grün), kein `any`
- [x] Lint grün (`npm run lint`)
- [x] Unit- & E2E-Tests vorhanden & grün (`tests/task-051/`, `e2e/board.spec.ts`)
- [x] Build grün (`npm run build`)
- [x] Tastaturbedienbar (Enter legt an, Esc schließt); SSR-sicher (Client-State, kein Hydration-Bruch)
- [x] Statusfarben/Spaltenquelle unverändert (`useBoardColumnsStore.addColumn`); keine neue Dependency, keine Persist-Migration
- [x] Doku aktualisiert (`task-index.md`, dieses Testkonzept)
