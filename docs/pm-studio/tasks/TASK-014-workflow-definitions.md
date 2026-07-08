---
module: pm-studio
type: doc
status: frozen
imported: 2026-07-08
source: projectmind-os
---

# TASK-014: Workflow-Definitionen (Definition/Run-Trennung)

**Meilenstein:** 7 · **Branch:** `feat/task-014-workflow-definitions`

## Ziel
Die **Trennung von `WorkflowDefinition` (Vorlage) und `WorkflowRun` (Ausführung)** im Datenmodell und Store einführen. Der Standard-Planungs-Workflow wird als **Definition** abgelegt (mitgelieferte, editierbare Vorlage) statt hartkodiert. Grundlage für den Builder (M8). Konzept: `docs/agent-system.md` → „Datenmodell: WorkflowDefinition vs. WorkflowRun".

## Kontext
Heute ist die Pipeline-Reihenfolge fest verdrahtet (`src/data/workflows.ts`, AGENT_NODE_ORDER). Dieser Task macht sie zu Daten: eine Definition mit geordneten Schritten + Gate-Konfiguration, aus der Läufe erzeugt werden.

## Betroffene Dateien
- `src/types/index.ts` (WorkflowDefinition, WorkflowStepDef, WorkflowRun, WorkflowStepRun)
- `src/data/workflow-definitions.ts` (neu: Standard-Planungs-Workflow als Definition + isTemplate)
- `src/store/useWorkflowStore.ts` (neu: Definitionen halten; Lauf aus Definition erzeugen)
- `src/components/workflow/*` (Graph aus Definition statt aus fester Liste rendern)

## Technische Anforderungen
- `WorkflowDefinition` mit `type` (planning/test/quality/retro/cicd), geordneten `steps` (agentId + `reviewRequired`), `isTemplate`.
- Jeder Agent deklariert Input-/Output-Typen → Basis für Verbindungs-Validierung (M8).
- Aus einer Definition wird ein `WorkflowRun` instanziiert (Schritte → Step-Runs).
- Standard-Planungs-Workflow als mitgelieferte Vorlage; FlowCanvas rendert aus der Definition.

## Akzeptanzkriterien
- [ ] Definition/Run-Typen vorhanden; Standard-Workflow als Definition (nicht hartkodiert)
- [ ] FlowCanvas/Stepper rendern aus der Definition
- [ ] Aus einer Definition lässt sich ein Lauf erzeugen
- [ ] Lint/Typecheck/Test/Build grün; Tests + Testkonzept

## Testschritte
1. Standard-Definition laden → Graph entspricht der Planungs-Pipeline.
2. Lauf aus Definition erzeugen → Step-Runs in Reihenfolge.
3. (Vorbereitung M8) Definition programmatisch ändern → Graph ändert sich.

## Erwartetes Ergebnis
Saubere Datengrundlage, auf der der aktive Builder (M8) Definitionen erstellen/editieren kann.

## Dokumentation
`docs/agent-system.md` (vorhanden); `docs/architecture.md` (Domänenmodell, vorhanden); `task-index.md`.
