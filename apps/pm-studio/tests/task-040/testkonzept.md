# Testkonzept – TASK-040: Sichere Lifecycle-Aktionen (Confirm/Undo/Toast)

## Ziel
Destruktive Aktionen (Löschen) zentraler Entitäten laufen durchgängig über
**eine** gemeinsame Mechanik: **Bestätigung** (ConfirmDialog) → Löschen inkl.
**Referenz-Aufräumung** → **Toast mit Undo**, das den Zustand **1:1**
wiederherstellt. Keine stillen Löschungen, keine verwaisten Referenzen.

## Automatisiert (Vitest)

| Datei | Prüfung |
|---|---|
| `assignment.test.ts` | `detachAssignee` löst `assigneeId` nur bei den Tasks der gelöschten Person, lässt andere unberührt, entfernt den Key ganz (kein dangling `undefined`). |
| `useToastStore.test.ts` | `showToast` reiht ein + gibt Id zurück, Default-Dauer 8 s, Undo-Action bleibt aufrufbar, `dismissToast` entfernt per Id. |
| `useConfirmStore.test.ts` | `confirm()` öffnet Request + löst bei Bestätigen `true` / bei Abbruch `false`; ein neuer Request verdrängt den offenen (alter ⇒ `false`). |
| `safe-delete-cascade.test.ts` | **Person:** `removePerson` hinterlässt kein dangling `assigneeId`; Undo (`restore` people + board) stellt Person **und** Zuweisung 1:1 her. **Board-Task:** `removeTask` + `restore`. **Phase:** `removeColumn` verschiebt Tasks, `restore` (columns + board) macht Phase **und** Task-Spalte rückgängig. **Release:** Löschen entkoppelt Sprints, `restore` (release + sprint) stellt Release **und** `releaseId`-Verknüpfung wieder her. |
| `confirm-delete-flow.test.tsx` | Voller UI-Fluss über `useConfirmDelete` + `ConfirmDialog` + `Toaster`: Abbrechen löscht nicht/kein Toast; Bestätigen löscht + Undo-Toast erscheint; „Rückgängig" stellt den Snapshot her und schließt den Toast. |

Angepasste Bestandstests (nicht gelöscht, ans neue Verhalten geführt):
- `tests/task-032/ColumnManager.test.tsx` – Phase löschen geht jetzt über den
  Confirm-Dialog (Trigger → Bestätigen).
- `tests/task-035/TaskDialog.checklist.test.tsx` – `TaskDialog` braucht jetzt das
  Pflicht-Prop `onDelete`.

## Manuell (klickbare Akzeptanz)

Voraussetzung: `npm run dev`, ein Projekt mit Backlog/Board-Tasks, eine Person.

1. **Board-Task löschen + Undo:** Board → Task öffnen → „Löschen" → Confirm
   „Löschen". Task verschwindet, Toast „Task … gelöscht." erscheint → „Rückgängig"
   → Task ist zurück (gleiche Spalte/Position). Ohne Klick verschwindet der Toast
   nach ~8 s. *Erwartet:* nichts wird ohne Bestätigung gelöscht.
2. **Person löschen räumt Zuweisungen auf:** Einer Person einen Task zuweisen →
   Team → Person bearbeiten → „Löschen" → bestätigen. Person weg; der Task zeigt
   „Nicht zugewiesen" (kein dangling Name). „Rückgängig" stellt Person **und**
   Zuweisung wieder her.
3. **Team löschen:** Team löschen → bestätigen → Mitglieder behalten ihre Daten,
   verlieren nur die Team-Zuordnung; Undo stellt alles her.
4. **Projekt löschen:** Projektdetailseite → „Löschen" → bestätigen → Sprung zur
   Projektliste, Toast mit Undo. Zugehörige Board-Tasks verlieren ihre
   Story-Zuordnung, bleiben aber erhalten; Undo macht alles rückgängig.
5. **Release löschen:** Releases → Release bearbeiten → „Löschen" → bestätigen →
   Sprints bleiben (ohne Release-Zuordnung); Undo stellt Release + Zuordnung her.
6. **Phase löschen:** Board → „Spalten verwalten" → Papierkorb an einer Phase →
   bestätigen → Tasks wandern in die erste Phase; Undo stellt Phase + Tasks her.
   (Letzte/letzte terminale Phase bleibt wie bisher gesperrt.)

## DoD-Abgleich (`docs/testing-strategy.md`)
- [x] Typen sauber (`tsc --noEmit`), kein `any`.
- [x] Reine Aufräum-Logik testbar in `src/lib/` (`detachAssignee`).
- [x] Lint/Typecheck/Test/Build grün (361 Tests).
- [x] Keine neue Dependency, keine Persist-Migration (Toast/Confirm sind ephemer;
      `restore` ersetzt nur Slices).
- [x] Loading-/Empty-/Error-States der betroffenen Seiten unverändert erhalten.
- [x] Test-Ordner + dieses Testkonzept im selben PR.
