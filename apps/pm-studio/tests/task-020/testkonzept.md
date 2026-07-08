# Testkonzept TASK-020 – Personen-Zuweisung & Auslastung

## Automatisiert

| Datei | Prüfung |
|---|---|
| `capacity.test.ts` | `loadStatus`: idle ohne Last, success ≤ 90 %, warning > 90–100 %, danger > 100 % bzw. Kapazität 0 |
| `capacity.test.ts` | `sprintWorkload`: summiert zugewiesene PT je Person (über Board-Task → Story), erkennt Überlast; ignoriert unzugewiesene Tasks und Stories außerhalb des Sprints; unbekannter Assignee → Kapazität 0/danger; sortiert nach Name |
| `board-migration.test.ts` | Persist-Migration v1 → v2: alter `assignee`-String wird entfernt (Task fällt auf „nicht zugewiesen"), übrige Felder bleiben; v2-State unverändert |

Ausführen: `npm run test` · Gate zusätzlich `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npx playwright test`.

## Manuell (Klick-Checkliste)

Voraussetzung: `npm run dev`, mindestens eine Person auf `/team` (mit Kapazität),
ein Projekt mit Backlog-Stories „In Board übernehmen" und ein Sprint mit
zugeordneten Stories.

1. **Zuweisen:** `/board` öffnen, einen Task anklicken → Dialog. Feld
   „Zugewiesen an" → Person wählen → Speichern. → *Erwartet:* Karte zeigt
   Initialen-Avatar + Name statt „Nicht zugewiesen".
2. **Persistenz:** Seite neu laden. → *Erwartet:* Zuweisung bleibt erhalten.
3. **Wechseln/Entfernen:** Task erneut öffnen, auf „Nicht zugewiesen" zurück oder
   andere Person wählen → Speichern. → *Erwartet:* Karte aktualisiert sich.
4. **Sprint-Auslastung:** `/sprints` öffnen, Projekt wählen. Im Sprint mit
   zugewiesenen Stories erscheint unten der Block „Auslastung" je Person als
   „X / Y PT"-Badge. → *Erwartet:* Farbe success (im Rahmen), warning (nahe
   Grenze), danger (über Kapazität). Bei mehr zugewiesenen PT als Kapazität ist
   das Badge rot.
5. **Reaktivität:** Auf `/board` einer Person zwei große Stories desselben Sprints
   zuweisen, sodass die Kapazität überschritten wird → `/sprints`. → *Erwartet:*
   Auslastungs-Badge der Person wird danger.
6. **Migration:** Bestehende Tasks aus früherer Version zeigen „Nicht zugewiesen"
   (kein Fehler), nicht mehr den alten Freitext.

## DoD-Abgleich (`docs/testing-strategy.md`)

- [x] Funktioniert lokal (dev) – Zuweisung in Board/Dialog, Auslastung im Sprint
- [x] Typsicher (`tsc --noEmit` grün), kein `any`
- [x] Lint grün (`npm run lint`)
- [x] Unit-Tests vorhanden & grün (`tests/task-020/`)
- [x] Build grün (`npm run build`)
- [x] Empty-/Null-Zustände & Migration korrekt (Default „nicht zugewiesen")
- [x] Bestehende E2E-Tests weiterhin grün (`npx playwright test`)
- [x] Doku aktualisiert (`frontend-plan.md`, `task-index.md`, dieses Testkonzept)
