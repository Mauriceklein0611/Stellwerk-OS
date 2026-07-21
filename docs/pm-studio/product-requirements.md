---
module: pm-studio
type: doc
status: current
updated: 2026-07-08
imported: 2026-07-08
source: projectmind-os
---

# Product Requirements

## Zielgruppe

Entwickler, Projektmanager, Product Owner, Scrum Master, technische Teams. Primärer Nutzer in v1: ich selbst (Single-User, lokal).

## MVP-Scope (Meilensteine 1–5, ohne echte KI)

| Modul | Muss | Beschreibung |
|---|---|---|
| Grundlayout | ✅ | Sidebar, Command-Bar, Dark Theme, Navigation |
| Dashboard | ✅ | Projekte, Sprints, Aufgaben, Risiken, Agenten-Aktivität, Qualitäts-/Test-/CI-Status (Dummy) |
| Projektideen-Formular | ✅ | Strukturierte Eingabe einer Projektidee |
| Agenten-Übersicht | ✅ | Agentenrollen, Status, Outputs (Dummy) |
| Workflow-Visualisierung | ✅ | React-Flow-Ansicht der Agenten-Pipeline |
| Projektseite | ✅ | Entwurf, Backlog, User Stories, Risiken |
| Kanban-Board | ✅ | Backlog / To Do / In Progress / Review / Testing / Done |
| Sprint-Übersicht | ✅ | Sprints mit Zielen und Stories |
| Retro-/Review-Modul | 🔶 | Einfache Formulare + Listen, kein Agent |

## Post-MVP (Meilensteine 6–8)

- Erster echter lokaler Agent (Projektentwurf via Ollama)
- Agenten-Orchestrierung (sequenzielle Pipeline, Historie)
- Test-, Review-, Qualitäts-Agent
- Eigener Workflow-Builder (Drag & Drop von Agenten)

## Nicht-funktionale Anforderungen

- Läuft komplett lokal (Next.js dev / `next build` + Ollama)
- Keine externen Pflicht-APIs, keine Telemetrie
- Responsive ab 1280px optimiert, nutzbar ab 768px
- TypeScript strict mode, keine `any` ohne Begründung
- Jede Seite < 2s initiale Ladezeit lokal
- Alle Texte konsequent **deutsch**: UI-Chrome (Navigation, Seitenköpfe, Buttons, Empty-States, Labels) auf Deutsch, Doku deutsch, Code/Commits englisch (TASK-066). **Bewusste Abweichung von der ursprünglichen PRD-Empfehlung „UI englisch":** Die Oberfläche war bereits mehrheitlich deutsch (Ist-Mehrheit); Deutsch ist für den lokalen Single-User-Kontext die konsistentere Wahl. **Etablierte Scrum-/Kanban-Fachbegriffe bleiben unübersetzt** (siehe Glossar in `docs/design-system.md`): Backlog, Board, Sprint, Release, Epic, Story, Task, Ceremony/Ceremonies, Velocity, Workflow, Dashboard, Team.

## Projektideen-Formular: Felder

Projektname, Beschreibung, Zielgruppe, Problem, gewünschter Nutzen, gewünschte Features, Zeitraum, Budget, Teamgröße, technische Einschränkungen, gewünschtes Vorgehen (klassisch/agil/hybrid).

## Offene Produktfragen

- Mehrprojektfähigkeit von Anfang an? → Ja, aber ohne Mandanten/Userverwaltung
- Persistenz im MVP? → localStorage/JSON-Dateien, ab Backend-Phase SQLite
