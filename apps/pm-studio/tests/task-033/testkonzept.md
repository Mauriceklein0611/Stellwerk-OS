# Testkonzept TASK-033 – Quick-Add direkt in der Spalte

## Automatisiert

| Datei | Prüfung |
|---|---|
| `QuickAddTask.test.tsx` | Trigger öffnet das Inline-Feld; Enter ruft `onAdd` mit **getrimmtem** Titel; leerer/whitespace-Titel wird ignoriert; Feld bleibt nach Enter offen und leert sich für den nächsten Eintrag; Esc schließt ohne Anlegen; Blur schließt; `disabled` zeigt den Hinweis statt des Triggers |
| `e2e/board.spec.ts` | Ohne gewähltes Projekt ist Quick-Add deaktiviert (Hinweis statt Trigger); nach Projektwahl erzeugt Quick-Add einen Task in der Spalte, Counter steigt, Feld bleibt offen/leer; der neue Task **überlebt einen Reload** (Store-Persist) |

> Die `addTask`-Semantik (ans Spaltenende, korrekte `order`) ist bereits in
> `tests/task-008/useBoardStore.test.ts` abgedeckt – hier nicht dupliziert.

Ausführen: `npm run test` (Unit) · `npx playwright test e2e/board.spec.ts` (E2E) · Gate zusätzlich `npm run lint`, `npx tsc --noEmit`, `npm run build`.

## Manuell (Klick-Checkliste)

Voraussetzung: `npm run dev`, mindestens ein Projekt vorhanden, Board in der
Kanban-Ansicht.

1. **Disabled ohne Projekt:** Projektfilter auf „Alle Projekte". → *Erwartet:*
   Am Spaltenfuß steht „Projekt wählen, um Tasks anzulegen" (kein „+ Task").
2. **Projekt wählen:** Im Filter ein einzelnes Projekt wählen. → *Erwartet:* Am
   Fuß jeder Spalte erscheint „+ Task hinzufügen".
3. **Anlegen:** „+ Task hinzufügen" klicken → Feld erscheint. Titel eingeben,
   **Enter**. → *Erwartet:* Neuer Task erscheint unten in der Spalte, Counter und
   ggf. PT-Summe aktualisieren sich, Feld bleibt offen und ist geleert.
4. **Mehrere hintereinander:** Direkt den nächsten Titel eingeben + Enter. →
   *Erwartet:* Zweiter Task wird angelegt, ohne erneut zu klicken.
5. **Leer ignoriert:** Leeren Titel / nur Leerzeichen + Enter. → *Erwartet:* Kein
   Task angelegt.
6. **Schließen:** **Esc** oder daneben klicken (Blur). → *Erwartet:* Feld
   schließt, zurück zum „+ Task"-Trigger.
7. **Projektbezug:** Den neuen Task öffnen/prüfen. → *Erwartet:* Er gehört zum im
   Filter gewählten Projekt; Priorität-Default „Mittel".
8. **Persistenz:** Seite neu laden (F5), Projekt erneut wählen. → *Erwartet:*
   Angelegte Tasks bleiben erhalten.

## DoD-Abgleich (`docs/testing-strategy.md`)

- [x] Funktioniert lokal (dev) – Inline-Quick-Add am Spaltenfuß
- [x] Typsicher (`tsc --noEmit` grün), kein `any`
- [x] Lint grün (`npm run lint`)
- [x] Unit- & E2E-Tests vorhanden & grün (`tests/task-033/`, `e2e/board.spec.ts`)
- [x] Build grün (`npm run build`)
- [x] Tastaturbedienbar (Enter legt an, Esc schließt); SSR-sicher (Client-State, kein Hydration-Bruch)
- [x] Statusfarben/Spaltenquelle unverändert (`BOARD_COLUMNS`); keine neue Dependency
- [x] Doku aktualisiert (`task-index.md`, dieses Testkonzept)
