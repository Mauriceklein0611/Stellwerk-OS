# Testkonzept TASK-021 – Done-Status in der Sprintplanung & echte Velocity

## Automatisiert

| Datei | Prüfung |
|---|---|
| `sprint-progress.test.ts` | `isStoryDone`: true wenn ein verknüpfter Board-Task in `done` liegt; false bei anderem Status / ohne Verknüpfung / leerer Liste |
| `sprint-progress.test.ts` | `sprintProgress`: erledigte vs. geplante PT + `doneCount/total`; ignoriert unbekannte Story-IDs; zählt jede Story trotz Duplikat-IDs nur einmal; leeres Ergebnis ohne Stories |
| `tests/task-011/dashboard-selectors.test.ts` | `selectVelocity(artifacts, boardTasks)`: `points` = erledigte PT, `planned` = geplante PT je Sprint; 0 erledigt ohne Done-Tasks; leer ohne Artefakte |

Ausführen: `npm run test` · Gate zusätzlich `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npx playwright test`.

## Manuell (Klick-Checkliste)

Voraussetzung: `npm run dev`, ein Projekt mit Backlog (Pipeline ausgeführt) und
mindestens einem Sprint mit zugeordneten Stories (Seite `/sprints`).

1. **Ausgangszustand:** `/sprints` öffnen, Projekt wählen. → *Erwartet:* Jede
   Sprint-Spalte zeigt im Kopf „erledigt 0 / geplant Y PT · 0/N". Keine Story
   trägt das „Fertig"-Badge.
2. **Story fertigstellen:** Auf `/board` wechseln, einen Task, der zu einer
   zugeordneten Story gehört (gleiche Story-ID, via „In Board übernehmen"), in die
   Spalte **Done** ziehen.
3. **Zurück zur Sprintplanung:** `/sprints` erneut öffnen. → *Erwartet:* Die
   betroffene Story zeigt oben rechts ein grünes „Fertig"-Badge; der Spaltenkopf
   zählt jetzt „erledigt X / geplant Y PT · 1/N" mit X = PT dieser Story.
4. **Dashboard-Velocity:** Startseite `/` öffnen, Karte „Velocity". → *Erwartet:*
   Pro Sprint zwei Balken – gedämpft „Geplant (PT)", kräftig „Erledigt (PT)". Der
   Erledigt-Balken entspricht der Summe erledigter Story-PT; ohne erledigte Story
   ist er 0.
5. **Leere Zustände:** Ohne zugeordnete/erledigte Stories bleibt alles bei 0; ohne
   Backlog zeigt der Velocity-Chart den Empty-State (unverändert).

## DoD-Abgleich (`docs/testing-strategy.md`)

- [x] Funktioniert lokal (dev) – Done-Indikator + Sprint-Fortschritt + Velocity
- [x] Typsicher (`tsc --noEmit` grün), kein `any`
- [x] Lint grün (`npm run lint`)
- [x] Unit-Tests vorhanden & grün (`tests/task-021/`, erweiterte `task-011`-Tests)
- [x] Build grün (`npm run build`)
- [x] Empty-/Null-Zustände korrekt (0/Empty, keine Doppelzählung)
- [x] Bestehende E2E-Tests weiterhin grün (`npx playwright test`)
- [x] Doku aktualisiert (`frontend-plan.md`, `task-index.md`, dieses Testkonzept)
