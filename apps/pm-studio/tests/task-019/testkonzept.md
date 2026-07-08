# Testkonzept TASK-019 – Team & Personen (Stammdaten)

## Automatisiert

| Datei | Prüfung |
|---|---|
| `usePeopleStore.test.ts` | `addPerson` hängt eine Person an; `updatePerson` patcht Felder und behält die id; `removePerson` löscht nur die passende Person |
| `usePeopleStore.test.ts` | `addTeam`/`updateTeam` verwalten Teams; `removeTeam` löscht das Team **und** setzt `teamId` aller Mitglieder auf `undefined` (andere Personen bleiben unberührt) |
| `people.test.ts` | `initials`: Vor-/Nachname-Initialen, Single-Word-Fallback (zwei Buchstaben), `?` bei leer |
| `people.test.ts` | `teamName`: Treffer liefert Teamnamen, sonst „Kein Team" |
| `people.test.ts` | `personFormSchema`: Name-Pflicht, Kapazität ≥ 0, Kapazität muss Zahl sein (NaN aus leerem Feld scheitert), E-Mail validiert (leer erlaubt) |
| `people.test.ts` | `personFromForm`: `NO_TEAM`-Sentinel → `undefined`, leere E-Mail → `undefined`, Trimmen; echte `teamId`/E-Mail bleiben erhalten |

Ausführen: `npm run test` (Unit) · `npm run build` + `npx tsc --noEmit` (Gate).

## Manuell (Klick-Checkliste)

Voraussetzung: `npm run dev`, dann im Browser `/team` öffnen (Sidebar-Gruppe
„Agents" → „Team").

1. **Empty-States:** Bei leerem Store zeigen beide Bereiche („Personen", „Teams")
   einen Hinweistext mit CTA-Button. → *Erwartet:* je ein „Erste … anlegen"-Button.
2. **Team anlegen:** „Neues Team" → Name „Plattform", Beschreibung optional →
   Speichern. → *Erwartet:* Team-Karte mit „0 Mitglieder".
3. **Person anlegen:** „Neue Person" → Name „Lena Schmidt", Rolle „Frontend",
   Kapazität 10, Team „Plattform" → Speichern. → *Erwartet:* Personen-Karte mit
   Initialen „LS", Rollen-Badge, Team-Badge „Plattform", „Kapazität: 10 PT/Sprint".
   Die Team-Karte zeigt jetzt „1 Mitglied".
4. **Validierung:** Neue Person, Name leer lassen / Kapazität auf `-1` →
   *Erwartet:* Fehlermeldungen, kein Speichern. E-Mail „abc" → *Erwartet:*
   „Ungültige E-Mail-Adresse".
5. **Bearbeiten:** Person „Bearbeiten" → Rolle ändern, Team auf „Kein Team" →
   Speichern. → *Erwartet:* Badge „Kein Team", Team-Mitgliederzähler sinkt.
6. **Persistenz:** Seite neu laden (F5). → *Erwartet:* Personen und Teams bleiben
   erhalten (localStorage `pm-studio-people`), kein Hydration-Flackern/-Fehler.
7. **Team löschen entkoppelt:** Person wieder einem Team zuordnen, dann das Team
   „Bearbeiten" → „Löschen". → *Erwartet:* Team verschwindet, die Person bleibt,
   ihr Team-Badge zeigt „Kein Team".
8. **Person löschen:** Person „Bearbeiten" → „Löschen". → *Erwartet:* Karte weg.

## DoD-Abgleich (`docs/testing-strategy.md`)

- [x] Funktioniert lokal (dev) – CRUD für Personen/Teams, Persistenz
- [x] Typsicher (`tsc --noEmit` grün), kein `any`
- [x] Lint grün (`npm run lint`)
- [x] Unit-Tests vorhanden & grün (`tests/task-019/`)
- [x] Build grün (`npm run build`), `/team` als Route erzeugt
- [x] Empty-/Loading-States vorhanden (Empty-CTAs, `useHydrated`-Gate)
- [x] Bestehende E2E-Tests weiterhin grün (`npx playwright test`)
- [x] Doku aktualisiert (`frontend-plan.md`, `task-index.md`, dieses Testkonzept)
