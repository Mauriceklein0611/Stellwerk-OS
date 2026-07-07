# Testkonzept – TASK-057: Backlog-Bereich `/backlog` unter Delivery

Ein eigenständiger Backlog-Arbeitsbereich (erster Eintrag der Delivery-Gruppe):
Projekt wählen, Epics/Stories sehen, anlegen, inline bearbeiten, per Drag
priorisieren, löschen (Confirm/Undo) – mit Aggregat-Fußzeile im Octane-Stil.
Baut vollständig auf dem `useBacklogStore` (TASK-056) auf, ohne Pipeline-Lauf.

## Automatisiert

| Datei | Prüfung |
|---|---|
| `tests/task-057/backlog-summary.test.ts` | Reiner Helfer `backlogSummary`: `plannedPt` summiert alle Story-PT, `donePt` nur erledigte Stories (Done über `storyTaskRollup`/`isStoryDone`, TASK-038 – keine zweite Done-Logik); leere Liste ⇒ 0/0/0; nichts terminal ⇒ `donePt` 0. |
| `tests/task-057/BacklogTree.test.tsx` | Komponente: rendert Epics + Stories mit Task-Rollup (`n/m`); Inline-Titel-Edit (getrimmt ⇒ `onUpdateStory`, leer ⇒ ignoriert); Inline-PT-Edit (gültig ⇒ Zahl, negativ ⇒ ignoriert); Story löschen ⇒ `onDeleteStory`; „+ Story"-Trigger ⇒ `onOpenAddStory(epicId)`; offenes Add-Feld + Enter ⇒ `onAddStory(epicId, trimmedTitle)`. |
| `e2e/backlog.spec.ts` | E2E (direkt geseedeter Store, **kein** Pipeline-Lauf): seeded Backlog sichtbar + Footer-Aggregat; Story inline anlegen überlebt Reload; **Rank-Drag** innerhalb eines Epics überlebt Reload; **Empty-State** via `?project`-Deep-Link → „Story manuell anlegen" legt Default-Epic + Story an; **CommandBar** „Neue Story" springt nach `/backlog` und öffnet das Add-Feld. |

## Manuell (Klick-Akzeptanz)

> Voraussetzung: mindestens eine Projektidee. Persistenz ist lokal
> (`localStorage`, Keys `pm-studio-backlog`/`pm-studio-board`).

1. **Navigation:** Sidebar → Delivery → **Backlog** (erster Eintrag) *oder* ⌘K/Strg+K → „Backlog". → `/backlog` öffnet sich.
2. **Projekt & Sichtbarkeit:** Oben Projekt wählen. → Alle Epics sind **aufgeklappt**, jede Story als Zeile mit Titel, Priorität, PT, Aufgaben-Rollup.
3. **Anlegen:** „Epic hinzufügen" (oben rechts) → Titel + Enter ⇒ neues Epic. In einer Epic-Sektion „Story hinzufügen" → Titel + Enter ⇒ neue Story (Feld bleibt offen für die nächste).
4. **Inline-Edit:** Story-Titel anklicken → tippen → Enter; PT anklicken → Zahl → Enter; Priorität über das Dropdown ändern. → Änderungen bleiben nach Reload erhalten.
5. **Priorisieren (Rank):** Am Griff (⋮⋮) links eine Story innerhalb ihres Epics nach oben/unten ziehen. → Reihenfolge überlebt Reload.
6. **Löschen + Undo:** Story-Papierkorb → bestätigen ⇒ Story weg, Toast „Rückgängig" stellt sie wieder her. Epic-Papierkorb löscht Epic **und** seine Stories (Board-Aufgaben bleiben erhalten); Undo stellt beides wieder her.
7. **Aggregat-Fußzeile:** Zeigt Anzahl Stories, Σ geplant PT und Σ erledigt PT; „erledigt" entspricht der TASK-038-Semantik (alle Story-Aufgaben terminal).
8. **Ohne Pipeline:** Neues Projekt ohne Agentenlauf → Empty-State „Noch kein Backlog" → „Story manuell anlegen" legt ein Default-Epic an und öffnet direkt das Story-Feld.
9. **Deep-Link:** `/backlog?project=<projektId>` wählt das Projekt direkt vor (Basis für TASK-061).

## DoD-Abgleich (`docs/testing-strategy.md`)

- [x] Reine Logik (`backlogSummary` in `src/lib/backlog.ts`) + Präsentation (`BacklogTree`/`EpicHeader`/`BacklogFooter`) getrennt, isoliert testbar.
- [x] Unit-/Komponenten-Tests decken Aggregat, Inline-Edit, Add, Delete-Callbacks ab; E2E deckt Anlegen/Rank/Empty-State/CommandBar inkl. Reload ab.
- [x] Reuse statt Neubau: `EditableTextCell`/`EditableSelectCell`, `FilterBar`, `useConfirmDelete` (+Restore-Slice TASK-056), dnd-kit-Muster, CommandBar-Intent (TASK-042).
- [x] Done-Semantik ausschließlich über `storyTaskRollup`/`isStoryDone` (TASK-038) – keine zweite Logik.
- [x] Statusfarben nur über `<StatusBadge>` (Priorität); Loading-Gate + Empty-States (kein Projekt / kein Item / keine Filtertreffer) vorhanden.
- [x] Keine neue Dependency; keine Persist-Migration (Store aus TASK-056 kann bereits alles).
- [x] Qualitäts-Gate grün: `npm run lint`, `npx tsc --noEmit`, `npm run test`, `npm run build`, `npx playwright test e2e/backlog.spec.ts`.
```
Hinweis: „Tag"-Filter aus der Octane-Vorlage ist bewusst **weggelassen** – Stories
tragen kein Tag-Feld (Tags leben auf Board-Aufgaben, TASK-031). Umgesetzt sind
Prioritäts- und Freitext-Filter.
```
