# Testkonzept – TASK-058: Story-Dialog / Item-Detail

Wiederverwendbarer `StoryDialog`, der eine User Story überall (Backlog,
Sprint-Planung, Sprint-Detail) öffnet und editiert; Akzeptanzkriterien als
abhakbare Liste; AC-Migration `string[]` → `{ id, text, done }[]`.

## Automatisiert

| Datei | Prüft |
| --- | --- |
| `tests/task-058/acceptance.test.ts` | Reine AC-Transforms: `acceptanceProgress`/`acceptanceComplete` (fehlende Liste = 0/0), `addAcceptanceCriterion` (Trim, leer ⇒ gleiche Referenz), `toggle`, `rename` (**ohne** Trim), `remove`, `normalizeAcceptance` (Trim, leere raus, **immer** Array), `criteriaFromStrings` (Strings→offene Kriterien, Blanks raus, injizierbare Id). |
| `tests/task-058/useBacklogStore.test.ts` | `moveStoryToEpic` (setzt `epicId`, rankt ans Ende des Ziel-Epics, hebt `agent`→`human_edited`; No-op bei gleichem/unbekanntem Epic). Activity-Granularität: `add`/`update`/`move`/`remove` erzeugen Story-Events, **`reorderStory` nicht**. Persist-Migration `migrateBacklogPersistedState` v1→v2 (String-AKs→abhakbar; v2 unverändert durchgereicht). |
| `tests/task-058/StoryDialog.test.tsx` | Dialog rendert Felder + AK-Fortschritt; Speichern schreibt Titel-Edit **und** neues Kriterium in den Store, hebt Provenance + loggt ein `update`-Event; AK abhaken persistiert `done`. |
| `tests/task-058/SprintStoryCard.test.tsx` | Karten-Klick vs. Drag: Klick auf den Kartenkörper ruft `onOpen`, Klick auf den Grip-Handle **nicht** (Drag bleibt am Griff). |
| `e2e/backlog.spec.ts` (TASK-058-Fall) | Zeilenklick (Roll-up-Badge) öffnet den Dialog, Titel-Edit + neues Kriterium überleben Reload; Wiederöffnen zeigt AK-Fortschritt `0/1` (Migrationsseed `version: 1` wird dabei mitmigriert). |
| `e2e/sprints.spec.ts` (angepasst) | Drag startet jetzt am Grip-Handle (`sprint-story-drag-*`), Zuordnung überlebt Reload – Beweis, dass D&D trotz Klick-zum-Öffnen funktioniert. |

Angepasste Bestandstests (AC-Typwechsel, nicht gelöscht): `tests/task-007`,
`tests/task-008`, `tests/task-052` (BacklogView-Story-Fixtures → Kriterienobjekte),
`tests/task-037` (StoryTasks-Fixture), `tests/task-032`/`tests/task-038`
(Artefakt-Stories bleiben `string[]`), `tests/task-057` (`onOpenStory`-Prop).

## Manuell (Klick-Akzeptanz)

Voraussetzung: ein Projekt mit Backlog (Stories) vorhanden.

1. **Backlog → Dialog öffnen:** `/backlog` öffnen, eine Story-Zeile anklicken
   (nicht auf Titel/Priorität/PT-Zelle, Griff oder Löschen). → Dialog „Story
   bearbeiten" öffnet sich. *Erwartung:* Titel, Beschreibung, Epic, Priorität, PT,
   Akzeptanzkriterien, Aufgaben-Sektion, Verlauf sichtbar.
2. **Inline-Zellen bleiben frei:** In der Zeile direkt auf Titel oder PT klicken. →
   Es öffnet **kein** Dialog, sondern die Inline-Bearbeitung.
3. **AKs abhaken:** Im Dialog ein Kriterium hinzufügen (Enter), abhaken, speichern,
   Story erneut öffnen. *Erwartung:* Häkchen + Fortschritt `n/m` bleiben erhalten.
4. **Epic verschieben:** Im Dialog ein anderes Epic wählen, speichern. *Erwartung:*
   Story taucht unter dem neuen Epic auf (ans Ende gerankt).
5. **Sprint-Planung:** `/sprints`, eine Story-Karte auf den Kartenkörper klicken →
   Dialog öffnet. Am **Griff** ziehen → Karte lässt sich weiterhin in einen anderen
   Sprint droppen (kein Dialog beim Ziehen).
6. **Sprint-Detail:** `/sprints/<id>`, in der Story-Liste auf den Story-Kopf klicken
   → Dialog öffnet.
7. **Verlauf:** Nach einer Änderung im Dialog-Verlauf einen „Geändert"-Eintrag sehen;
   Löschen der Story über den Dialog fragt nach (Confirm) und bietet Undo.
8. **Migration:** Bestehendes Backlog (vor TASK-058, AKs als Freitext) öffnen →
   AKs erscheinen als abhakbare, offene Kriterien (nichts verloren).

## DoD-Abgleich (`docs/testing-strategy.md`)

- [x] Typen sauber (`AcceptanceCriterion`, `UserStory.acceptance_criteria`), strict, kein `any`.
- [x] Reine Logik in `src/lib/acceptance.ts` + Selektoren/Transforms unit-getestet.
- [x] Status-/Fortschrittsfarbe nur über `<StatusBadge>`/`STATUS_STYLES` (AK-ProgressBar).
- [x] Loading-/Empty-/Not-Found-States der andockenden Seiten unverändert erhalten.
- [x] Persist-Migration v1→v2 additiv + getestet; kein Verlust.
- [x] Gate grün: Lint, `tsc --noEmit`, 548 Unit-Tests, Build.
- [x] E2E: Backlog (5, inkl. Dialog), Sprints (3), Board (11), Ceremonies (3) grün.
- [x] Keine neue Dependency.
