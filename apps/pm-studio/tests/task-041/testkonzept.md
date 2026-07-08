# Testkonzept TASK-041 – Release-Fortschritt & Timeline

## Automatisiert

| Datei | Prüfung |
|---|---|
| `release-progress.test.ts` | `releaseSprints`: nur die Sprints des Releases, sortiert nach `order`; `[]` ohne Treffer |
| `release-progress.test.ts` | `releaseProgress`: summiert geplante/erledigte PT + Story-Counts über die Release-Sprints; fremde Releases ignoriert; `sprintCount` korrekt |
| `release-progress.test.ts` | Done-Semantik **aus TASK-038** (`isStoryDone` via `sprintProgress`): Story mit 0 Tasks ⇒ offen; Story erst done, wenn **alle** Tasks terminal; Custom-Terminal-Spalten respektiert; Release ohne Sprints ⇒ alles 0 |
| `ReleaseCard.test.tsx` | Status als `<StatusBadge>` („Aktiv"); Scope „n Stories · PT" + Progress-Text „erledigt x / y PT · a/b" + `progressbar`-ARIA; Timeline listet Sprints, aktiver per `data-active=true`; Empty-State ohne Sprints |
| `release-store-migration.test.ts` | Persist-Migration v1→v2: Altbestand ohne `status` ⇒ `planned`; expliziter Status bleibt; No-op für v2 |

Ausführen: `npm run test` · Gate zusätzlich `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npx playwright test`.

## Manuell (Klick-Checkliste)

Voraussetzung: `npm run dev`, ein Projekt mit Backlog (Stories) und ein Release mit
generierten Sprints; einige Stories als Board-Tasks in „done" schieben.

1. **Status sichtbar:** Auf `/releases` Projekt wählen. → *Erwartet:* Jede
   Release-Karte zeigt einen Status-Badge (Geplant/Aktiv/Abgeschlossen) in der
   Statusfarbe (gleiche Quelle wie überall).
2. **Status setzen:** Release öffnen → „Bearbeiten", Status auf „Aktiv" ändern,
   speichern. → *Erwartet:* Badge auf der Karte wechselt zu „Aktiv".
3. **Scope & Fortschritt:** → *Erwartet:* Karte zeigt „Scope: n Stories · X PT" und
   „erledigt d / X PT · done/total". Die Zahlen entsprechen den dem Release zugeordneten
   Sprint-Stories; der Balken füllt sich entsprechend.
4. **Konsistenz zu Sprints (TASK-038):** Auf `/board` alle Tasks einer Story nach „done"
   schieben → die Story zählt erst dann als erledigt. → *Erwartet:* Der Release-Fortschritt
   steigt **nur**, wenn **alle** Tasks der Story terminal sind (eine Story mit offenem Task
   zählt nicht), identisch zur Sprint-/Velocity-Logik.
5. **Timeline:** → *Erwartet:* Unter „Timeline" stehen die Release-Sprints in Reihenfolge
   mit Zeitraum (`DD.MM.–DD.MM.`). Liegt heute in einem Fenster, ist dieser Sprint
   hervorgehoben und trägt „Aktiv".
6. **Re-Generieren:** „Sprints neu generieren" klicken. → *Erwartet:* Timeline/Anzahl
   bleiben stimmig (keine Duplikate); Fortschritt bezieht sich weiter auf die Release-Sprints.
7. **Persistenz:** Seite neu laden (F5). → *Erwartet:* Status, Scope, Fortschritt und
   Timeline stehen weiterhin; kein Flackern/Hydration-Fehler. Alte Releases (vor TASK-041)
   erscheinen mit Status „Geplant".
8. **Empty-State:** Release ohne Sprints (z. B. invertierte/leere Range). → *Erwartet:*
   Hinweis „Noch keine Sprints …" statt einer leeren Timeline.

## DoD-Abgleich (`docs/testing-strategy.md`)

- [x] Funktioniert lokal (dev) – Status, Scope, Fortschritt, Timeline
- [x] Typsicher (`tsc --noEmit` grün), kein `any`
- [x] Lint grün (`npm run lint`)
- [x] Unit-Tests vorhanden & grün (`tests/task-041/`)
- [x] Build grün (`npm run build`)
- [x] Empty-/Null-Zustände (Release ohne Sprints, 0 Stories, alte Releases ohne Status)
- [x] SSR-sicher: Store-Daten + „heute" erst nach `useHydrated`-Gate
- [x] Fortschritt baut nachweislich auf TASK-038 (`isStoryDone`/`sprintProgress`) auf – keine Doppellogik
- [x] Doku aktualisiert (`frontend-plan.md`, `task-index.md`, dieses Testkonzept)
