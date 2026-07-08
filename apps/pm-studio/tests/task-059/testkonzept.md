# Testkonzept – TASK-059: Sprint-Planung v2 (vertikales Layout)

## Automatisiert

| Datei | Prüfung |
| --- | --- |
| `tests/task-059/sprint-commitment.test.ts` | `sprintCommitment` summiert Team-Kapazität; warnt bei `planned > capacity`, nicht bei Gleichstand/Unterlast; **kein** Warnen ohne Kapazität (leerer Roster). |
| `tests/task-059/SprintSection.test.tsx` | Kopf rendert Name (Heading), Status-Badge, Zeitraum (`sprint-section-sp1-range` → „01.07.–14.07.") und PT-Summe (`…-points` → „geplant 8 PT"). |
| `tests/task-059/SprintSection.test.tsx` | Story-Zeilen sichtbar; Klick auf den Zeilenkörper öffnet den Dialog (`onStoryClick`), Klick auf den **Griff** nicht (TASK-058). |
| `tests/task-059/SprintSection.test.tsx` | Sektions-Toggle (`sprint-section-toggle-sp1`) klappt den Body ein (Story-Zeilen verschwinden). |
| `tests/task-059/SprintSection.test.tsx` | Commitment-Warnung (`sprint-commitment-sp1`, „Überplant") erscheint bei 20 PT vs. 8 Kapazität, **nicht** bei 8 PT. |
| `tests/task-059/SprintSection.test.tsx` | Auslastung liegt hinter eigenem Toggle (`sprint-load-toggle-sp1`), zeigt danach die Personen-Last (`sprint-load-per-1`). |
| `tests/task-059/SprintSection.test.tsx` | Backlog-Sektion (ohne Sprint) zeigt „PT · Anzahl", **kein** Status-/Commitment-Badge, **kein** Auslastungs-Block. |
| `tests/task-059/SprintStoryCard.test.tsx` | Row-Variante rendert Titel/Priorität/„Fertig"/PT kompakt; Body-Klick öffnet, Griff-Klick nicht. |
| `e2e/sprints.spec.ts` | Vertikale Sektionen (`sprint-section-*`); Story aus dem Backlog per Griff-Drag in einen Sprint verschieben überlebt Reload; Detail-Link + Task-Bearbeitung (TASK-053) unverändert. |

Ausführen: `npx vitest run tests/task-059/` bzw. `npx playwright test e2e/sprints.spec.ts`.

## Manuell (Klick-Checkliste)

1. **Layout:** `/sprints` öffnen, Projekt mit Backlog wählen. → **Erwartet:**
   Sprints als **vertikal gestapelte** Sektionen, ganz unten die Sektion
   „Backlog / Nicht zugeordnet" – kein horizontales Scrollen mehr.
2. **Ein-/Ausklappen:** Auf den Sektionskopf (Chevron) klicken. → **Erwartet:**
   Der Body (Story-Liste + Auslastung) klappt ein/aus; der Kopf mit Fortschritt
   bleibt sichtbar.
3. **Story verschieben:** Eine Story am **Griff** (⋮⋮) aus dem Backlog in einen
   Sprint ziehen. → **Erwartet:** Die Story landet im Sprint, PT-Summe und
   Fortschritt aktualisieren sich; nach Reload bleibt sie zugeordnet.
4. **Story bearbeiten:** Auf den **Zeilenkörper** einer Story klicken.
   → **Erwartet:** Der `StoryDialog` (TASK-058) öffnet sich; Änderungen werden
   gespeichert.
5. **Commitment-Warnung:** Einem Sprint mehr PT zuordnen, als das Team an
   Kapazität hat (Personen unter `/team` mit Kapazität pflegen). → **Erwartet:**
   Ein Warn-Badge „Überplant" erscheint im Sektionskopf; nach Entlasten
   verschwindet er wieder.
6. **Auslastung:** In einer Sprint-Sektion „Auslastung (n)" aufklappen.
   → **Erwartet:** Je zugewiesener Person ein Kapazitätsbalken; Überlast rot.
7. **Review/Detail:** Klemmbrett-Icon (aktive/erledigte Sprints) öffnet
   Review/Retro; ↗ öffnet die Detailseite `/sprints/<id>`. → **Erwartet:** wie
   zuvor.

## DoD-Abgleich (docs/testing-strategy.md)

- [x] Funktion erfüllt Akzeptanzkriterien (vertikale Sektionen, Drag zwischen
      Backlog/Sprints, klickbare Stories, Fortschritt/Zeitraum/Aktiv/Auslastung,
      Commitment-Warnung).
- [x] Automatisierte Unit-/Component-Tests (Vitest) grün.
- [x] E2E für Layout + Drag + Detail (Playwright) grün.
- [x] Lint/Typecheck/Build grün.
- [x] Loading-/Empty-States vorhanden; SSR-sicher (`useHydrated`-Gate; `today`
      erst nach Gate).
- [x] Status-Farben ausschließlich über `<StatusBadge>` (auch Commitment-Warnung).
- [x] Testkonzept vorhanden (diese Datei).
- [x] Doku aktualisiert (`docs/task-index.md`, `docs/tasks-archive.md`, `TODO.md`).
