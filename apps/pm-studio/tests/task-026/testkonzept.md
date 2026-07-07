# Testkonzept TASK-026 – Echte Sprint-Burndown

## Automatisiert

| Datei | Prüfung |
|---|---|
| `burndown.test.ts` | `sprintBurndown`: ein Punkt je Tag der Timebox; Ideallinie linear von `plannedPt` auf 0 (`DD.MM.`-Labels) |
| `burndown.test.ts` | Ist-Linie sinkt am Erledigt-Tag einer Story (über `doneAt`); Tage > heute ohne Wert (`null`) |
| `burndown.test.ts` | Done-Task ohne `doneAt` (Altbestand) zählt ab Sprintstart; keine Doppelzählung bei mehreren Done-Tasks je Story; unbekannte Story-IDs ignoriert |
| `burndown.test.ts` | Ein-Tages-Timebox bleibt bei `plannedPt` (keine Division durch 0); leeres Ergebnis ohne gültige Timebox |
| `board-store-doneat.test.ts` | `doneAt` wird beim Wechsel nach `done` gesetzt und beim Verlassen entfernt (add/move/update); Umsortieren innerhalb `done` behält den Zeitstempel |

Ausführen: `npm run test` · Gate zusätzlich `npm run lint`, `npx tsc --noEmit`, `npm run build`.

## Manuell (Klick-Checkliste)

Voraussetzung: `npm run dev`, ein Projekt mit Backlog (User Stories) und einem
Sprint mit Zeitraum (Start/Ende, siehe TASK-024), dem Stories zugeordnet sind.

1. **Sprint mit Daten:** Auf `/sprints` einen Sprint mit Start ≤ heute ≤ Ende
   anlegen und ihm Stories zuordnen (Drag & Drop). → *Erwartet:* Sprint zeigt
   „Aktiv"-Badge.
2. **Burndown sichtbar:** Auf das Dashboard (`/`) wechseln. → *Erwartet:* Die
   Karte „Sprint-Burndown" steht **außerhalb** des „Beispiel"-Bereichs, zeigt
   Projekt · Sprintname · Zeitraum als Untertitel und eine Auswahl rechts oben.
   Aktiver Sprint ist vorausgewählt. Ideallinie (gestrichelt) läuft von der
   Plansumme auf 0, Ist-Fläche startet auf gleicher Höhe.
3. **Task erledigen setzt `doneAt`:** Auf `/board` einen Board-Task einer
   Sprint-Story in die Spalte **done** ziehen. Zurück aufs Dashboard. → *Erwartet:*
   Die Ist-Linie sinkt am heutigen Tag um die Personentage der Story.
4. **Reload-fest:** Seite neu laden (F5). → *Erwartet:* Die Burndown bleibt
   identisch (das `doneAt` ist persistiert), nicht zurückgesetzt.
5. **Zurückziehen entfernt `doneAt`:** Task von **done** zurück nach z. B.
   **testing** ziehen, Dashboard prüfen. → *Erwartet:* Die Ist-Linie steigt
   wieder auf den vollen Restwert.
6. **Zukunft leer:** Bei einem laufenden Sprint endet die Ist-Fläche heute (keine
   Linie in die Zukunft); die Ideallinie läuft über den gesamten Zeitraum.
7. **Auswahl:** Über das Dropdown einen anderen Sprint mit Zeitraum wählen. →
   *Erwartet:* Untertitel und Kurven wechseln auf den gewählten Sprint.
8. **Fallback:** Existiert kein Sprint mit Zeitraum, zeigt die Karte den
   Empty-State (kein Chart, kein Dropdown), kein Fehler.

## DoD-Abgleich (`docs/testing-strategy.md`)

- [x] Funktioniert lokal (dev) – Burndown auf echten Daten, Auswahl, Empty-State
- [x] Typsicher (`tsc --noEmit` grün), kein `any`
- [x] Lint grün (`npm run lint`) – keine neuen Warnungen
- [x] Unit-Tests vorhanden & grün (`tests/task-026/`)
- [x] Build grün (`npm run build`)
- [x] Empty-/Null-Zustände korrekt (kein Timebox-Sprint → Empty; Zukunftstage `null`)
- [x] SSR-sicher: `today` clientseitig nach Hydration-Gate → kein Mismatch
- [x] Persistenz additiv migriert (Board-Store v2 → v3, `doneAt` optional)
- [x] Doku aktualisiert (`frontend-plan.md`, `task-index.md`, dieses Testkonzept)
