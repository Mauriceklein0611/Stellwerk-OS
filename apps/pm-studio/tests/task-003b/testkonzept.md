# Testkonzept – TASK-003b: Dashboard-Charts

Was **automatisiert** getestet wird und was du **manuell** prüfen kannst und sollst.

## Automatisierte Tests (Vitest)

Ausführen: `npm run test`

| Datei | Prüft |
|---|---|
| `status-colors.test.ts` | `STATUS_COLOR_VARS` bildet jeden Status auf eine Token-CSS-Variable ab; keine rohen Hex-Farben |
| `Sparkline.test.tsx` | rendert nichts bei leeren Daten; rendert einen Chart-Container bei Daten |
| `TaskStatusDonut.test.tsx` | Legende zeigt Labels + Counts aus den Daten; Empty-State ohne Daten |

Erwartung: **alle grün** (zusammen mit den TASK-003-Tests).

## Manuelle Tests (Schritt für Schritt)

Vorbereitung: `npm run dev`, http://localhost:3000 öffnen.

### 1. Alle fünf Chart-Typen sind sichtbar
- [ ] **Sparklines:** Unter jeder der 4 Metrik-Karten verläuft eine kleine Trendlinie (Mini-Area).
- [ ] **Sprint-Burndown:** Area-Chart mit fallender Ist-Linie **und** gestrichelter Ideallinie.
- [ ] **Aufgaben nach Status (Donut):** Ring mit farbigen Segmenten + Legende (Label + Anzahl).
- [ ] **Velocity:** vertikale Balken je Sprint (S-18 … S-23).
- [ ] **Agentenläufe (Dauer):** horizontale Balken je Agent.

### 2. Daten sind die einzige Quelle
- [ ] In `src/data/dashboard.ts` einen Burndown-Punkt ändern (z. B. `remaining: 8` → `40` bei „Tag 9").
- [ ] Seite neu laden → die Burndown-Kurve ändert sich entsprechend. Danach zurücknehmen.
- [ ] Analog: einen `taskStatusDistribution`-Count ändern → Donut-Segment + Legende passen sich an.

### 3. Farben kommen nur aus Design-Tokens
- [ ] Donut-Segmente nutzen die **Status-Farben** (grün=Erledigt, indigo=In Arbeit, blau=In Review, gelb=Blockiert, grau=Backlog).
- [ ] Burndown/Velocity = Primärfarbe (Indigo), Agentenläufe = Accent (Cyan). Keine fremden Ad-hoc-Farben.

### 4. reduced-motion wird respektiert
- [ ] OS-Einstellung „Bewegung reduzieren" aktivieren (Windows: Einstellungen → Barrierefreiheit → Visuelle Effekte → Animationseffekte aus).
- [ ] Seite neu laden → Charts erscheinen **ohne** Einblende-/Wachstums-Animation (sofort final).
- [ ] Einstellung wieder aus → beim Neuladen animieren die Charts dezent.

### 5. Responsiveness
- [ ] **≥ 1280 px:** Burndown breit (2 Spalten) neben Donut; Velocity + Agentenläufe nebeneinander.
- [ ] **≥ 768 px:** zweispaltig.
- [ ] **< 768 px:** alles einspaltig, Charts skalieren mit, **kein** horizontales Scrollen.

### 6. Empty-States (optional, für Reviewer)
- [ ] In `src/app/(dashboard)/page.tsx` testweise `data={[]}` an ein Chart geben → „Keine Daten." statt leerem Chart. Danach zurücksetzen.

## Definition of Done (Abgleich `docs/testing-strategy.md`)
- [ ] `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npm run test` grün
- [ ] Layout bei 1440 / 1024 / 768 geprüft
- [ ] Keine hartkodierten Werte/Farben im JSX; Dummy-Daten typisiert
