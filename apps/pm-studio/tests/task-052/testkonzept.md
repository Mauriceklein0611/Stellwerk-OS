# Testkonzept – TASK-052: Story-Aufgaben auffindbar machen

## Automatisiert (Vitest)

| Datei | Prüfung |
| --- | --- |
| `BacklogView.test.tsx` | **Alle Epics offen by default** (Stories beider Epics ohne manuelles Aufklappen im DOM); **Aufgaben-Count-Badge** je Story spiegelt die verknüpften Board-Tasks (`2 Aufgaben`, Singular `1 Aufgabe`, `Keine Aufgaben` ohne Tasks, `data-testid="story-task-count-<storyId>"`); **Klick auf die Badge scrollt** zur Aufgaben-Sektion (`scrollIntoView` gestubbt, da jsdom es nicht implementiert); `BacklogEmpty` rendert Hinweis **„Noch kein Backlog"** + CTA, ruft `onRunPipeline` beim Klick und ist während `isRunning` deaktiviert. |
| `tests/task-007/BacklogView.test.tsx` | (bestehend, grün) Epics/Stories/AKs/Priorität weiterhin sichtbar. |
| `tests/task-008/BacklogView.test.tsx` | (bestehend, grün) „In Board übernehmen" erzeugt genau einen Task und wird danach deaktiviert (`inBoard` = Story hat ≥1 Task – Semantik unverändert). |
| `tests/task-037/StoryTasks.test.tsx` | (bestehend, grün) Empty-State, Anlegen, Roll-up – die klarere Sektionsüberschrift (Icon + Anker-`id`) ändert das Verhalten nicht. |

Ausführen: `npx vitest run tests/task-052` (bzw. `npm run test` für die Gesamt-Suite).

## Manuell (Schritt-für-Schritt, klickbare Akzeptanz)

1. **Ohne Pipeline → Hinweis statt Leere:** Neues Projekt unter `/projects` anlegen,
   öffnen, Tab **Backlog**. → Statt einer leeren Zeile erscheint die Karte **„Noch
   kein Backlog"** mit Erklärung und Button **„Pipeline ausführen"**. Button klicken
   → Pipeline läuft, danach erscheint das Backlog.
2. **Aufgaben ohne Tiefsuche sichtbar:** Im Backlog-Tab sind **alle Epics offen**
   (nicht nur das erste). An jeder Story steht rechts eine Badge **„N Aufgaben"**
   bzw. **„Keine Aufgaben"**.
3. **Story → Aufgaben springen:** Auf die Aufgaben-Badge einer Story klicken. → Die
   Ansicht scrollt zur Sektion **„Aufgaben"** dieser Story (Listen-Icon + Roll-up).
4. **Aufgabe anlegen:** In der Sektion „Aufgaben" Titel eingeben, **Hinzufügen**. →
   Die Aufgabe erscheint sofort, die Story-Badge oben zählt hoch (z. B. „1 Aufgabe").
5. **Im Board:** Link **„Im Board ansehen →"** bzw. `/board`. → Die neue Aufgabe liegt
   in Spalte **To Do** mit dem Story-Bezug.

## DoD-Abgleich (`docs/testing-strategy.md`)

- [x] Funktioniert lokal (Backlog-Tab Empty-State + Count-Badge + Scroll)
- [x] TypeScript strict, kein `any`
- [x] Lint/Typecheck/Build grün
- [x] Automatisierte Tests (Komponenten), bestehende Tests grün
- [x] Loading-/Empty-/Error-States (neuer CTA-Empty-State für den Backlog-Tab)
- [x] Keine Secrets, keine neuen Dependencies, kein Datenmodell-Change
- [x] Doku aktualisiert (task-index, ui-backlog Befund erledigt)
- [x] Testkonzept vorhanden (diese Datei)
