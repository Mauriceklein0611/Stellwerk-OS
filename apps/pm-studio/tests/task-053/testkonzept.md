# Testkonzept – TASK-053: Sprint-Detailseite

## Automatisiert

| Datei | Prüfung |
| --- | --- |
| `tests/task-053/SprintDetail.test.tsx` | Not-Found-Zustand bei unbekannter Sprint-Id (`sprint-detail-not-found`). |
| `tests/task-053/SprintDetail.test.tsx` | Kopf rendert Name (Heading), Ziel, Zeitraum (`formatSprintRange` → „01.07.–14.07.") und Status-Badge („Geplant"). |
| `tests/task-053/SprintDetail.test.tsx` | Fortschritt kommt aus der einen Quelle `sprintProgress`/TASK-038: US-1 (3 PT) erledigt, US-2 offen ⇒ „3 / 8 PT" und „1/2". |
| `tests/task-053/SprintDetail.test.tsx` | Zugeordnete Stories + ihre Board-Tasks werden gelistet; Klick auf einen Task öffnet den `TaskDialog` („Task bearbeiten"). |
| `tests/task-053/SprintDetail.test.tsx` | Empty-State, wenn dem Sprint keine Stories zugeordnet sind. |
| `e2e/sprints.spec.ts` | Öffnen-Link in der Spalte navigiert nach `/sprints/sp1`; Story/Task sichtbar; Task-Klick öffnet Dialog; Back-Link führt zurück zur Übersicht. |

Ausführen: `npx vitest run tests/task-053/` bzw. `npx playwright test e2e/sprints.spec.ts`.

## Manuell (Klick-Checkliste)

1. **Detail öffnen:** `/sprints` öffnen, Projekt mit Backlog wählen, einer Story
   einen Sprint zuordnen (Drag & Drop). Im Spaltenkopf des Sprints das
   „Öffnen"-Icon (↗) klicken. → **Erwartet:** Wechsel auf `/sprints/<id>` mit
   Kopf (Name, Ziel, Zeitraum, Status-/Aktiv-Badge).
2. **Fortschritt/Burndown:** Fortschrittsbalken zeigt erledigte/geplante PT; der
   Burndown-Chart zeigt Ideal- vs. Ist-Linie (bzw. Empty-State ohne Timebox).
   → **Erwartet:** Werte konsistent mit der Sprint-Übersicht (keine Doppellogik).
3. **Task bearbeiten:** In der Story-/Task-Liste einen Task anklicken.
   → **Erwartet:** Es öffnet sich derselbe Task-Dialog wie im Board; Änderungen
   (z. B. Spalte) werden gespeichert und spiegeln sich sofort im Fortschritt.
4. **Zurück:** Über „← Sprints" zurück zur Übersicht. → **Erwartet:** Übersicht
   erscheint; die horizontale Scrollleiste unten ist schlank und themenfarben
   (nicht mehr die weiße System-Scrollbar).
5. **Not-Found:** Direkt eine ungültige URL (`/sprints/xyz`) aufrufen.
   → **Erwartet:** „Sprint nicht gefunden." + Button „Zu den Sprints".

## DoD-Abgleich (docs/testing-strategy.md)

- [x] Funktion erfüllt Akzeptanzkriterien (Detailseite, klickbare Liste,
      TASK-038-Fortschritt, Scrollbar-Fix).
- [x] Automatisierte Unit-/Component-Tests (Vitest) grün.
- [x] E2E für Navigation + Klick (Playwright) grün.
- [x] Lint/Typecheck/Build grün.
- [x] Loading-/Empty-/Not-Found-States vorhanden; SSR-sicher (`useHydrated`-Gate).
- [x] Status-Farben ausschließlich über `<StatusBadge>`.
- [x] Testkonzept vorhanden (diese Datei).
- [x] Doku aktualisiert (`docs/task-index.md`, `docs/frontend-plan.md`).
