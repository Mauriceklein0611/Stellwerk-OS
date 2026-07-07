# Testkonzept TASK-062 – Release-Scope (Items einem Release zuordnen + Scope-Filter)

## Automatisiert

| Datei | Prüfung |
| --- | --- |
| `release-scope.test.ts` | Reiner Helfer `releaseScope(releaseId, stories, tasks, terminalColumns?)`: zählt **nur** die über `UserStory.releaseId` zugeordneten Stories (Σ PT), „erledigt" **ausschließlich** über `isStoryDone` (TASK-038: ≥1 Task & **alle** terminal; ohne Task nie done), leere Scope-Rückgabe ohne Zuordnung, respektiert Custom-Terminal-Spalten. |
| `detach-release.test.ts` | `useBacklogStore.detachRelease(releaseId)` setzt `releaseId` nur bei den betroffenen Stories auf `undefined`, lässt andere unberührt und verwirft **keine** Story. `useReleaseStore.removeRelease` kaskadiert die Entkopplung (kein dangling `releaseId`), andere Release-Zuordnungen bleiben. |
| `BacklogTreeRelease.test.tsx` | Inline-Release-Zelle in der Story-Zeile: Zuordnen ruft `onUpdateStory(id, { releaseId })`, „Kein Release" (–) ruft `onUpdateStory(id, { releaseId: undefined })`; **ohne Releases** rendert die Zelle einen statischen Platzhalter (kein Select). |
| `e2e/backlog.spec.ts` (TASK-062) | End-to-End: Story inline einem Release zuordnen (Zelle aktualisiert sich), Backlog nach Release **filtern** (beide Stories im Scope, Fußzeile folgt: 2 Stories/5 PT), „Ohne Release" → Leer-Karte; die Zuordnung **überlebt einen Reload**. |
| `tests/task-041/ReleaseCard.test.tsx` (angepasst) | `ReleaseCard` bekommt das Pflicht-Prop `scope`; sprint-basierte Zeile heißt jetzt „Sprints:" (Abgrenzung zur neuen Scope-Zeile). |
| `tests/task-057/BacklogTree.test.tsx` (angepasst) | `BacklogTree` bekommt das Pflicht-Prop `releases` (leer im Bestandstest). |

## Manuell (Klick-Checkliste)

Vorbereitung: In `/releases` für ein Projekt ein Release anlegen (Sprints werden erzeugt). Danach `/backlog` mit demselben Projekt öffnen.

1. **Story im Dialog zuordnen** – Story-Zeile anklicken → Dialog. Feld **„Release"** zeigt „Kein Release". Ein Release wählen → **Speichern**. *Erwartung:* Die Story-Zeile zeigt in der Release-Spalte den Release-Namen.
2. **Inline zuordnen/entfernen** – In der Story-Zeile die **Release-Zelle** (rechts) anklicken → ein Release wählen. *Erwartung:* Zelle zeigt den Namen sofort. Erneut anklicken → **„–"** wählen → Zuordnung entfernt.
3. **Scope-Filter** – Im Backlog-Kopf erscheint (nur bei vorhandenen Releases) der Filter **„Release"**. „Alle Releases" = alles; ein Release wählen → nur zugeordnete Stories; **„Ohne Release"** → nur nicht zugeordnete. *Erwartung:* Die **Fußzeile** (Σ Stories/PT) folgt dem gefilterten Scope.
4. **ReleaseCard-Scope** – In `/releases` zeigt jede Karte eine Zeile **„Scope: n Stories · x/y PT · d/n"** (release-zugeordnete Stories, erledigt via TASK-038) **zusätzlich** zum sprint-basierten Fortschritt („Sprints:").
5. **Release löschen** – In `/releases` ein Release löschen (Bestätigen). *Erwartung:* Zugeordnete Stories verlieren ihre Release-Zuordnung (keine „Geister"-Zuordnung); **Rückgängig** stellt Release **und** Story-Zuordnung wieder her.

## DoD-Abgleich (`docs/testing-strategy.md`)

- [x] Reine Logik testbar in `src/lib/` (`releaseScope`) – Unit-Tests, keine zweite Done-Logik (nutzt `isStoryDone`).
- [x] Store-Kaskade getestet (`detachRelease` + `removeRelease`), kein dangling `releaseId`.
- [x] Komponenten-/Interaktionstest (Inline-Zelle) + E2E (Filter + Persistenz).
- [x] Loading-/Empty-/Filter-States vorhanden (Leer-Karte bei leerem Filter, Platzhalter ohne Releases).
- [x] Statusfarbe/Design-Tokens unverändert; keine neue Dependency, keine Persist-Migration.
- [x] Gate grün (Lint, `tsc --noEmit`, Vitest, Build) + Backlog-E2E.
