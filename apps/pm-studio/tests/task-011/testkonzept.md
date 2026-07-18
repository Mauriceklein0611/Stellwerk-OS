# Testkonzept – TASK-011: Dashboard – Live-Daten

Das Dashboard liest jetzt aus den lokalen Stores (`useProjectStore`,
`useBoardStore`, `useAgentStore`) statt aus statischen Dummy-Daten.

## Automatisierte Tests

| Datei | Werkzeug | Prüft |
|---|---|---|
| `tests/task-011/dashboard-selectors.test.ts` | Vitest (`npm run test`) | Selektoren: `selectMetrics` (Projekte/Sprints/Stories/Risiken + Nullzustand), `selectProjects` (Fortschritt aus „done"-Board-Tasks, Status-Mapping), `selectTaskStatusDistribution` (Spalten → eindeutige Status-Slices, leer ohne Tasks), `selectVelocity` (geplante Punkte je Sprint, leer ohne Artefakte) |
| `tests/task-011/empty-states.test.tsx` | Vitest (`npm run test`) | Empty-States mit CTA: `ActivityFeed` → „Pipeline … starten" (`/projects`), `ProgressList` → „Erste Idee anlegen" (`/ideas/new`), `DashboardEmpty` → beide Primär-CTAs |

> Hinweis: Die Recharts-Diagramme werden in jsdom nicht eigens gerendert
> getestet; ihre Empty-States (`ChartEmpty`) sind bereits seit TASK-003b vorhanden.

## Manuelle Tests (Schritt für Schritt)

### 1. Frischer Zustand (Empty-States + CTAs)
- [ ] localStorage leeren (DevTools → Application → Local Storage → löschen) und `/` öffnen.
- [ ] Oben erscheint der **„Noch keine Projekte"**-Banner mit Buttons **„Erste Idee anlegen"** und **„Projekte ansehen"**.
- [ ] Metrik-Karten zeigen überall **0**.
- [ ] Aktivitäts-Feed zeigt „Noch keine Agentenläufe." + CTA **„Pipeline … starten"**.
- [ ] Projektfortschritt zeigt „Noch keine Projekte vorhanden." + CTA **„Erste Idee anlegen"**.
- [ ] Donut und Velocity zeigen „Keine Daten."
- [ ] Keine Hydration-Warnung in der Browser-Konsole.

### 2. Mit echten Daten
- [ ] `/ideas/new` → Idee anlegen.
- [ ] Im Projekt **„Pipeline ausführen (Simulation)"** → Aktivitäts-Feed füllt sich mit Läufen; Metriken (Sprints/Aufgaben/Risiken) steigen; Velocity zeigt geplante Punkte je Sprint.
- [ ] Im Backlog Stories **„In Board übernehmen"**, im Board einige auf **Done** ziehen → Donut („Aufgaben nach Status") und Projektfortschritt aktualisieren sich.

### 3. Reload-Festigkeit
- [ ] Seite neu laden → Ideen/Artefakte/Board (persistiert) erscheinen wieder; Metriken, Donut, Velocity, Fortschritt bleiben gefüllt.
- [ ] Der Aktivitäts-Feed ist nach Reload leer (Läufe sind bewusst transient, nicht persistiert) und zeigt wieder seinen Empty-State.

### 4. Beispiel-Bereich
- [ ] Der Abschnitt **„Beispiel-Visualisierungen"** (Burndown, Status-Grid, Agentenlauf-Dauern) ist klar als **Demo** gekennzeichnet.

## DoD-Abgleich (`docs/testing-strategy.md`)
- [ ] Live-Bereiche lesen aus den Stores – keine hartkodierten Dummy-Arrays im JSX (Demo-Teile als „Beispiel" markiert)
- [ ] Empty-State je Bereich mit sinnvollem CTA
- [ ] SSR-sicher über `useHydrated`, kein Hydration-Mismatch
- [ ] Reload-fest (persistierte Ideen/Artefakte/Board)
- [ ] Status-Farben nur via `<StatusBadge>`; Chart-Farben nur aus Design-Tokens
- [ ] `npm run lint`, `npx tsc --noEmit`, `npm run test`, `npm run build` grün
