# Testkonzept – TASK-042: My Work & globale Suche

## Automatisiert

| Datei | Prüfung |
| --- | --- |
| `tests/task-042/my-work.test.ts` | Reine My-Work-Selektoren: `tasksForPerson` (nur Tasks der Person, leere Id ⇒ `[]`), `isTaskOpen`/`isTaskOverdue` (terminale Phase ⇒ nicht offen/nie überfällig, vergangener Termin ⇒ überfällig, Custom-Terminal-Spalten), `myWorkCounts` (assigned/open/overdue; ohne `today` ⇒ 0 overdue), `filterMyWork` (assigned/open/overdue; overdue ohne `today` ⇒ leer), `resolveMyWorkPersonId` (gültige `preferredId` bleibt, Fallback erste Person, ohne Personen ⇒ `undefined`). |
| `tests/task-042/search.test.ts` | Indexfreie Suche `searchEntities`: leere Query ⇒ `[]`, Treffer über alle fünf Entitätsarten (case-insensitiv), korrekte Navigations-`href`s je Art, Story-Sublabel = Projektname, Person-Treffer auch über Rolle, Kappung pro Art (`limitPerKind`), kind-namespaced eindeutige Keys. |
| `e2e/my-work.spec.ts` | `/my-work`: Standard-Person + Scope „Offen" zeigt offene Tasks, blendet erledigte/fremde aus; Chip „Überfällig" filtert auf den vergangenen Termin; Chip „Zugewiesen" zeigt alle (inkl. erledigt); Personenwechsel zeigt nur deren Tasks. CommandBar: Suche findet Projekt/Task und navigiert zum Projekt-Detail; Create-Aktion „Neue Idee" öffnet `/ideas/new`; Create-Aktion „Neue Person" navigiert nach `/team` und öffnet den Personen-Dialog (deklarativer Intent). |

Ausführen:
```bash
npx vitest run tests/task-042
npx playwright test e2e/my-work.spec.ts
```

## Manuell (klickbare Akzeptanz)

Voraussetzung: Mindestens eine Person im Team (`/team`) und ein Projekt mit
Backlog/Board-Tasks, von denen einige der Person zugewiesen sind (Assignee in
`TaskDialog` oder Board-Liste setzen). Für „Überfällig" einem offenen Task ein
Fälligkeitsdatum in der Vergangenheit geben.

1. **My Work öffnen:** Sidebar → „Meine Aufgaben" (Overview).
   - *Erwartet:* Seite „Meine Aufgaben" mit Person-Auswahl, Umfang-Auswahl und
     drei Zähl-Chips (Zugewiesen / Offen / Überfällig).
2. **Person wählen:** Im Select „Person" eine Person auswählen.
   - *Erwartet:* Liste zeigt deren Tasks; die Chips zeigen die passenden Zahlen.
3. **Scope „Offen":** Chip „Offen" (oder Select „Umfang") wählen.
   - *Erwartet:* Erledigte Tasks (terminale Phase) verschwinden aus der Liste.
4. **Scope „Überfällig":** Chip „Überfällig" wählen.
   - *Erwartet:* Nur Tasks mit Termin in der Vergangenheit, die nicht erledigt
     sind; das „Fällig"-Badge ist rot.
5. **Inline-Bearbeitung:** In einer Listenzeile Status/Assignee/PT ändern.
   - *Erwartet:* Änderung wird sofort übernommen; entfernt man die Zuweisung,
     verschwindet der Task aus „Meine Aufgaben" der Person.
6. **Globale Suche:** ⌘K / Strg+K oder Klick aufs Suchfeld; Tippe einen
   Projekt-, Task-, Story-, Personen- oder Release-Namen.
   - *Erwartet:* Gruppierte Treffer (Projekte/Tasks/Stories/Personen/Releases);
     Auswahl navigiert zum Ziel (Projekt-Detail, Board, Team, Releases).
7. **Create-Aktion:** In der Palette „Neue Person anlegen" wählen.
   - *Erwartet:* Wechsel nach `/team`, der Personen-Dialog öffnet sich direkt.
   - Analog „Neues Release anlegen" (→ `/releases`, Dialog) und „Neue Idee
     anlegen" (→ `/ideas/new`).
8. **Leerzustände:** Person ohne Tasks im gewählten Scope; Team ganz ohne
   Personen.
   - *Erwartet:* Freundlicher Empty-State (bei „keine Personen" mit Link zum Team),
     kein Absturz.

## DoD-Abgleich (`docs/testing-strategy.md`)

- [x] Reine Logik in `src/lib/` (`my-work.ts`, `search.ts`), unit-getestet.
- [x] Wiederverwendung statt Neubau: `due.ts`, `board-rows.ts`, `BoardListView`,
      `FilterBar`, `terminalColumnIds`.
- [x] Status-Farben ausschließlich über `<StatusBadge>` (Liste) bzw. Status-Token.
- [x] Loading-/Empty-/Error-States für die Liste (Hydration-Gate, Empty-Karten).
- [x] Keine neue Dependency, keine Persist-Migration (Intent-Store ist ephemer).
- [x] E2E für `/my-work` und CommandBar-Suche/Aktion.
- [x] Person-Auflösung gekapselt (`resolveMyWorkPersonId`) für späteren Login.
- [x] Lint/Typecheck/Test/Build grün (siehe PR-Beschreibung).
