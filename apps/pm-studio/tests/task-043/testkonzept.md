# Testkonzept TASK-043 – Activity Feed & Decision Log

## Automatisiert

| Datei | Prüfung |
|---|---|
| `activity.test.ts` | `createActivityEvent`: füllt `id`/`createdAt`, Default-Actor `human`, expliziter `agent` bleibt, echte UUID/Zeit ohne Injection; `eventsForEntity`: Filter nach Typ **und** Id, neueste zuerst, kein Match bei gleicher Id anderer Art, leeres Array + keine Mutation der Quelle; `ACTIVITY_KIND_META`: Label + StatusBadge-Akzent je Art |
| `decision.test.ts` | `createDecision`: trimmt Felder, Default-Actor, leere Begründung ⇒ `undefined`, `null` bei leerem Kontext/Wahl; `decisionsForEntity`: Filter nach `relatedEntity`, neueste zuerst, ignoriert Einträge ohne Bezug |
| `activity-store.test.ts` | `useActivityStore.log` hängt gebautes Event an; **Instrumentierung**: Project add/remove ⇒ create/delete; Board add/remove ⇒ create/delete; **Move nur bei echtem Spaltenwechsel** (Reorder ⇒ kein Event), Spaltenwechsel via `updateTask` ⇒ update, **reiner Feldedit ⇒ kein Event**; Sprint + Release je create/update/delete (mit Name) |
| `decision-store.test.ts` | `addDecision` speichert mit Bezug; leerer Eintrag ignoriert; `removeDecision` löscht |
| `ActivityFeedPanel.test.tsx` | Empty-State ohne Events; rendert nur die Events der Entität, neueste zuerst, Fremd-Events raus; `limit`-Prop kappt die Liste |

Ausführen: `npm run test` · Gate zusätzlich `npm run lint`, `npx tsc --noEmit`, `npm run build`.

## Manuell (Klick-Checkliste)

Voraussetzung: `npm run dev`, ein Projekt mit Backlog, einige Board-Tasks, ein Sprint
und ein Release.

1. **Task-Verlauf:** Auf `/board` einen Task per Drag & Drop in eine andere Spalte
   ziehen, dann den Task öffnen. → *Erwartet:* Im Abschnitt „Verlauf" steht
   „Task „… " nach „<Spalte>" verschoben" mit relativer Zeit und einem Status-Badge.
2. **Kein Rauschen:** Im Task-Dialog nur den Titel ändern und speichern, erneut öffnen.
   → *Erwartet:* **Kein** neuer Verlaufseintrag (reine Feldedits erzeugen kein Event).
   Eine Karte innerhalb derselben Spalte umsortieren erzeugt ebenfalls keinen Eintrag.
3. **Task anlegen/löschen:** Über Quick-Add einen Task anlegen → Verlauf zeigt
   „angelegt". Task löschen (Bestätigen) → der Projekt-/Sprint-Feed der Entität ist
   weg, aber der Lösch-Event bleibt im Log (append-only).
4. **Projekt-Verlauf & Entscheidungen:** Projekt öffnen → Tab „Verlauf". → *Erwartet:*
   Links die Aktivität (Projekt angelegt …), rechts der Decision Log mit Formular
   (Kontext, Entscheidung, optionale Begründung). Eine Entscheidung „Festhalten" →
   erscheint sofort mit Datum; „Festhalten" ist deaktiviert, solange Kontext **oder**
   Entscheidung leer ist.
5. **Sprint/Release:** Auf `/sprints` einen bestehenden Sprint „bearbeiten" bzw. auf
   `/releases` ein Release „bearbeiten". → *Erwartet:* Unter dem Formular Feed +
   Decision Log der jeweiligen Entität (nur im Bearbeiten-Modus, nicht beim Neuanlegen).
6. **Persistenz:** Seite neu laden (F5). → *Erwartet:* Verlauf und Entscheidungen
   stehen weiterhin; kein Flackern/Hydration-Fehler (Panels hinter `useHydrated`-Gate).

## DoD-Abgleich (`docs/testing-strategy.md`)

- [x] Funktioniert lokal (dev) – Feed je Project/Sprint/Release/Task + Decision Log
- [x] Typsicher (`tsc --noEmit` grün), kein `any`
- [x] Lint grün (`npm run lint`)
- [x] Unit-Tests vorhanden & grün (`tests/task-043/`)
- [x] Build grün (`npm run build`)
- [x] Empty-/Null-Zustände (kein Event/keine Entscheidung, fehlende Entität)
- [x] SSR-sicher: Store-Daten erst nach `useHydrated`-Gate
- [x] Zentrales Schreiben (ein `log`-Pfad, append-only) – keine verstreute Logging-Logik
- [x] Granularität bewusst gewählt (create/delete + bedeutsame Updates; keine Feldedit-/Reorder-Events)
- [x] Doku aktualisiert (`task-index.md`, `architecture.md`, dieses Testkonzept)
