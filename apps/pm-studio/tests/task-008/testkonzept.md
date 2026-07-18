# Testkonzept – TASK-008: Kanban-Board

Was **automatisiert** getestet wird und was du **manuell** prüfen kannst und sollst.

## Automatisierte Tests

| Datei | Werkzeug | Prüft |
|---|---|---|
| `tests/task-008/useBoardStore.test.ts` | Vitest (`npm run test`) | Store-Logik: `addTask` vergibt `order` ans Spaltenende, `moveTask` sortiert innerhalb einer Spalte um und verschiebt zwischen Spalten, `updateTask` patcht Felder und vergibt bei Spaltenwechsel neue `order`, `hasStoryTask` erkennt aus dem Backlog erzeugte Tasks |
| `tests/task-008/BacklogView.test.tsx` | Vitest (`npm run test`) | „In Board übernehmen" erzeugt einen Backlog-Task mit Story-Referenz; Button wird danach zu „Im Board" und ist deaktiviert (keine Duplikate) |
| `e2e/board.spec.ts` | Playwright (`npm run test:e2e`) | `/board` rendert alle Spalten mit Zählern; **Drag&Drop** verschiebt eine Karte in eine andere Spalte und der Zustand bleibt nach **Reload** erhalten; Projektfilter blendet Tasks anderer Projekte in allen Spalten aus |

> Playwright braucht einmalig Browser: `npx playwright install chromium`.

## Manuelle Tests (Schritt für Schritt)

Vorbereitung: `npm run dev`, in der Sidebar **Board** öffnen.

### 1. Spalten & Layout
- [ ] 6 Spalten sichtbar: **Backlog, To Do, In Progress, Review, Testing, Done**, jede mit Zähler im Header.
- [ ] Leere Spalten zeigen „Keine Tasks".

### 2. Task aus Backlog übernehmen
- [ ] In einem Projekt mit Backlog (`/projects/<id>` → Tab **Backlog**) bei einer Story **„In Board übernehmen"** klicken.
- [ ] Task erscheint im Board in **Backlog** (Titel, Projekt, Story-Referenz, Schätzung, Prioritäts-Badge, „Nicht zugewiesen").
- [ ] Button wechselt zu **„Im Board"** und ist deaktiviert – erneuter Klick erzeugt **keinen** zweiten Task.

### 3. Drag & Drop
- [ ] Mehrere Tasks per Drag&Drop zwischen allen 6 Spalten verschieben; Zähler aktualisieren sich live.
- [ ] Innerhalb einer Spalte per Drag&Drop umsortieren.
- [ ] Tastatur: Karte fokussieren, **Leertaste** zum Aufnehmen, **Pfeiltasten** zum Verschieben, **Leertaste** zum Ablegen.
- [ ] **Reload** der Seite → Spalten/Reihenfolge identisch zum Stand vor dem Reload.

### 4. Projektfilter
- [ ] Filter oben rechts auf ein Projekt setzen → in **allen** Spalten sind nur Tasks dieses Projekts sichtbar, Zähler passen sich an.
- [ ] Filter auf „Alle Projekte" zurücksetzen → alle Tasks wieder sichtbar.

### 5. Task-Dialog
- [ ] Klick auf eine Karte öffnet den Dialog (Titel, Beschreibung, Spalte, Priorität).
- [ ] Änderungen speichern → Karte/Spalte aktualisiert sich; Spaltenwechsel über den Dialog verschiebt die Karte ans Ende der Zielspalte.
- [ ] „Abbrechen" verwirft Änderungen.

## Definition of Done
- [ ] `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npm run test`, `npm run test:e2e` grün
- [ ] Drag&Drop inkl. Tastatur-Support; Persistenz über Reload
- [ ] „In Board übernehmen" ohne Duplikate; Projektfilter wirkt auf alle Spalten
- [ ] Prioritäts-Farben nur über `<StatusBadge>`/`severityBadge`; Dark-Theme
- [ ] **Visuelle Abnahme durch den Nutzer vor dem Push** (sofern angekündigt, sonst automatischer Flow gemäß CLAUDE.md)
