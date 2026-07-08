---
module: pm-studio
type: doc
status: frozen
imported: 2026-07-08
source: projectmind-os
---

# TASK-012: HITL-Schritt-Lebenszyklus

**Meilenstein:** 7 · **Branch:** `feat/task-012-hitl-step-lifecycle`

## Ziel
Mock-Pipeline (`AgentService`) und Stores auf den **Human-in-the-Loop-Lebenszyklus** umstellen: Ein Lauf läuft **nicht** automatisch durch, sondern **pausiert nach jedem Schritt** im Zustand „wartet auf Review", bis der Mensch freigibt. Konzept: `docs/agent-system.md` → „Schritt-Lebenszyklus".

## Kontext
Heute führt `runPipeline` alle Schritte am Stück aus (TASK-009). Dieser Task ersetzt das Durchlaufen durch ein **schrittweises** Modell mit Gates. Reine Mock-/Frontend-Stufe (echtes Backend erst M7-Backend).

## Betroffene Dateien
- `src/types/index.ts` (StepStatus, Provenance, WorkflowRun/Step-Run-Typen)
- `src/lib/agent-service.ts` / `mock-agent-service.ts` (Schritt-für-Schritt-API statt Komplettlauf)
- `src/store/useAgentStore.ts` bzw. neuer `useWorkflowRunStore.ts` (Lauf-Status je Schritt, Pausieren)
- `src/components/project/PipelineStepper.tsx` (Zustände `awaiting_review`/`approved`/`failed` darstellen)

## Technische Anforderungen
- Lebenszyklus je Schritt: `pending → running → awaiting_review → approved → (nächster) `, plus `failed`.
- `AgentService` bietet **schrittweises** Ausführen (`runStep`/`advance`), nicht nur `runPipeline`.
- Gate je Schritt: `reviewRequired` (Default `true`); `false` = Auto-Continue ohne Stopp.
- Lauf hält bei `awaiting_review` an; erst eine Freigabe startet den Folgeschritt.
- Stepper spiegelt die fünf Zustände eindeutig (Farben über `<StatusBadge>`/Tokens).

## Akzeptanzkriterien
- [ ] Ein Lauf stoppt nach jedem Schritt in `awaiting_review` (bei `reviewRequired: true`)
- [ ] Auto-Continue-Schritte (`reviewRequired: false`) laufen ohne Stopp weiter
- [ ] Lauf-Status je Schritt im Store, reload-fest soweit sinnvoll
- [ ] Lint/Typecheck/Test/Build grün; Tests + `tests/task-012/testkonzept.md`

## Testschritte
1. Lauf starten → nach Schritt 1 Zustand „wartet auf Review", kein Weiterlaufen.
2. Freigeben → Schritt 2 startet, hält erneut an.
3. Einen Schritt auf Auto-Continue setzen → wird übersprungen (kein Stopp).

## Erwartetes Ergebnis
Schrittweises, pausierendes Ausführungsmodell als Grundlage für Review-Panel (TASK-013) und Builder-Gates (M8).

## Dokumentation
`docs/agent-system.md` (bereits vorhanden); `task-index.md`.
