---
module: pm-studio
type: doc
status: frozen
imported: 2026-07-08
source: projectmind-os
---

# TASK-013: Artefakt-Review-Panel

**Meilenstein:** 7 · **Branch:** `feat/task-013-artifact-review-panel`

## Ziel
Ein **Side-Panel** am Stepper bzw. Workflow-Node, das im Zustand „wartet auf Review" das **gerenderte Artefakt** zeigt und die **drei Review-Aktionen** anbietet. „Bearbeiten" markiert das Artefakt mit **Provenienz** `human_edited`. Konzept: `docs/agent-system.md` → „Review-Aktionen am Artefakt".

## Kontext
Setzt TASK-012 (Schritt-Lebenszyklus) voraus. Hier entsteht die menschliche Entscheidungs-UI; die Entscheidung wird im Lauf (`WorkflowRun`) protokolliert.

## Betroffene Dateien
- `src/components/project/ReviewPanel.tsx` (neu)
- Anbindung in `PipelineStepper.tsx` / Workflow-Node bzw. Detailseite
- `src/store/...` (Review-Entscheidung + Provenienz speichern)
- Artefakt-Renderer-Wiederverwendung (DraftView/RequirementsView/BacklogView/RiskTable)

## Technische Anforderungen
- Panel zeigt das **gerenderte** Artefakt des wartenden Schritts (kein rohes JSON).
- Drei Aktionen: **(a) Bestätigen & weiter**, **(b) Bearbeiten** (Inline-Edit → wird Input des Folgeschritts, Provenienz `human_edited`, sichtbare Markierung „von Mensch überarbeitet"), **(c) Erneut ausführen** mit **Feedback-Kommentar** (fließt in den Prompt; bei Mock: in den Lauf protokolliert).
- Entscheidung + Kommentar landen in der Lauf-Historie (`ReviewDecision`).

## Akzeptanzkriterien
- [ ] Panel erscheint bei `awaiting_review`, zeigt das Artefakt gerendert
- [ ] (a)/(b)/(c) funktionieren; „Bearbeiten" setzt Provenienz `human_edited` + Markierung
- [ ] „Erneut ausführen" nimmt einen Kommentar an und erzeugt eine neue Fassung
- [ ] Entscheidungen in der Historie sichtbar; Lint/Typecheck/Test/Build grün + Testkonzept

## Testschritte
1. Lauf bis `awaiting_review` → Panel zeigt Artefakt.
2. Bearbeiten → Markierung „von Mensch überarbeitet"; Folgeschritt nutzt die Fassung.
3. Erneut ausführen mit Kommentar → neue Fassung; Eintrag in Historie.

## Erwartetes Ergebnis
Vollständige menschliche Review-Interaktion am Artefakt, protokolliert im Lauf.

## Dokumentation
`docs/agent-system.md` (vorhanden); `task-index.md`.
