# Testkonzept – TASK-018: Sprint-Review & Retrospektive

Ein Sprint kann am Ende reflektiert werden: **Review** (Was wurde geliefert,
erreichte vs. geplante Story-Points, Notizen) und **Retro** (drei Listen „Lief
gut" / „Verbessern" / „Aktionen"). Beides wird pro Sprint persistiert (Upsert),
erreichbar über das Klemmbrett-Icon am Sprint (nur Status `Aktiv`/`Abgeschlossen`).

## Automatisierte Tests

| Datei | Werkzeug | Prüft |
|---|---|---|
| `tests/task-018/useSprintStore.test.ts` | Vitest (`npm run test`) | Store: `setReview`/`setRetro` als **Upsert** (genau ein Eintrag pro Sprint), Trennung verschiedener Sprints, `removeSprint` löscht zugehörigen Review/Retro mit |
| `tests/task-018/sprint-review-schema.test.ts` | Vitest | Validierung: `delivered` Pflichtfeld, `achievedPt` keine NaN/keine negativen Zahlen; `reviewFromForm` (trimmt, lässt leere Notizen weg); `retroFromLists`/`cleanRetroItems` (trimmt, entfernt Leereinträge); Defaults/Vorbefüllung |

## Manuelle Tests (Schritt für Schritt)

Vorbereitung: Projekt mit Backlog (Pipeline ausgeführt), `/sprints` öffnen, einen
Sprint anlegen und ein paar Stories zuordnen.

### 1. Einstieg sichtbar nur bei active/done
- [ ] Sprint im Status **Geplant** → **kein** Klemmbrett-Icon im Sprint-Header.
- [ ] Sprint auf **Aktiv** oder **Abgeschlossen** setzen (Stift → Status) → Klemmbrett-Icon erscheint.

### 2. Review ausfüllen & speichern
- [ ] Klemmbrett-Icon → Dialog „Review & Retro", Tab **Review** aktiv.
- [ ] Feld „Was wurde geliefert" leer lassen → **Speichern** → Validierungsfehler.
- [ ] „Erreichte Story-Points" leeren/Buchstaben → Fehlermeldung; negativ → Fehler.
- [ ] Hinweis „von X geplanten PT" entspricht der Summe der zugeordneten Stories.
- [ ] Gültig ausfüllen → **Review speichern** → „Review gespeichert."
- [ ] **Reload** → Dialog erneut öffnen → Werte sind erhalten.

### 3. Retro-Items hinzufügen/entfernen & speichern
- [ ] Tab **Retro** → je Spalte 2 Einträge per Eingabe + **+** (oder Enter) hinzufügen.
- [ ] Ein Item per **×** entfernen.
- [ ] **Retro speichern** → „Retro gespeichert."
- [ ] **Reload** → Dialog öffnen → Items (ohne das entfernte) sind erhalten.

### 4. Upsert (kein Duplikat)
- [ ] Review erneut öffnen, Wert ändern, speichern, Reload → genau **ein** Stand,
      keine zweite Kopie.

### 5. Aufräumen beim Löschen
- [ ] Sprint mit Review/Retro über „Löschen" entfernen → später ein Sprint mit
      gleicher ID/Neuanlage zeigt **keine** alten Review/Retro-Daten.

## DoD-Abgleich (`docs/testing-strategy.md`)
- [ ] Review & Retro pro Sprint speicher- und reload-fest (Upsert, keine Duplikate)
- [ ] Validierung greift (Pflichtfeld, Zahl ≥ 0)
- [ ] Nur für sinnvolle Status (`active`/`done`) erreichbar
- [ ] Empty-/Saved-States vorhanden; SSR-sicher (`useHydrated`), kein Hydration-Mismatch
- [ ] Status-Farben nur via `<StatusBadge>` (unverändert)
- [ ] `npm run lint`, `npx tsc --noEmit`, `npm run test`, `npm run build` grün
