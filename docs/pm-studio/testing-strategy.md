---
module: pm-studio
type: doc
status: current
imported: 2026-07-08
source: projectmind-os
---

# Teststrategie

## Stufenmodell

| Stufe | Werkzeug | Ab Meilenstein | Pflicht für |
|---|---|---|---|
| Manuelle Checkliste | Task-Datei | M1 | jeden Task |
| Lint + Typecheck + Build | ESLint, `tsc --noEmit`, `next build` | M1 | jeden Commit |
| Unit Tests | Vitest | M2 | lib/, store/ |
| Component Tests | Vitest + React Testing Library | M2 | wiederverwendete Komponenten |
| E2E Tests | Playwright | M4 | Kern-Flows (Idee anlegen, Board, Pipeline-Ansicht) |
| Agent Output Tests | Pytest + Pydantic | M6 | Schema-Validität jedes Agenten |
| API Tests | Pytest + httpx | M6 | alle Endpunkte |

> **Status:** Vitest + React Testing Library sind seit TASK-003 **aktiv** (`npm run test`). Automatisierte Tests liegen pro Task in `tests/<task-id>/`, daneben ein `testkonzept.md` mit manueller Testanleitung (verbindlich laut `CLAUDE.md`).

## Definition of Done (jeder Task)

1. Seite/Feature funktioniert manuell (Testschritte der Task-Datei)
2. `npm run lint` und `tsc --noEmit` ohne Fehler
3. `next build` erfolgreich
4. Layout responsive geprüft (1440 / 1024 / 768)
5. Komponenten sauber getrennt, keine Logik in JSX
6. Dummy-Daten typisiert und nachvollziehbar
7. Akzeptanzkriterien der Task-Datei erfüllt
8. Doku aktualisiert (mind. task-index.md, ggf. betroffene docs)

## Agent-Tests (ab M6)

- **Schema-Tests**: Output jedes Agenten gegen Pydantic-Modell (mit festen Beispiel-Inputs)
- **Golden-File-Tests**: erwartete Strukturmerkmale (z. B. ≥3 Epics, jede Story hat AKs), keine exakten Textvergleiche (LLM-Nichtdeterminismus)
- **Pipeline-Test**: kompletter Durchlauf mit Mini-Idee, prüft Datenweitergabe

## Playwright-Kernszenarien

1. Idee anlegen → erscheint in Projektliste
2. Dashboard rendert alle Metrik-Karten
3. Workflow-Seite zeigt Pipeline mit allen Agenten-Knoten
4. Board: Task per Drag&Drop verschieben → Status persistiert nach Reload
