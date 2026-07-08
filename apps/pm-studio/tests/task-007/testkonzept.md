# Testkonzept – TASK-007: Projektdetailseite

Was **automatisiert** getestet wird und was du **manuell** prüfen kannst und sollst.

## Automatisierte Tests (Vitest)

Ausführen: `npm run test`

| Datei | Prüft |
|---|---|
| `RiskTable.test.tsx` | Zeile je Risiko (Titel, Maßnahme); Level-Farbcodierung über StatusBadge-Labels („Hoch" …) |
| `BacklogView.test.tsx` | Epics als Accordion; offenes Epic zeigt Story, AKs und Prioritäts-Badge |
| `severity.test.ts` | Priorität/Severity → StatusBadge-Mapping (hoch→danger „Hoch" usw.) |

Erwartung: alle grün.

## Manuelle Tests (Schritt für Schritt)

Vorbereitung: `npm run dev`, http://localhost:3000 öffnen. Falls noch keine Idee existiert: unter **New Idea** eine anlegen.

### 1. Navigation zur Detailseite
- [ ] Unter **Projekte** auf einen **Projektnamen** klicken → Detailseite `/projects/<id>` öffnet sich.
- [ ] Header zeigt Name, Beschreibung, Badges „Idee" + Vorgehen, „← Projekte"-Link.

### 2. Empty-States (vor der Simulation)
- [ ] Alle vier Tabs (**Entwurf, Requirements, Backlog, Risiken**) zeigen „Noch kein Entwurf – Pipeline ausführen." mit Button.

### 3. Pipeline-Simulation
- [ ] **„Pipeline ausführen (Simulation)"** klicken.
- [ ] Während des Laufs (~5 s): Status-Text mit Spinner („Erstelle Projektentwurf …" → … → „Pipeline abgeschlossen."), Button deaktiviert.
- [ ] Danach sind **alle 4 Tabs gefüllt**:
  - **Entwurf:** Zielbild, Nutzen, MVP (mit Features), Phasen, offene Fragen.
  - **Requirements:** funktional / nicht-funktional / technisch / … als Listen.
  - **Backlog:** Epics aufklappbar; Stories mit **AKs**, **PT**-Schätzung und **farbcodierter Prioritäts-Badge**.
  - **Risiken:** Tabelle mit Wahrscheinlichkeit/Auswirkung/Priorität (farbcodiert) + Maßnahme.

### 4. Input-Sensitivität
- [ ] Zwei verschiedene Ideen (unterschiedliche Features) → erkennbar unterschiedliche Entwürfe/Stories.

### 5. Persistenz
- [ ] Nach der Simulation **Seite neu laden (F5)** → die Artefakte sind weiterhin da (persistiert pro Projekt).

### 6. Sortierung & Aufklappen
- [ ] Risikotabelle: Spaltenköpfe (Risiko/Wahrscheinlichkeit/Auswirkung/Priorität) klicken → Sortierung wechselt.
- [ ] Backlog: Epics auf-/zuklappen.

### 7. Empty/Not-Found
- [ ] Aktivitäts-Feed auf dem Dashboard zeigt nach der Simulation die echten Läufe (innerhalb der Session).
- [ ] Direkt eine ungültige URL `/projects/gibtsnicht` öffnen → „Projekt nicht gefunden." mit Link zur Liste.

### 8. Responsiveness
- [ ] Fenster ~700px → Tabs/Karten/Tabelle bleiben lesbar, kein horizontales Scrollen.

## Definition of Done (Abgleich `docs/testing-strategy.md`)
- [ ] `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npm run test` grün
- [ ] Empty-States vorhanden; nach Simulation alle Tabs gefüllt + persistiert
- [ ] Prioritäten farbcodiert (über StatusBadge); keine Ad-hoc-Farben
- [ ] Layout bei 1440 / 1024 / 768 geprüft
