---
module: pm-studio
type: doc
status: current
imported: 2026-07-08
source: projectmind-os
---

# Agenten-System

## Agentenrollen

| Agent | Input | Output |
|---|---|---|
| Projektentwurfs-Agent | ProjectIdea | ProjectDraft (Beschreibung, Zielbild, Nutzen, Zielgruppe, MVP, Phasen, erste Risiken, offene Fragen) |
| Requirements-Agent | ProjectDraft | Requirements (funktional, nicht-funktional, technisch, Abhängigkeiten, Annahmen, Budgettreiber, Zeitrisiken, Klärungspunkte) |
| Scrum-Agent | Requirements | Epics, Features, User Stories + Akzeptanzkriterien, Schätzung (PT), Sprintvorschläge, Backlog, Prioritäten |
| Product-Owner-Agent | Backlog | MVP-Fokus, Nutzen je Feature, Priorisierung, Scope-Empfehlung, Sprintziele, Release-Fähigkeit |
| Risiko-Agent | Draft + Backlog | Risikoregister (Wahrscheinlichkeit, Auswirkung, Maßnahmen, Priorität, Eskalation) |
| Review-Agent | alle Artefakte | Qualitätsbefund: Vollständigkeit, Widersprüche, fehlende AKs, unklare Tasks, Planungsrisiken |
| Test-Agent (später) | User Stories | Testfälle, Akzeptanztests, UI-Testideen, Regressionsvorschläge, Abdeckungsbewertung |
| CI/CD-Agent (später) | Repo-Kontext | Deployment-Schritte, Actions-Review, Release-Checkliste |
| Qualitäts-Agent (später) | Repo + Artefakte | Bewertung Code-/Doku-Qualität, Testabdeckung, UI-Konsistenz, Tech Debt |
| Retro-Agent (später) | Retro-Daten | Muster über Sprints, Maßnahmenvorschläge |

> **Ausblick – Story → Aufgaben (TASK-037):** Die manuelle Zerlegung einer
> `UserStory` in Dev-Aufgaben (Board-Tasks mit `storyId`, siehe
> `docs/architecture.md`) ist der Andockpunkt für einen späteren **Task-Ableitungs-/
> Test-Agenten**: Er konsumiert eine Story + Akzeptanzkriterien und erzeugt
> dieselben `BoardTask`-Einheiten, die heute von Hand entstehen – ohne neues
> Datenmodell. Die reinen Helfer in `src/lib/story-tasks.ts` (Roll-up, Entkopplung)
> bleiben dabei die einzige Quelle für Fortschritt und Konsistenz.

## Output-Schemas

Jeder Agent liefert **ausschließlich valides JSON** nach einem fest definierten Schema (Pydantic im Backend, gespiegelte TS-Typen im Frontend). Beispiel ProjectDraft:

```json
{
  "summary": "...",
  "vision": "...",
  "value_proposition": "...",
  "target_group": "...",
  "mvp": { "description": "...", "features": ["..."] },
  "phases": [{ "name": "...", "goal": "...", "duration_weeks": 2 }],
  "initial_risks": [{ "title": "...", "note": "..." }],
  "open_questions": ["..."]
}
```

## Frontend-Schnittstelle: `AgentService` (ab TASK-009)

UI und Stores sprechen ausschließlich mit dem Interface `AgentService`
(`src/lib/agent-service.ts`): `runDraft`, `runRequirements`, `runScrum`,
`runRisk`, `runPipeline`. Bis zum Backend liefert eine **deterministische
Mock-Implementierung** (`mock-agent-service.ts`) schema-konforme Artefakte aus
den Idee-Feldern (mit künstlicher Latenz/Status). `getAgentService()` ist die
einzige Stelle, die die konkrete Implementierung kennt – in M6 wird sie gegen
einen API-Client getauscht, **ohne UI-Änderung**. Die TS-Artefakttypen
(`src/types`) spiegeln die untenstehenden JSON-Schemas 1:1 (snake_case).

## Workflow-Datenmodell (ab TASK-006)

Die Pipeline wird als Graph visualisiert (React Flow). Knoten und Kanten liegen
typisiert in `src/data/workflows.ts` (`Input → Draft → Requirements → Scrum → PO
→ Risk → Review → Output`, feste Positionen). Dieses Datenmodell trägt später
echte Lauf-Stati und – ab M8 – den Drag-&-Drop-Builder.

## Human-in-the-Loop: Schritt-Lebenszyklus

Ein Workflow-Lauf läuft **nicht automatisch durch**. Nach **jedem** Agenten **pausiert** der Lauf und wartet auf eine menschliche Entscheidung. Lebenszyklus je Schritt:

`ausstehend → läuft → wartet auf Review → freigegeben → (nächster Schritt)`

Dazu der Sonderzustand `fehlgeschlagen` (Schema-/Laufzeitfehler, siehe Fehlerstrategie).

| Zustand | Bedeutung |
|---|---|
| `pending` (ausstehend) | Schritt noch nicht gestartet |
| `running` (läuft) | Agent erzeugt sein Artefakt |
| `awaiting_review` (wartet auf Review) | Artefakt liegt vor, der Lauf **hält an** |
| `approved` (freigegeben) | Mensch hat bestätigt → nächster Schritt wird ausführbar |
| `failed` (fehlgeschlagen) | Abbruch; „erneut ausführen" möglich |

Pro Schritt konfigurierbar über das **Gate**: `review_required: true` (**Default**) hält an; `review_required: false` (**Auto-Continue**) springt direkt weiter. So lassen sich einzelne Schritte automatisieren, ohne den Default „Mensch entscheidet" aufzugeben.

## Review-Aktionen am Artefakt

Im Zustand „wartet auf Review" stehen am Artefakt drei Aktionen:

1. **Bestätigen & weiter** – Artefakt wird `approved`, der Folgeschritt startet (oder wartet, falls dessen Gate aktiv ist).
2. **Bearbeiten** – Der Mensch ändert das Artefakt direkt. Die überarbeitete Fassung wird **Input des Folgeschritts** und am Artefakt als **„von Mensch überarbeitet"** markiert (**Provenienz** `human_edited` statt `agent`).
3. **Erneut ausführen mit Feedback** – Ein Freitext-Kommentar fließt in den **Prompt** des Agenten ein; der Schritt läuft erneut und erzeugt eine neue Fassung.

Provenienz je Artefakt(version): `agent | human_edited`.

## Workflow-Typen statt Monolith-Pipeline

Statt einer einzigen großen Pipeline gibt es **mehrere Workflow-Typen**. Jeder Agent deklariert **Input- und Output-Typen** (siehe Tabelle „Agentenrollen"); daraus ergibt sich, welche **Verkettungen gültig** sind (ein Schritt darf nur an einen anschließen, dessen Input zum Output des Vorgängers passt).

| Workflow-Typ | Kette | Zweck |
|---|---|---|
| **Planungs-Workflow** | Idee → Draft → Requirements → Scrum → PO → Risk → Review | Von der Idee zum geplanten Projekt |
| **Test-Workflow** | User Stories → Test-Agent → Testfälle | Tests aus dem Backlog ableiten |
| **Qualitäts-Workflow** | Artefakte/Repo → Qualitäts-Agent | Qualitäts-/Tech-Debt-Bewertung |
| **Retro-Workflow** | Sprintdaten → Retro-Agent | Muster & Maßnahmen über Sprints |
| **CI/CD-Workflow** (später) | Repo-Kontext → CI/CD-Agent | Deployment-/Release-Schritte |

Zuordnung aller 10 Agentenrollen zu Workflow-Typen:

| Agent | Workflow-Typ(en) |
|---|---|
| Projektentwurfs-Agent | Planung |
| Requirements-Agent | Planung |
| Scrum-Agent | Planung |
| Product-Owner-Agent | Planung |
| Risiko-Agent | Planung |
| Review-Agent | Planung, Qualität |
| Test-Agent | Test |
| CI/CD-Agent | CI/CD |
| Qualitäts-Agent | Qualität |
| Retro-Agent | Retro |

## Datenmodell: WorkflowDefinition vs. WorkflowRun

Zwei **klar getrennte** Modelle:

- **WorkflowDefinition** – die **Vorlage**: geordnete Schritte mit Agent-Referenz und Gate-Konfiguration. Das Objekt, das der Builder (M8) erzeugt und editiert.
- **WorkflowRun** – die **konkrete Ausführung** einer Definition: Status je Schritt, erzeugte Artefakte, Review-Entscheidungen, Feedback-Kommentare, Zeitstempel.

```ts
type Provenance = "agent" | "human_edited";
type StepStatus =
  | "pending"
  | "running"
  | "awaiting_review"
  | "approved"
  | "failed";

// --- Vorlage (Builder-Objekt) ---
type WorkflowStepDef = {
  id: string;
  agentId: string;            // welcher Agent
  reviewRequired: boolean;    // Gate: true = HITL-Stopp (Default), false = Auto-Continue
};

type WorkflowDefinition = {
  id: string;
  name: string;
  type: "planning" | "test" | "quality" | "retro" | "cicd";
  steps: WorkflowStepDef[];   // geordnet; gültig nur bei Input/Output-Kompatibilität
  isTemplate: boolean;        // mitgelieferte Vorlage vs. eigene Definition
};

// --- Ausführung ---
type ReviewDecision = {
  action: "approve" | "edit" | "rerun";
  comment?: string;           // bei rerun: Feedback, das in den Prompt fließt
  at: string;                 // ISO 8601
};

type WorkflowStepRun = {
  stepId: string;
  status: StepStatus;
  artifactId?: string;        // erzeugtes Artefakt
  provenance?: Provenance;
  decision?: ReviewDecision;
  startedAt?: string;
  finishedAt?: string;
};

type WorkflowRun = {
  id: string;
  definitionId: string;
  projectId: string;
  steps: WorkflowStepRun[];
  createdAt: string;
};
```

## Artefakt-zentrierte Zusammenarbeit

Das **übergeordnete** Interaktionsmodell: Im Zentrum stehen **Artefakte**, mit denen Mensch und Agent gemeinsam arbeiten. Pipeline-Läufe (`WorkflowRun`) sind diesem Modell **untergeordnet** – sie sind *eine* Art, Artefakte zu erzeugen und fortzuschreiben, nicht die einzige.

### Konversationale Agenten

Agenten sind **dialogfähig**. Der Idee-Agent arbeitet als **Chat**: Der Nutzer beschreibt die Idee (das Formular ist nur der **strukturierte Einstieg**), der Agent stellt **Rückfragen**, beide iterieren. Erst auf **explizite Bestätigung** („Entwurf erstellen") entsteht das Artefakt.

```ts
type AgentMessage = { role: "user" | "agent"; text: string; at: string };

type AgentConversation = {
  id: string;
  projectId: string;
  targetArtifactType: string;  // welches Artefakt am Ende entstehen soll
  messages: AgentMessage[];
};
```

### Artefakt-Überarbeitung jederzeit

Jedes Artefakt kann **unabhängig von Pipeline-Läufen** mit seinem Agenten überarbeitet werden.

- **Eingabe:** bestehendes Artefakt + Überarbeitungsauftrag mit Kontext (z. B. „Erkenntnisse aus dem Stakeholder-Meeting: …").
- **Ausgabe:** eine **neue Artefakt-Version**, die die alte ablöst.
- **UI-Konsequenz:** Jeder Artefakt-Tab erhält die Aktion **„Mit Agent überarbeiten"** (Dialog-Panel).

### Versionierung + automatischer Änderungskommentar

Artefakte sind **versioniert**; jede Version trägt einen vom Agenten generierten Änderungskommentar.

```ts
type ArtifactVersion = {
  version: number;
  at: string;                  // ISO 8601
  author: "agent" | "human";
  reason: string;              // Nutzerauftrag / Anlass
  changeSummary: string;       // vom Agenten generierte Zusammenfassung
};
```

- Jeder Tab zeigt einen **Versions-/Aktivitätsverlauf**; ältere Versionen sind einsehbar.
- **Direkte manuelle Edits** erzeugen ebenfalls einen Versionseintrag (`author: "human"`).

### Beziehung zu WorkflowRun & Downstream-Konsistenz

- Ein **Pipeline-Schritt erzeugt Version 1** eines Artefakts. **Überarbeitungen** erzeugen Folgeversionen – auch **ohne** Lauf.
- **Downstream-Hinweis:** Wird ein **früheres** Artefakt überarbeitet (z. B. Requirements), markiert das System **abhängige** Artefakte (Backlog, Risiken) als **„möglicherweise veraltet"** und bietet an, die **Folge-Agenten erneut** laufen zu lassen.

## Lokale KI-Strategie (RTX 3060 Ti, 8 GB VRAM)

| Modell | Größe (Q4_K_M) | Einsatz |
|---|---|---|
| `qwen2.5:7b-instruct` | ~4,7 GB | Standard für alle Agenten (starkes JSON-/Instruction-Following) |
| `llama3.1:8b` | ~4,9 GB | Alternative/Vergleich |
| `llama3.2:3b` / `phi3.5` | ~2 GB | schnelle Dev-Iterationen, Tests |
| `nomic-embed-text` | ~0,3 GB | Embeddings für ChromaDB |

Regeln:
- Ollama mit `format: "json"` bzw. structured outputs erzwingen
- Kontext klein halten: nur den strukturierten Output des Vorgänger-Agenten übergeben, nie die ganze Historie
- `num_ctx` 8k reicht; bei VRAM-Druck Modell entladen (`keep_alive`)
- Jeder Agent = System-Prompt (Rolle, Schema, Regeln) + User-Prompt (Input-JSON)

## Orchestrierung: LangGraph (statt CrewAI)

Begründung: explizite Graphen, typisierter State, Checkpointing/Persistenz, deterministischer und debugbarer – passt zur Lernzielsetzung. CrewAI ist schneller eingerichtet, versteckt aber die Mechanik.

Pipeline als Graph: `draft → requirements → scrum → po → risk → review`, State = Dict aller bisherigen Artefakte. Jeder Knoten: validieren (Pydantic) → bei Schema-Fehler 1 Retry mit Fehlermeldung im Prompt → Ergebnis + Metadaten (Dauer, Modell, Tokens) in `agent_runs` speichern.

## Fehlerstrategie

- JSON-Parsing-Fehler → automatischer Repair-Retry (max. 2)
- Timeout pro Agent (z. B. 120 s)
- Jeder Lauf vollständig geloggt (Input, Output, Prompt-Version) → Nachvollziehbarkeit im UI
