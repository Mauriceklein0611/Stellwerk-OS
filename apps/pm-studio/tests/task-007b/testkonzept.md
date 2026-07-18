# Testkonzept – TASK-007b: Projektdetailseite-Redesign

Was **automatisiert** getestet wird und was du **manuell** prüfen kannst und sollst.

> Redesign **ohne Funktionslogik-Änderung** – Pipeline/Stores/Schemas unverändert.

## Automatisierte Tests (Vitest)

Ausführen: `npm run test`

| Datei | Prüft |
|---|---|
| `pipeline-steps.test.ts` | `computeStepStatuses`: alles pending (leer); done je Agent + nächster Schritt running; 4 Artefakt-Schritte done aus persistierten Artefakten (nach Reload); PO/Review bleiben pending |
| `PipelineStepper.test.tsx` | Stepper rendert alle 6 Schritt-Labels; Klick auf done-Schritt navigiert (Callback), pending-Schritt ist deaktiviert |

Die bestehenden TASK-007-Tests (RiskTable, BacklogView, severity) bleiben grün.

## Manuelle Tests (Schritt für Schritt)

Vorbereitung: `npm run dev`, ein Projekt unter **Projekte → Name** öffnen.

### 1. Header
- [ ] „← Projekte" als dezenter Ghost-Link oben.
- [ ] Eine Zeile: Titel + Badges („Idee", Vorgehen) links, **„Pipeline ausführen"** rechts.
- [ ] Metadaten-Zeile (muted): Zeitraum · Budget · Team · erstellt am (nur vorhandene Felder).
- [ ] Beschreibung: erste Zeile + **„Mehr anzeigen"/„Weniger"** klappt (kein Reload-Persist).

### 2. Pipeline-Stepper (immer sichtbar, unter Header)
- [ ] **Leer:** alle Schritte outline/ausstehend (Draft → Requirements → Scrum → PO → Risk → Review).
- [ ] **Während Lauf:** fertige Schritte = grüner Check, aktueller = primary mit **Pulse**.
- [ ] **Nach Lauf / Reload:** Draft/Requirements/Scrum/Risk = done; PO/Review bleiben ausstehend (Mock führt sie nicht aus).
- [ ] Klick auf einen **done**-Schritt wechselt zum passenden Tab (Draft→Entwurf, Scrum→Backlog, Risk→Risiken).

### 3. Tabs
- [ ] Horizontal unter dem Stepper, Reihenfolge **Übersicht | Idee | Entwurf | Requirements | Backlog | Risiken**; kein linker Leerraum.
- [ ] **Übersicht** ist der Default-Tab; Inhalt zentriert, max. ~1200px.

### 4. Übersicht-Tab
- [ ] Ohne Artefakte: **ein** Empty State (Erklärung + Verweis auf Header-Button).
- [ ] Mit Artefakten: 4 Karten (MVP, Top-Risiken, Backlog-Kennzahlen Epics/Stories/Σ PT, letzte Läufe); „Zum Tab"-Links wechseln zum jeweiligen Tab.

### 5. Idee-Tab
- [ ] Read-only: Problem/Zielgruppe/Nutzen als Textkarten, Features als Liste, Einschränkungen als Badges, Rahmen (Vorgehen/Zeitraum/Budget/Team) als Metadaten.

### 6. Fixes / Entwurf-Tab
- [ ] Phasen: Name links, Dauer als **muted Badge rechtsbündig**, sauberer Abstand.
- [ ] Karten im 2-Spalten-Grid wirken einheitlich (Höhe/Padding).

### 7. Responsive
- [ ] 1440 / 1024 / 768: Header, Stepper (scrollt horizontal falls eng), Tabs und Grids bleiben lesbar, kein ungewollter Overflow.

## Definition of Done
- [ ] `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npm run test` grün
- [ ] Keine Funktionslogik-Änderung
- [ ] **Visuelle Abnahme durch den Nutzer vor dem Merge** (verbindlich)
