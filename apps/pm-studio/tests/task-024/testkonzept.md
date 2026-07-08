# Testkonzept TASK-024 – Sprint-Timeboxes & aktiver Sprint

## Automatisiert

| Datei | Prüfung |
|---|---|
| `sprint-timeboxes.test.ts` | `isActiveSprint`: true wenn `today` im Zeitraum (Grenzen inklusive); false davor/danach; nie aktiv ohne vollständige Timebox; unabhängig vom gesetzten Status |
| `sprint-timeboxes.test.ts` | `formatSprintRange`: volles Range als `DD.MM.–DD.MM.`; einseitig „ab …"/„bis …"; leerer String ohne Daten |

Ausführen: `npm run test` · Gate zusätzlich `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npx playwright test`.

## Manuell (Klick-Checkliste)

Voraussetzung: `npm run dev`, ein Projekt mit Backlog und mindestens einem
Sprint (Seite `/sprints`).

1. **Daten anlegen:** Auf `/sprints` einen Sprint öffnen/„Neuer Sprint". → *Erwartet:*
   Dialog zeigt zwei Datumsfelder „Start" und „Ende". Start und Ende setzen,
   speichern.
2. **Persistenz:** Seite neu laden (F5). → *Erwartet:* Der Zeitraum steht weiter im
   Sprintkopf (kompakt, z. B. „01.07.–14.07.").
3. **Validierung:** Sprint erneut öffnen, Ende **vor** Start wählen. → *Erwartet:*
   Hinweis „Das Enddatum muss am oder nach dem Startdatum liegen.", „Speichern" ist
   deaktiviert. Datums-Picker begrenzen sich zusätzlich gegenseitig (min/max).
4. **Aktiver Sprint:** Einen Sprint so anlegen, dass **heute** im Zeitraum liegt
   (Start ≤ heute ≤ Ende). → *Erwartet:* Im Sprintkopf erscheint ein „Aktiv"-Badge
   (laufend/blau, pulsierend), unabhängig vom gesetzten Status.
5. **Nicht aktiv:** Sprint mit Zeitraum komplett in der Vergangenheit/Zukunft. →
   *Erwartet:* Kein „Aktiv"-Badge; nur der Status-Badge bleibt.
6. **Ohne Daten:** Sprint ohne Start/Ende. → *Erwartet:* Kein Zeitraum, kein
   „Aktiv"-Badge; Sprint funktioniert wie zuvor (kein Fehler).

## DoD-Abgleich (`docs/testing-strategy.md`)

- [x] Funktioniert lokal (dev) – Timebox, Validierung, aktiver Sprint
- [x] Typsicher (`tsc --noEmit` grün), kein `any`
- [x] Lint grün (`npm run lint`)
- [x] Unit-Tests vorhanden & grün (`tests/task-024/`)
- [x] Build grün (`npm run build`)
- [x] Empty-/Null-Zustände korrekt (Sprints ohne Daten, einseitige Range)
- [x] SSR-sicher: `today` clientseitig nach Hydration-Gate → kein Mismatch
- [x] Bestehende E2E-Tests weiterhin grün (`npx playwright test`)
- [x] Doku aktualisiert (`frontend-plan.md`, `task-index.md`, dieses Testkonzept)
