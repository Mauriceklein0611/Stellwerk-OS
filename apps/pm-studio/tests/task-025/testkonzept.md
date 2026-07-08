# Testkonzept TASK-025 – Releases & automatische Sprint-Generierung

## Automatisiert

| Datei | Prüfung |
|---|---|
| `releases.test.ts` | `sprintWindows`: volle Fenster back-to-back; Restfenster auf Release-Ende geklemmt; verschiedene Sprint-Längen; Monatsgrenzen; Ein-Tages-Fenster (Start = Ende); `[]` bei invertierter Range |
| `releases.test.ts` | `generateSprints`: Namen „Sprint 1…n", korrekte Start/Ende je Fenster, `projectId`/`releaseId`/`status: planned`/`order`, eindeutige Ids |
| `releases.test.ts` | `useSprintStore.setReleaseSprints`: idempotent über `releaseId` (kein Duplizieren), manuelle Sprints (ohne `releaseId`) bleiben unberührt, generierte Sprints hängen hinter den manuellen (order) |
| `releases.test.ts` | `useSprintStore.detachRelease`: entkoppelt Sprints (`releaseId → undefined`), löscht sie nicht |

Ausführen: `npm run test` · Gate zusätzlich `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npx playwright test`.

## Manuell (Klick-Checkliste)

Voraussetzung: `npm run dev`, mindestens ein Projekt (Idee) angelegt.

1. **Release anlegen:** Auf `/releases` Projekt wählen → „Neues Release". Name, Start
   z. B. 01.07.2026, Ende 30.09.2026, Sprint-Dauer „2 Wochen", speichern. →
   *Erwartet:* Release-Karte mit Zeitraum, „2 Wochen"-Badge und Anzahl generierter
   Sprints (z. B. „7 Sprints").
2. **Sprints sichtbar:** Auf `/sprints` dasselbe Projekt wählen. → *Erwartet:* Die
   generierten Sprints „Sprint 1…n" erscheinen mit korrekten Zeiträumen (back-to-back,
   letztes Fenster ggf. kürzer). Liegt heute in einem Fenster → „Aktiv"-Badge (TASK-024).
3. **Validierung:** Release öffnen, Ende **vor** Start wählen. → *Erwartet:* Hinweis
   „Das Enddatum muss am oder nach dem Startdatum liegen.", „Speichern" deaktiviert.
4. **Re-Generieren (idempotent):** Auf der Release-Karte „Sprints neu generieren"
   klicken. → *Erwartet:* Keine Duplikate; die Anzahl bleibt gleich. Manuell auf
   `/sprints` angelegte Sprints (ohne Release) bleiben erhalten.
5. **Bearbeiten:** Release-Zeitraum verkürzen/verlängern oder Sprint-Dauer ändern,
   speichern. → *Erwartet:* Die Release-Sprints werden ersetzt (neue Fenster);
   manuelle Sprints bleiben.
6. **Löschen entkoppelt:** Release öffnen → „Löschen". → *Erwartet:* Release ist weg,
   die zugehörigen Sprints bleiben auf `/sprints` erhalten (kein Datenverlust).
7. **Persistenz:** Seite neu laden (F5). → *Erwartet:* Releases und Sprints stehen
   weiterhin; kein Flackern/Hydration-Fehler.
8. **Empty-State:** Projekt ohne Release wählen. → *Erwartet:* Hinweis + CTA „Erstes
   Release anlegen". Ohne Projekte: CTA „Erste Idee anlegen".

## DoD-Abgleich (`docs/testing-strategy.md`)

- [x] Funktioniert lokal (dev) – Anlegen, Generieren, Bearbeiten, Löschen
- [x] Typsicher (`tsc --noEmit` grün), kein `any`
- [x] Lint grün (`npm run lint`)
- [x] Unit-Tests vorhanden & grün (`tests/task-025/`)
- [x] Build grün (`npm run build`)
- [x] Empty-/Null-Zustände (keine Projekte, keine Releases, invertierte Range)
- [x] SSR-sicher: Store-Daten erst nach `useHydrated`-Gate gerendert
- [x] Bestehende E2E-Tests weiterhin grün (`npx playwright test`)
- [x] Doku aktualisiert (`frontend-plan.md`, `task-index.md`, dieses Testkonzept)
