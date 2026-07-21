---
module: pm-studio
type: doc
status: current
updated: 2026-07-08
imported: 2026-07-08
source: projectmind-os
---

> **Aktualisierungshinweis (2026-06-17):** Diese Notiz hat den Stand 2026-06-16.
> Seitdem ist **TASK-018 (Sprint Review & Retro) abgeschlossen** (PR #69, nach
> `dev` gemerged). Die unten unter P0 genannte „TASK-039 / Sprint Review & Retro"
> bzw. „Bestehende TASK-018 fachlich umsetzen" ist damit **erledigt**. Der nächste
> offene P0 ist die **Story-Done-Semantik** (unten als TASK-038 geführt). Die
> Nummerierung TASK-038…050 ist ein **Vorschlag** – mehrere davon decken sich mit
> schon existierenden Task-Dateien (z. B. HITL = TASK-012/013, Artifact Versioning
> = TASK-016); vor dem Anlegen neuer Nummern den `docs/task-index.md` abgleichen.
> Verwandte, feingranulare UI-Notizen liegen in `docs/ui-backlog.md`.

---

# Future Scope – Agentic PM Studio

Stand: 2026-06-16  
Zweck: Diese Notiz sammelt, was zukünftig in Agentic PM Studio ergänzt werden sollte, damit die App von einem starken lokalen PM-Prototyp zu einem wirklich runden, agentischen Projektmanagement-System wird.

## 1. Must-have vor UI-Abschluss

Diese Punkte sollten erledigt sein, bevor die Web-UI als fachlich abgeschlossen gilt.

| Thema | Warum wichtig | Priorität |
|---|---|---|
| Sprint Review & Retro | Gehört laut Roadmap zum PM-Kern und schließt den Scrum-Zyklus ab. | P0 |
| Story-Done-Semantik korrigieren | Eine Story darf erst fertig sein, wenn alle verknüpften Story-Tasks fertig sind. Aktuell reicht irgendein terminaler Task. | P0 |
| Sichere Lifecycle-Aktionen | Löschen/Archivieren/Bearbeiten für Ideas, Projects, Tasks, Releases, Personen mit Confirm/Undo/Toast. | P1 |
| Release Progress | Releases brauchen Status, Scope, Fortschritt, Sprint-Abdeckung und Timeline. | P1 |
| My Work | Zugewiesene, überfällige und offene Arbeit pro Person sichtbar machen. | P1 |
| Global Search / Command Actions | CommandBar sollte nicht nur Navigation sein, sondern Projekte, Tasks, Personen und Aktionen finden. | P1 |
| Editable Risk Register | Risiken dürfen nicht nur Agenten-Output sein; sie brauchen Status, Owner, Mitigation und Pflege. | P1 |
| Activity Feed / Decision Log | Änderungen, Agentenläufe, Reviews und menschliche Entscheidungen müssen nachvollziehbar sein. | P1 |
| Agent HITL Review | Agenten-Output braucht Approve/Edit/Rerun mit Kommentar, sonst ist “agentic PM” nur simuliert. | P0/P1 |

## 2. PM-Hierarchie, die sauber werden sollte

Aktuell ist die Hierarchie grundsätzlich gut, aber noch nicht vollständig produktreif.

Soll-Ziel:

```text
Workspace
  Project
    Idea / Brief
    Artifacts
      Draft
      Requirements
      Backlog
      Risk Register
    Epics
      Stories
        Story Tasks
          Checklists
    Releases
      Sprints
        Sprint Review
        Sprint Retro
    Board Views
    Activity Feed
    Decision Log
```

Wichtige Korrektur:

- `ProjectIdea` sollte langfristig von einem echten `Project`-Lifecycle getrennt werden.
- Stories sind fachliche Einheiten.
- Story Tasks sind echte Arbeitspakete auf dem Board.
- Checklists sind nur kleine Unterpunkte innerhalb eines Tasks.
- Sprint Progress, Velocity und Burndown müssen auf sauberer Story-Done-Logik basieren.
- Agenten-Artefakte dürfen nicht nur überschrieben werden, sondern brauchen Versionen.

## 3. Feature-Backlog nach Bereich

| Bereich | Was rein sollte | Priorität |
|---|---|---|
| Scrum | Sprint Review, Sprint Retro, Sprint-Abschlusslogik, Retro Actions | P0 |
| Story/Task | Story-Done = alle StoryTasks terminal; Task löschen/archivieren; Story editieren | P0/P1 |
| Board | Confirm/Undo für destructive actions, gespeicherte Views, bessere Swimlane-Hinweise | P1/P2 |
| Releases | Release Status, Release Scope, Timeline, Fortschritt, Notes, Risiken je Release | P1 |
| Team | My Work, Person löschen räumt Assignments auf, Kapazitätsübersicht über Sprints | P1 |
| Risiken | Editable Risk Register mit Owner, Status, Eskalation, Mitigation | P1 |
| Suche | Globale Suche nach Projects, Tasks, Stories, People, Releases | P1 |
| Activity | Entity Activity Feed für Project, Sprint, Release, Task | P1 |
| Decisions | Decision Log für menschliche Freigaben, Agenten-Reviews, Scope-Entscheidungen | P1 |
| Agenten | HITL Lifecycle, Review Panel, Artifact Versioning, Agent Conversation UI | P0/P1 |
| Workflows | WorkflowDefinition vs WorkflowRun, Builder, Gates, Templates | M7/M8 |
| Docs | Domain Model, User Flows, Glossar, PM-Methodik, Agentic Product Strategy | P2 |

## 4. Priorisierte Tasks ab TASK-038

| Task | Titel | Ziel | Priorität |
|---|---|---|---|
| ~~TASK-038~~ | Story completion semantics | **Erledigt** (PR nach `dev`): Story fertig nur bei ≥1 Task & allen Story-Tasks terminal; `isStoryDone` bleibt einzige Quelle, Velocity/Burndown/Progress angepasst. | ✓ |
| TASK-039 | Sprint Review & Retro | Bestehende TASK-018 fachlich umsetzen: Review- und Retro-Formulare pro Sprint. | P0 |
| TASK-040 | Safe lifecycle actions | Confirm/Undo/Toast, Delete/Archive/Edit für zentrale Entities. | P1 |
| TASK-041 | Release progress & timeline | Releases mit Status, Scope, Fortschritt und Sprint-Timeline erweitern. | P1 |
| TASK-042 | My Work & global search | Persönliche Arbeitsübersicht plus echte CommandBar-Suche/Aktionen. | P1 |
| TASK-043 | Activity feed & decision log | Änderungen, Reviews und Entscheidungen nachvollziehbar speichern und anzeigen. | P1 |
| TASK-044 | Dependencies / Blockers light | Einfache Blocker-Beziehungen zwischen Tasks/Stories. Keine komplexe Gantt-Engine. | P1/P2 |
| TASK-045 | Editable risk register | Risiken manuell pflegen: Owner, Status, Mitigation, Eskalation. | P1 |
| TASK-046 | HITL workflow review core | Agentenläufe pausieren, Mensch entscheidet Approve/Edit/Rerun mit Kommentar. | P0/P1 |
| TASK-047 | Artifact versioning | Artefakte versionieren, Änderungen durch Agent/Mensch nachvollziehen. | P1 |
| TASK-048 | Agent conversation UI | Idee-Agent als Chat mit Rückfragen und expliziter Bestätigung. | P2 |
| TASK-049 | Workflow definitions | WorkflowDefinition/WorkflowRun in Typen und Store einführen. | P1/M7 |
| TASK-050 | Workflow builder MVP | Editierbare Workflow-Definitionen mit Gates und Validierung. | M8 |

## 5. Post-MVP

Diese Dinge sind sinnvoll, aber nicht nötig, um die lokale UI fachlich rund zu machen.

| Thema | Einordnung |
|---|---|
| Multi-Workspace | Später, sobald Backend/User existieren. |
| Rollen/Rechte/RBAC | Erst mit Multi-User sinnvoll. |
| Attachments | Nützlich, aber nach Comments/Activity/Decision Log. |
| Custom Fields | Später, wenn Kernmodell stabil ist. |
| Kalenderansicht | Nach My Work und Timeline. |
| Automations Engine | Erst nach WorkflowDefinition/Run. |
| GitHub/Jira Import | Integrationsphase, nicht jetzt. |
| RAG über Projekthistorie | Sinnvoll nach persistenter Historie. |
| PostgreSQL | Mit Backend-Reife. |
| Echte Agenten-Orchestrierung | Nach HITL-Modell, nicht davor. |
| Release-Burnup-Chart & Velocity-Forecast | **Abgrenzung TASK-062:** Der Release-Scope (Stories via `releaseId`, Fortschritt via `isStoryDone`) ist gelegt, aber die daraus ableitbaren Auswertungen – Burnup-Chart (Scope- vs. Done-Linie) und Velocity-basierter Fertigstellungs-Forecast – sind **bewusst nicht** Teil von TASK-062. Grundlage (`releaseScope`) ist vorhanden; eigener Task, sobald priorisiert. |

## 6. Vorerst vermeiden / Overengineering

| Thema | Warum nicht jetzt |
|---|---|
| Vollständiger Gantt/Critical Path | Zu groß; einfache Timeline reicht erst einmal. |
| SAFe / Release Trains | Passt nicht zum aktuellen MVP-Scope. |
| Enterprise-RBAC | Ohne Multi-User unnötig. |
| Vollständiges ALM/Testmanagement | Erst nach Agenten-/Workflow-Kern. |
| Komplexe Custom-Automation | Erst WorkflowDefinition sauber bauen. |
| Zu viele Board-Views | Erst My Work, Timeline, Search priorisieren. |

## 7. Empfohlene Reihenfolge

1. ~~TASK-038: Story-Done-Semantik reparieren.~~ **Erledigt.**
2. ~~TASK-039/TASK-018: Sprint Review & Retro umsetzen.~~ **Erledigt** (ehem. TASK-018).
3. TASK-040: Lifecycle-Aktionen absichern.
4. TASK-041: Releases fachlich abrunden.
5. TASK-042: My Work + Global Search.
6. TASK-043: Activity Feed + Decision Log.
7. Danach erst Agentic-HITL und Artifact-Versioning vertiefen.

## 8. Produktziel

Agentic PM Studio soll nicht einfach ein weiteres Kanban-Board sein. Der Zielzustand ist:

- Ein PM-System, das Idee, Planung, Delivery, Reviews und Entscheidungen verbindet.
- Agenten erzeugen Artefakte, aber Menschen behalten Kontrolle.
- Jede relevante Änderung ist nachvollziehbar.
- Scrum-Metriken basieren auf korrekten fachlichen Regeln.
- Die UI bleibt lokal, klar, lernbar und nicht überladen.
