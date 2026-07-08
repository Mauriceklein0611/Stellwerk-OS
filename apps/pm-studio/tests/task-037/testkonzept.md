# Testkonzept – TASK-037: Story → Aufgaben (Scrum-Hierarchie)

## Automatisiert (Vitest)

| Datei | Prüfung |
| --- | --- |
| `story-tasks.test.ts` | `tasksForStory` selektiert nur die Tasks einer Story und sortiert nach Spalte → Position; `storyTaskRollup` zählt Tasks/erledigt + PT-Summen (fehlende PT = 0) und meldet `storyDone` konsistent zu TASK-021 (`isStoryDone`); `detachStoryTasks` entfernt den `storyId`-Link der betroffenen Tasks, lässt andere Stories/ungelinkte Tasks unberührt und verwirft keine Tasks. |
| `detach-stories.test.ts` | Board-Action `detachStory` entkoppelt genau eine Story; `useProjectStore.removeIdea` entkoppelt die Tasks der Stories des gelöschten Projekts; `setArtifacts` entkoppelt Stories, die ein neu generiertes Backlog nicht mehr enthält (verbleibende bleiben verknüpft). |
| `StoryTasks.test.tsx` | Empty-State ohne Tasks; Anlegen über das Formular erzeugt einen `BoardTask` mit `storyId`, Spalte `todo`, geerbter Story-Priorität und PT; Roll-up-Anzeige (`0/1 · 0/2 PT`) und Task-Zeile erscheinen; Button bei leerem Titel deaktiviert. |
| `tests/task-007/BacklogView.test.tsx` | (bestehend, angepasst) Story + AKs + Priorität sichtbar – Priorität jetzt mehrfach (Story-Badge + Add-Form-Default), daher `getAllByText`. |
| `tests/task-008/BacklogView.test.tsx` | (bestehend, grün) „In Board übernehmen" erzeugt weiterhin genau einen Task und wird danach deaktiviert. |

Ausführen: `npx vitest run tests/task-037` (bzw. `npm run test` für die Gesamt-Suite).

## Manuell (Schritt-für-Schritt, klickbare Akzeptanz)

Voraussetzung: Ein Projekt mit generiertem Backlog (Tab **Backlog** eines Projekts unter `/projects/<id>`).

1. **Aufgaben sichtbar:** Backlog-Tab öffnen, ein Epic aufklappen. Unter jeder Story erscheint der Block **„Aufgaben"** mit Roll-up `erledigt/gesamt · donePt/totalPt PT`. → Ohne Tasks steht dort „Noch keine Aufgaben …".
2. **Aufgabe anlegen:** Im Block Titel eingeben, optional Priorität/PT/Person wählen, **Hinzufügen** (oder Enter). → Die Aufgabe erscheint sofort in der Liste (Spalten-Badge **To Do**), das Roll-up zählt hoch.
3. **Im Board:** Link **„Im Board ansehen →"** klicken bzw. zu `/board` wechseln. → Die neue Aufgabe liegt in Spalte **To Do** mit dem gewählten Titel/Priorität/Assignee.
4. **Roll-up erledigt:** Im Board die Aufgabe nach **Done** ziehen, zurück zum Backlog. → Roll-up zeigt sie als erledigt (`1/…`), `donePt` steigt.
5. **PT-Default leer lassen:** Aufgabe ohne PT anlegen. → Erscheint ohne PT-Pille, zählt im Roll-up als 0 PT.
6. **Entkoppeln (Edge Case):** Projekt löschen bzw. Backlog neu generieren. → Die zuvor verknüpften Board-Tasks bleiben im Board bestehen, verlieren aber den Story-Bezug (im Board kein Story-Kürzel mehr, keine „verwaisten" Verweise).

## DoD-Abgleich (`docs/testing-strategy.md`)

- [x] Funktioniert lokal (Backlog-Tab, Board)
- [x] TypeScript strict, kein `any`
- [x] Lint/Typecheck/Build grün
- [x] Automatisierte Tests (Helfer + Store + Komponente), bestehende Tests grün
- [x] Loading-/Empty-State (Empty-State je Story)
- [x] Keine Secrets, keine neuen Dependencies
- [x] Doku aktualisiert (architecture/frontend-plan/agent-system/task-index)
- [x] Testkonzept vorhanden (diese Datei)
