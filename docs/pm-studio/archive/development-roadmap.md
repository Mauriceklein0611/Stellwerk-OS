---
module: pm-studio
type: doc
status: frozen
updated: 2026-07-08
imported: 2026-07-08
source: projectmind-os
---

# Roadmap

## Meilenstein 1 – Projektgrundlage (Tasks 001–002)
Repo, Next.js + TS + Tailwind + shadcn/ui, Dark Theme, Grundlayout mit Sidebar, Command-Bar, Navigation, leere Seiten-Stubs.
**Done wenn:** App startet, Navigation funktioniert, Design-Tokens aktiv, Build grün.

## Meilenstein 2 – Dashboard (Task 003)
Metrik-Karten (Projekte, Sprints, Aufgaben, Risiken), Agenten-Aktivitäts-Feed, Status-Grid (Tests/CI/Qualität/Reviews) – alles Dummy-Daten. Vitest-Setup.
**Done wenn:** Dashboard wie SaaS-Tool aussieht, erste Component-Tests laufen.

## Meilenstein 3 – Projektideen-Workflow (Tasks 004, 007 teilweise, 009)
Ideen-Formular (alle Felder, Validierung mit zod), Projektliste, Mock-Projektentwurf wird „generiert" und angezeigt, simulierte Übergabe an Requirements-Agent.
**Done wenn:** Flow Idee → Entwurf → Anzeige komplett klickbar ist.

## Meilenstein 4 – Agenten-System als UI (Tasks 005–006)
Agenten-Übersicht (Karten, Status, Rollen), Agentendetail mit Outputs, React-Flow-Workflow-Ansicht der Pipeline. Playwright-Setup.
**Done wenn:** Pipeline visuell nachvollziehbar, Agenten-Status live (simuliert) wechseln.

## Meilenstein 5 – PM-Kern (Tasks 007–008, Nacharbeit 017–018)
Projektdetailseite (Tabs: Entwurf, Requirements, Backlog, Risiken), User Stories, Kanban-Board mit Drag&Drop, Sprintübersicht, einfache Retro-/Review-Formulare.
**Done wenn:** Ein komplettes Dummy-Projekt durchgängig verwaltbar ist. → **MVP fertig.**

> Hinweis: Der MVP-Release v0.5.0 lieferte Detailseite + Board. Die ebenfalls zu M5
> gehörende **Sprintübersicht** und die **Retro-/Review-Formulare** werden als
> Nacharbeit in **TASK-017** bzw. **TASK-018** nachgezogen.

## Zwischenausbau – Team & Delivery-Tiefe (Tasks 017–023, nach M5)
Vertieft den PM-Kern vor/parallel zum Backend: Sprintplanung (017) + Retro/Review
(018), **Personen & Teams mit Kapazität** (019), **Zuweisung & Auslastung** in
Backlog/Board/Sprint (020), **Done-Status & echte Velocity** (021), **Filter** für
Board/Sprint nach Sprint/Person/u. a. (022) und ein **Ansichtswechsel Kanban ↔
Scrum-Liste** im Octane-Stil (023). Reines lokales Mock-Modell (Zustand + persist).
**Reihenfolge:** 019 → 021 → 020 → 022 → 023.
**Done wenn:** Personen sind zuweisbar und ausgelastet planbar, Fertigstellung +
Velocity stimmen, Board/Sprint sind filterbar und als Liste oder Kanban nutzbar.

## Zwischenausbau II – Releases, Scrum-Tiefe & UX (Tasks 024–029, nach 023)
Baut auf dem Team-&-Delivery-Ausbau auf, weiterhin lokales Mock-Modell: **Sprint-
Timeboxes & aktiver Sprint** (024), **Releases mit automatischer Sprint-Generierung**
nach Zeitraum + Dauer (025), **echte Burndown** (026), sowie UX: **Board-Politur**
(027), **Sprint-Visualisierung als Balken** (028) und **Einstellungen inkl.
Theme Dark/Light/System** (029). Offene Scrum-Ceremony **Retro/Review** bleibt
TASK-018.
**Reihenfolge (Logik zuerst):** 024 → 025 → 026 → 027 → 028 → 029.
**Done wenn:** Releases erzeugen datierte Sprints automatisch, der aktive Sprint
und eine echte Burndown sind sichtbar, Board/Sprint sind optisch aufgewertet und
ein Theme-Wechsel (Dark/Light/System) ist möglich.

## Zwischenausbau III – Board- & Backlog-Tiefe (Tasks 030–037, nach 029)
Vertieft Board und Backlog weiter im lokalen Mock-Modell: **Inline-Editing der
Listenansicht** (030), **Tags/Labels** mit Filter (031), **anpassbare Kanban-Phasen**
inkl. `isTerminal`-Flag für korrekte Burndown/Velocity (032a/032b), **Quick-Add in
der Spalte** (033), **Fälligkeitsdaten** mit Überfällig-Hinweis (034),
**Checklisten/Subtasks** je Task (035), **Swimlanes** (036) und die fundierende
**Scrum-Hierarchie Story → Aufgaben** (037) als Andockpunkt für spätere Agenten &
Testautomation.
**Reihenfolge (Fundament zuerst):** 037 → 031 → 030 → 033 → 034 → 035 → 032 → 036.
**Done wenn:** Items sind taggbar/terminierbar/zerlegbar, die Liste inline
editierbar, Phasen anpassbar (ohne Kennzahlen zu brechen) und Stories in echte
Aufgaben zerlegt.

## Meilenstein 6 – Erster echter Agent (Task 010)
FastAPI-Backend, Ollama-Anbindung (qwen2.5:7b), Projektentwurfs-Agent mit JSON-Schema, Speicherung in SQLite, Frontend tauscht Mock gegen API.
**Done wenn:** Echte Idee → echter, valider, gespeicherter Entwurf.

## Meilenstein 7 – Orchestrierung mit Human-in-the-Loop-Gates
LangGraph-Pipeline (draft → requirements → scrum → po → risk → review) mit **HITL-Gates**: Der Lauf **pausiert nach jedem Schritt** im Zustand „wartet auf Review". Pro Schritt die drei **Review-Aktionen** (Bestätigen & weiter / Bearbeiten / Erneut ausführen mit Feedback-Kommentar). **Lauf-Historie inkl. menschlicher Entscheidungen** (Provenienz `agent | human_edited`, Feedback-Kommentare, Zeitstempel). SSE-Fortschritt, Retries bei Schema-Fehlern. Zusätzlich **konversationale Mock-Agenten** (dialogfähiger Idee-Agent: Rückfragen, Iteration, Artefakt erst auf Bestätigung).
**Done wenn:** Ein Lauf hält nach jedem Schritt an, der Mensch kann bestätigen/bearbeiten/neu ausführen, und die Historie zeigt alle (auch menschlichen) Entscheidungen.

## Meilenstein 8 – Aktiver Workflow-Builder
Der Nutzer **erstellt und editiert eigene `WorkflowDefinition`s**: Agenten aus einem **Katalog per Drag & Drop** auf die React-Flow-Canvas ziehen, **verbinden, umordnen, entfernen**; pro Schritt **Review-Pflicht / Auto-Continue** setzen; **Validierung der Verbindungen** über **Input-/Output-Typ-Kompatibilität** (ungültige Kanten werden abgelehnt); Definitionen **speichern, duplizieren, als Vorlage** nutzen; der **Standard-Planungs-Workflow** ist eine **mitgelieferte, editierbare Vorlage**. Dazu Test-, Review-, Qualitäts- und Retro-Agent als eigene Workflow-Typen; Qualitätschecklisten.
**Done wenn:** Eine eigene, typgültige Workflow-Definition kann gebaut, gespeichert und ausgeführt werden.

## Langfrist-Backlog
CI/CD-Agent, GitHub-Integration, PostgreSQL, Multi-User, Veröffentlichung als Open Source, RAG über Projekthistorie (ChromaDB).
