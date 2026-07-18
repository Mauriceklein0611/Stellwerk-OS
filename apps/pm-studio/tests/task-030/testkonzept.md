# Testkonzept TASK-030 – Inline-Editing der Board-Listenansicht

## Automatisiert

| Datei | Prüfung |
|---|---|
| `EditableTextCell.test.tsx` | Anzeige von Wert/Empty-Label; Commit des **getrimmten** Drafts auf Enter und Blur; Esc verwirft (zurück in den Anzeigemodus); Klick stoppt die Propagation (Eltern-`onClick` feuert nicht) |
| `EditableSelectCell.test.tsx` | Trigger zeigt die aktuelle Option; `disabled` rendert statischen Platzhalter (kein Dropdown); Auswahl ruft `onChange(value)`; Klick stoppt die Propagation |
| `BoardListView.test.tsx` | Titel inline ändern ⇒ `onUpdateTask(id,{title})`, **kein** `onRowClick`; leerer Titel ignoriert; PT-Zelle: gültige Zahl speichert, leer ⇒ `estimate_pt: undefined`, negativ wird verworfen; Status-Dropdown ⇒ `onUpdateTask(id,{column})`; Sprint-Dropdown ⇒ `onAssignSprint(storyId,sprintId)`; Sprint-Zelle ohne Story deaktiviert; Klick auf nicht-editierbare Zelle (Projekt) öffnet via `onRowClick` |
| `e2e/board.spec.ts` | In der Listenansicht einen Titel inline bearbeiten ⇒ neue Bezeichnung sichtbar und **überlebt einen Reload** (Store-Persist) |

Ausführen: `npm run test` (Unit) · `npx playwright test e2e/board.spec.ts` (E2E) · Gate zusätzlich `npm run lint`, `npx tsc --noEmit`, `npm run build`.

> Hinweis: `BoardListView` nutzt – wie `IdeaTable`/`RiskTable` – TanStack Table;
> der React-Compiler meldet die bekannte Info-Warnung „incompatible library"
> (kein Fehler, identisch zu den bestehenden Tabellen).

## Manuell (Klick-Checkliste)

Voraussetzung: `npm run dev`, einige Tasks im Board (ideal mit Personen, Stories
und Sprints), Ansicht auf „Liste" umgeschaltet.

1. **Titel ändern:** Auf einen Titel klicken → Inline-Feld. Neuen Text eingeben,
   **Enter**. → *Erwartet:* Titel aktualisiert, Dialog öffnet **nicht**.
2. **Abbrechen:** Titel anklicken, Text ändern, **Esc**. → *Erwartet:* alter Wert
   bleibt.
3. **Blur speichert:** Titel ändern, daneben klicken (Blur). → *Erwartet:* Wert
   gespeichert.
4. **PT:** PT-Zelle anklicken, Zahl eingeben (z. B. `5`), Enter. → *Erwartet:*
   gespeichert. Feld leeren + Enter → „–". Negative Zahl → keine Übernahme.
5. **Status:** Status-Dropdown öffnen, andere Spalte wählen. → *Erwartet:* Status-
   Badge ändert sich; im Kanban liegt der Task in der neuen Spalte (Done stempelt
   `doneAt`).
6. **Priorität / Assignee:** je Dropdown ändern. → *Erwartet:* persistiert,
   Avatar/Badge aktualisiert.
7. **Sprint:** Bei einem Task **mit Story** den Sprint per Dropdown wählen /
   „Ohne Sprint". → *Erwartet:* Story-Sprint-Zuordnung ändert sich (gilt für alle
   Tasks derselben Story). Bei einem Task **ohne Story** zeigt die Sprint-Zelle
   „–" (nicht editierbar).
8. **Dialog weiterhin erreichbar:** Auf eine nicht-editierbare Stelle der Zeile
   (ID/Projekt/Tags/Zeilenrand) klicken. → *Erwartet:* `TaskDialog` öffnet.
9. **Persistenz:** Nach Inline-Änderungen Seite neu laden (F5). → *Erwartet:*
   Änderungen bleiben erhalten.

## DoD-Abgleich (`docs/testing-strategy.md`)

- [x] Funktioniert lokal (dev) – Inline-Edit für Titel/PT/Status/Priorität/Assignee/Sprint
- [x] Typsicher (`tsc --noEmit` grün), kein `any`
- [x] Lint grün (`npm run lint`; nur die bekannte TanStack-Info-Warnung)
- [x] Unit- & E2E-Tests vorhanden & grün (`tests/task-030/`, `e2e/board.spec.ts`)
- [x] Build grün (`npm run build`)
- [x] Kein Konflikt Zelle ↔ Dialog (Event-Propagation gestoppt); Tastatur (Enter/Esc/Tab)
- [x] Statusfarben nur via `<StatusBadge>`; Spalten-/Statusquelle = `BOARD_COLUMNS`
- [x] Doku aktualisiert (`design-system.md`, `frontend-plan.md`, `task-index.md`, dieses Testkonzept)
