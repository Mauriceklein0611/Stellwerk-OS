# Testkonzept – TASK-006: Workflow-Visualisierung

Was **automatisiert** getestet wird und was du **manuell** prüfen kannst und sollst.

## Automatisierte Tests

| Datei | Werkzeug | Prüft |
|---|---|---|
| `tests/task-006/workflow-data.test.ts` | Vitest (`npm run test`) | Pipeline-Definition: 8 Knoten (Input + 6 Agenten + Output), 7 sequenzielle Kanten, Startstatus idle |
| `e2e/workflow.spec.ts` | Playwright (`npm run test:e2e`) | `/workflows` lädt; alle Knoten-Labels sichtbar; „Pipeline simulieren"-Button vorhanden |

> Hinweis: Der E2E-Test liegt laut Task in `e2e/` (so von Playwright konfiguriert), die Vitest-Tests in `tests/task-006/`.
> Playwright braucht einmalig Browser: `npx playwright install chromium`.

## Manuelle Tests (Schritt für Schritt)

Vorbereitung: `npm run dev`, in der Sidebar **Workflows** öffnen.

### 1. Pipeline-Darstellung
- [ ] Graph zeigt **Input (Projektidee) → Draft → Requirements → Scrum → PO → Risk → Review → Output (Artefakte)**, korrekt verbunden.
- [ ] Agenten-Knoten: Icon, Name, StatusBadge; Input/Output als runde Knoten.
- [ ] Dark-Theme-Canvas; alle Knoten starten **idle**.

### 2. Zoom / Pan
- [ ] Mit Mausrad zoomen, Canvas verschieben; Controls (unten links) funktionieren.
- [ ] Knoten lassen sich **nicht** verschieben/verbinden (read-only).

### 3. Simulation
- [ ] **„Pipeline simulieren"** klicken → Knoten wechseln **von links nach rechts** sequenziell idle → **running (Pulse)** → success; die Kante zum laufenden Knoten ist **animiert**.
- [ ] Button ist während des Laufs deaktiviert; am Ende sind alle Knoten **success**.

### 4. Knoten-Sheet
- [ ] Klick auf einen **Agenten-Knoten** → Side-Sheet mit Kurzinfo (Rolle, Input, Output) + **Link „Zur Agenten-Detailseite"** (→ `/agents/<id>`).
- [ ] Klick auf Input/Output → kurze Erklärung.

### 5. Responsive
- [ ] 1440 / 1024 / 768: Canvas skaliert (fitView), bleibt bedienbar.

## Definition of Done
- [ ] `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npm run test`, `npm run test:e2e` grün
- [ ] Pipeline vollständig/verbunden; Simulation sichtbar links→rechts; Canvas zoom-/pan-bar, Knoten nicht editierbar
- [ ] Status nur über `<StatusBadge>`; Dark-Theme
- [ ] **Visuelle Abnahme durch den Nutzer vor dem Push**
