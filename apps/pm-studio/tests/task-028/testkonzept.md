# Testkonzept TASK-028 – Sprint-Visualisierung (Balken)

## Automatisiert

| Datei | Prüfung |
|---|---|
| `ProgressBar.test.tsx` | Füllung proportional (3/6 → 50 %); ARIA `valuenow/min/max` korrekt |
| `ProgressBar.test.tsx` | Überlast (value > max) klemmt auf 100 %, `aria-valuenow` auf `max` geklemmt |
| `ProgressBar.test.tsx` | negativer Wert → 0 %, `aria-valuenow` = 0 |
| `ProgressBar.test.tsx` | `max = 0` und negatives `max` → leerer Balken, keine Division durch 0 |
| `ProgressBar.test.tsx` | Füllung auf ganze Prozent gerundet (1/3 → 33 %) |
| `ProgressBar.test.tsx` | Default-Status `info`; jeder Status mappt auf sein Farb-Token (`bg-success/-warning/-danger/-idle`) |
| `ProgressBar.test.tsx` | `label` setzt den barrierearmen Namen (`role="progressbar"` + `aria-label`) |

Ausführen: `npm run test` (Unit) · Gate zusätzlich `npm run lint`, `npx tsc --noEmit`, `npm run build`.

> Hinweis: Die Berechnungen `sprintProgress`/`sprintWorkload`/`loadStatus` sind
> bereits in `tests/task-021/` bzw. `tests/task-020/` getestet und bleiben in
> diesem Task **unverändert** – TASK-028 ändert nur die Darstellung.

## Manuell (Klick-Checkliste)

Voraussetzung: `npm run dev`, ein Projekt mit einem Sprint, dem Stories mit
PT-Schätzungen zugeordnet sind, Board-Tasks (teils in `done`) und Personen mit
Kapazität (`/team`) sowie Zuweisungen.

1. **Fortschrittsbalken:** `/sprints` öffnen, Sprint mit zugeordneten Stories
   ansehen. → *Erwartet:* Unter der Punktezeile („erledigt X / geplant Y PT …")
   ein **grüner Balken**, dessen Füllung dem Verhältnis erledigt/geplant
   entspricht. 0 erledigt → leerer Balken; alles erledigt → voll.
2. **Fortschritt aktualisiert sich:** Eine zugeordnete Story-Karte im `/board`
   nach `done` ziehen, zurück zu `/sprints`. → *Erwartet:* Balken füllt sich
   entsprechend weiter, Punktezeile passt sich an.
3. **Kein Balken ohne Plan:** Sprint ohne Stories / mit 0 PT. → *Erwartet:* Kein
   Fortschrittsbalken (nur die `0 PT`-Zeile), kein Layout-Sprung.
4. **Auslastung je Person:** Im Block „Auslastung" je Person eine Zeile mit Name,
   Werten „X / Y PT" und darunter ein **Kapazitätsbalken**. → *Erwartet:* Balken
   füllt sich nach `assignedPt/capacityPt`; Farbe grün im Rahmen, gelb nahe der
   Grenze (> 90 %).
5. **Überlast:** Einer Person so viele Stories zuweisen, dass `assignedPt`
   > Kapazität. → *Erwartet:* Balken ist **voll und rot** (danger), hinter den
   Werten erscheint die Prozentangabe in Rot, z. B. „12 / 8 PT (150 %)".
6. **Keine Kapazität:** Person mit 0 PT Kapazität, aber zugewiesener Arbeit. →
   *Erwartet:* Balken rot, kein Absturz/keine `NaN`-Anzeige.
7. **Barrierearmut:** Mit den Dev-Tools einen Balken inspizieren. → *Erwartet:*
   `role="progressbar"` mit `aria-valuenow/min/max` und sprechendem `aria-label`.
8. **Reduced Motion:** OS-Einstellung „Bewegung reduzieren" aktivieren. →
   *Erwartet:* Balken animiert die Breite nicht (kein Übergang).

## DoD-Abgleich (`docs/testing-strategy.md`)

- [x] Funktioniert lokal (dev) – Fortschritt & Auslastung als Balken in `/sprints`
- [x] Typsicher (`tsc --noEmit` grün), kein `any`
- [x] Lint grün (`npm run lint`) – keine neuen Warnungen
- [x] Unit-Tests vorhanden & grün (`tests/task-028/ProgressBar.test.tsx`)
- [x] Build grün (`npm run build`)
- [x] Empty-/Null-Zustände korrekt (`max = 0`, kein Plan → kein Balken, keine NaN)
- [x] Farben nur über Design-Tokens (Reuse `STATUS_STYLES`); barrierearm (`progressbar`)
- [x] Berechnungslogiken unverändert (nur Darstellung)
- [x] Doku aktualisiert (`design-system.md`, `task-index.md`, dieses Testkonzept)
