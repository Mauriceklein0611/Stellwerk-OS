# Testkonzept – TASK-005: Agenten-Karten & Übersicht

Was **automatisiert** getestet wird und was du **manuell** prüfen kannst und sollst.

## Automatisierte Tests (Vitest)

Ausführen: `npm run test`

| Datei | Prüft |
|---|---|
| `simulate-agent-run.test.ts` | `simulateAgentRun`: sofort `running`, nach 3s `success` + neuer Lauf (Fake-Timer) |
| `AgentCard.test.tsx` | Karte rendert Name, Rolle, Status-Badge; verlinkt auf `/agents/<id>` |
| `AgentOutputView.test.tsx` | Output wird als formatiertes JSON dargestellt |

Erwartung: alle grün.

## Manuelle Tests (Schritt für Schritt)

Vorbereitung: `npm run dev`, in der Sidebar **Agents** öffnen.

### 1. Übersicht
- [ ] **10 Agenten-Karten** (Projektentwurf, Requirements, Scrum, PO, Risiko, Review, Test, CI/CD, Qualität, Retro).
- [ ] Je Karte: Icon, Name, Kurzrolle, **StatusBadge** (idle/success/„Fehler" beim CI/CD-Agent), „Letzter Lauf"-Zeit.
- [ ] Grid: 3-spaltig ≥1280px, 2-spaltig ≥768px, 1-spaltig darunter.

### 2. Detailseite
- [ ] Auf eine Karte klicken → `/agents/<id>`.
- [ ] Header: Icon, Name, Rolle, StatusBadge, **„Run (Simulation)"**-Button.
- [ ] Tab **Übersicht**: Rolle/Beschreibung, Input, Output.
- [ ] Tab **Läufe**: Liste der Läufe (scrollbar). Klick auf einen Lauf → **Side-Sheet** mit **Output als formatiertem JSON** (Mono).

### 3. Run-Simulation (Statuswechsel)
- [ ] „Run (Simulation)" klicken → Status wechselt **3 s auf „Läuft"** (Badge **pulsiert**), Button deaktiviert.
- [ ] Danach: Status **„Erfolg"**, ein **neuer Lauf** erscheint oben in der Läufe-Liste.
- [ ] Zurück zur Übersicht → die Karte zeigt den neuen Status/Zeit (innerhalb der Session).

### 4. Not-Found
- [ ] URL `/agents/gibtsnicht` → 404-Seite.

### 5. Responsive
- [ ] 1440 / 1024 / 768: Karten-Grid, Header und Tabs bleiben lesbar.

## Definition of Done
- [ ] `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npm run test` grün
- [ ] Alle 10 Agenten + Detailrouten; Simulation sichtbar (Pulse); Output lesbar (Mono)
- [ ] Status nur über `<StatusBadge>`; keine Ad-hoc-Farben
- [ ] **Visuelle Abnahme durch den Nutzer vor dem Push**
