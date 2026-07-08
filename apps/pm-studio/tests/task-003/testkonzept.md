# Testkonzept – TASK-003: Dashboard-UI

Dieses Dokument beschreibt, **was automatisiert getestet wird** und **was du manuell prüfen kannst und sollst**.

## Automatisierte Tests (Vitest)

Ausführen: `npm run test`

| Datei | Prüft |
|---|---|
| `StatusBadge.test.tsx` | Status → Farbe/Label-Mapping; Default-Label je Status; `text-success`/`text-danger`-Klassen; expliziter Label-Override |
| `MetricCard.test.tsx` | Karte rendert Label, Wert und Trend aus den Daten (keine Hartkodierung) |
| `format.test.ts` | Relative Zeit: „gerade eben", Minuten, Stunden, Tage (deterministisch über injizierten Zeitpunkt) |

Erwartung: **alle grün, ≥ 4 Tests**.

## Manuelle Tests (Schritt für Schritt)

Vorbereitung: `npm run dev`, dann http://localhost:3000 öffnen.

### 1. Dashboard rendert vollständig aus Dummy-Daten
- [ ] Vier Metrik-Karten oben: **Aktive Projekte, Laufende Sprints, Offene Aufgaben, Offene Risiken** mit Wert + Trend-Pille.
- [ ] Darunter drei Panels: **Agenten-Aktivität**, **Status**, **Projektfortschritt**.
- [ ] Erwartet: Look wie ein modernes SaaS-Dashboard (vgl. `docs/design-system.md`), Zahlen in Monospace (`tabular-nums`).

### 2. Daten sind die einzige Quelle (keine Hartkodierung)
- [ ] In `src/data/dashboard.ts` einen Wert ändern (z. B. `value: 8` → `99` bei „Aktive Projekte").
- [ ] Seite neu laden → die Karte zeigt **99**. (Beweist: UI rendert aus Daten.)
- [ ] Änderung danach zurücknehmen.

### 3. StatusBadge ist die einzige Status-Farbquelle
- [ ] Im Panel **Agenten-Aktivität** und **Status** prüfen, dass Status-Pillen farbig sind:
  - grün = OK/Erfolg, gelb = Warnung, rot = Kritisch, blau = Info, grau = Inaktiv, indigo (pulsierend) = Läuft.
- [ ] Der **Läuft**-Status pulsiert dezent (außer bei aktiviertem „Reduce Motion" im OS – dann statisch).

### 4. Agenten-Aktivität
- [ ] Liste zeigt die letzten Läufe mit **Agent, Projekt, Status-Badge, relativer Zeit** („vor 3 min", „vor 2 h" …).

### 5. Projektfortschritt
- [ ] Jede Zeile hat einen **Fortschrittsbalken**, dessen Breite zum Prozentwert passt (z. B. 90 % fast voll, 28 % knapp).

### 6. Responsiveness (Fenster verkleinern)
- [ ] **≥ 1280 px:** Metrik-Karten in 4 Spalten, Panels in **3 Spalten**.
- [ ] **≥ 768 px:** Metrik-Karten 2 Spalten, Panels **2 Spalten**.
- [ ] **< 768 px:** alles **1-spaltig**, kein horizontales Scrollen.

### 7. Leerzustände (optional, für Reviewer)
- [ ] In `src/app/(dashboard)/page.tsx` testweise eine leere Liste übergeben (z. B. `runs={[]}`) → Panel zeigt eine Empty-State-Meldung statt einer leeren Box. Danach zurücksetzen.

## Definition of Done (Abgleich mit `docs/testing-strategy.md`)
- [ ] `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npm run test` grün
- [ ] Layout bei 1440 / 1024 / 768 geprüft
- [ ] Keine hartkodierten Werte im JSX; Dummy-Daten typisiert
