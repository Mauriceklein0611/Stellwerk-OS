# Testkonzept – TASK-066: UI-Sprache konsequent vereinheitlichen (Deutsch)

## Entscheidung

Die UI ist **durchgängig deutsch**. Bewusste Abweichung von der ursprünglichen
PRD-Empfehlung „UI englisch" (Ist-Mehrheit war bereits deutsch). **Etablierte
Scrum-/Kanban-/PM-Fachbegriffe bleiben unübersetzt** (Backlog, Board, Sprint,
Release, Epic, Story, Task, Ceremony/Ceremonies, Velocity, Workflow, Dashboard,
Team) – Glossar in `docs/design-system.md`, Begründung in
`docs/product-requirements.md`.

## Automatisiert

| Datei | Prüfung |
| --- | --- |
| `tests/task-066/navigation-language.test.ts` | Gruppen-Labels sind deutsch (`Übersicht, Projekte, Agenten, Umsetzung, System`). |
| `tests/task-066/navigation-language.test.ts` | Generische Item-Labels übersetzt (`/projects`→„Projekte", `/ideas/new`→„Neue Idee", `/agents`→„Agenten"). |
| `tests/task-066/navigation-language.test.ts` | Keine englischen Alt-Labels mehr in `navGroups`/`navItems` (Overview, Projects, Agents, Delivery, New Idea). |
| `tests/task-066/navigation-language.test.ts` | Fachbegriffe bleiben erhalten (Backlog, Board, Sprints, Ceremonies, Releases). |
| `tests/task-066/navigation-language.test.ts` | Swimlane-Dimension `Assignee` → `Zuständig` (in `SWIMLANE_MODES`). |
| `tests/task-036/SwimlaneSelect.test.tsx` | Angepasst: aktives Radio heißt jetzt „Zuständig" (vorher „Assignee"). |
| `e2e/board.spec.ts` | Angepasst: Swimlane-Radio „Zuständig" klicken/prüfen (vorher „Assignee"). |

Ausführen: `npx vitest run tests/task-066/` bzw. das gesamte Gate `npm run test`.

## Manuell (Klick-Checkliste)

1. **Sidebar:** App öffnen. → **Erwartet:** Navigationsgruppen heißen
   „Übersicht", „Projekte", „Agenten", „Umsetzung", „System"; Einträge
   „Projekte" und „Neue Idee" statt „Projects"/„New Idea". Fachbegriffe
   „Backlog", „Board", „Sprints", „Ceremonies", „Releases" bleiben englisch.
2. **Command-Palette (⌘K):** Palette öffnen. → **Erwartet:** dieselben deutschen
   Gruppen-/Item-Labels wie in der Sidebar (gleiche Quelle `navGroups`);
   Aktionen-Gruppe „Aktionen".
3. **Board-Liste:** `/board` → Listenansicht. → **Erwartet:** Spaltenkopf
   „Zuständig" (vorher „Assignee"); Gruppieren-nach-Umschalter zeigt „Zuständig".
4. **Risikoregister:** Projekt mit Risiken → Risiko-Tabelle/Dialog.
   → **Erwartet:** Spalte/Label „Verantwortlich" (vorher „Owner").
5. **Dialog schließen:** Beliebigen Dialog öffnen, mit Screenreader das
   Schließen-Icon fokussieren. → **Erwartet:** Vorlesetext „Schließen" (vorher
   „Close").
6. **Gesamteindruck:** Durch alle Bereiche klicken. → **Erwartet:** kein
   sichtbarer englischer UI-Text außer den bewusst erhaltenen Fachbegriffen.

## DoD-Abgleich (docs/testing-strategy.md)

- [x] Navigation, Seitenköpfe, Buttons, Empty-States durchgängig deutsch
      (Fachbegriffe ausgenommen).
- [x] Entscheidung inkl. Begründung in der PRD dokumentiert
      (`docs/product-requirements.md`) + Glossar (`docs/design-system.md`).
- [x] Automatisierte Tests (Vitest) grün; betroffene Bestandstests/E2E an die
      neuen Labels angepasst (nicht gelöscht).
- [x] Lint/Typecheck/Build grün.
- [x] Keine neue Dependency, keine i18n-Bibliothek (Label-Konstanten in den
      vorhandenen Quellen `navigation.ts`/`swimlanes.ts`).
- [x] Testkonzept vorhanden (diese Datei).
- [x] Doku aktualisiert (`docs/task-index.md`, `docs/tasks-archive.md`, `TODO.md`).
