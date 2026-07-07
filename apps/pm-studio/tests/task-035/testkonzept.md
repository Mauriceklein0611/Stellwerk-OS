# Testkonzept – TASK-035: Checklisten/Subtasks auf Task-Ebene

Leichtgewichtige Checkliste *innerhalb* eines Board-Tasks (abzugrenzen von
Story→Aufgaben, TASK-037). Bearbeitung im `TaskDialog`, Fortschritt „n/m" auf
Karte und in der Listenansicht, Persistenz im `useBoardStore`
(additive Migration v6→v7).

## Automatisiert

| Datei | Prüfung |
| --- | --- |
| `checklist.test.ts` | Reine Helfer aus `src/lib/checklist.ts`: `checklistProgress` (leer/teilweise/vollständig), `checklistComplete`, `addChecklistItem` (Trim, leer ignoriert, Id vergeben), `toggleChecklistItem`, `renameChecklistItem` (kein Trim), `removeChecklistItem`, `normalizeChecklist` (trimmt, leere raus, `undefined` wenn nichts bleibt). |
| `ChecklistProgress.test.tsx` | `ChecklistProgressBadge`: rendert nichts ohne/bei leerer Checkliste; zeigt kompaktes `n/m`; `data-complete` true erst bei vollständig erledigt. |
| `TaskDialog.checklist.test.tsx` | Editor im `TaskDialog`: Punkt anlegen → im Save-Patch; bestehende Punkte abhaken + entfernen → korrektes Patch; geleerter Punkt fällt beim Speichern raus (`checklist` ⇒ `undefined`). |

E2E (`e2e/board.spec.ts`): von dieser Task **nicht** erweitert – die Persistenz
über Reload ist durch die transaktionale Save-Logik (gleicher Pfad wie
Tags/Fälligkeit, bereits E2E-abgedeckt) gespiegelt; der neue Code ist über die
drei Unit-/Komponententest-Dateien vollständig abgedeckt.

## Manuell (Schritt-für-Schritt, klickbare Akzeptanz)

Voraussetzung: `npm run dev`, Board öffnen, ein Projekt im Filter wählen, einen
Task per Klick öffnen (`TaskDialog`).

1. **Anlegen:** Im Feld „Punkt hinzufügen…" Text eingeben, **Enter** drücken →
   der Punkt erscheint in der Liste, das Eingabefeld ist wieder leer. Mehrere
   Punkte anlegen. *Erwartung:* über der Liste erscheint ein Mini-Balken und die
   Zählung „0/n".
2. **Abhaken:** Auf die Checkbox links eines Punkts klicken → Häkchen + Text
   durchgestrichen, Zählung steigt (z. B. „1/3"), Balken füllt sich. Alle
   abhaken → Balken/Anzeige werden grün.
3. **Umbenennen:** In das Textfeld eines Punkts klicken, Text ändern. *Erwartung:*
   Eingabe bleibt erhalten; ein komplett geleerter Punkt wird beim Speichern
   verworfen.
4. **Entfernen:** Auf das **✕** rechts eines Punkts klicken → Punkt verschwindet.
5. **Speichern & Persistenz:** „Speichern" klicken. Auf der **Karte** erscheint
   eine Pille „erledigt/gesamt" (grün, wenn vollständig). In die **Listenansicht**
   wechseln → Spalte „Checkliste" zeigt dieselbe Zählung, sonst „–". Seite neu
   laden (F5) → Checkliste und Fortschritt sind unverändert da.
6. **Abbrechen:** Task erneut öffnen, etwas ändern, „Abbrechen" → keine Änderung
   übernommen (transaktional).
7. **Tastatur:** Editor rein mit Tab/Enter/Leertaste bedienbar (Checkbox per
   Leertaste, Hinzufügen per Enter).

## DoD-Abgleich (`docs/testing-strategy.md`)

- [x] Funktioniert lokal (`npm run dev`), keine Konsole-Errors.
- [x] Typen zentral in `src/types/` (`ChecklistItem`, `BoardTask.checklist?`).
- [x] Keine Business-Logik in Komponenten → reine Helfer in `src/lib/checklist.ts`.
- [x] Status-/Token-Farben single-sourced (`STATUS_STYLES`, kein Ad-hoc-Hex).
- [x] Empty-State (keine Punkte) sauber; Karte/Liste zeigen Fortschritt nur bei
      vorhandener Checkliste.
- [x] Automatisierte Tests in `tests/task-035/` + dieses Testkonzept.
- [x] Lint, Typecheck, Unit-Tests, Build grün (Quality-Gate).
- [x] Additive Persist-Migration (v6→v7), Altbestand unverändert.
