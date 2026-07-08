# Testkonzept – TASK-031: Tags/Labels für Backlog & Board

## Automatisiert

| Datei | Prüfung |
|---|---|
| `tags.test.ts` | Reine Helfer aus `src/lib/tags.ts`: feste Token-Palette (`TAG_COLORS`, nur `bg-/text-<token>`-Klassen, keine Hex), `tagColorStyle`-Fallback, `tagsForIds` (Store-Reihenfolge, unbekannte Ids ignoriert), `taskHasTag`, `detachTaskTags` (entfernt Tag überall, leeres `tagIds` wird ganz entfernt). |
| `board-filter-tags.test.ts` | `filterBoardTasks` mit `tagId`: `ALL` = keine Einschränkung, sonst nur Tasks mit dem Tag; `isBoardFilterActive` erkennt den Tag-Filter. |
| `TagManager.test.tsx` | Komponente: Tag anlegen (mit Farbwahl), umbenennen (live), löschen → entkoppelt aus allen Board-Tasks (`useBoardStore`). |

Ausführen: `npm run test` (Vitest, liest aus `tests/`).

## Manuell (Klick-Checkliste für den Nutzer)

Voraussetzung: einige Tasks auf dem Board (`/board`).

1. **Tags verwalten öffnen:** Button „Tags verwalten" (oben rechts) → Dialog öffnet.
   - *Erwartet:* Leerstaat „Noch keine Tags …" plus Eingabezeile „Neuer Tag".
2. **Tag anlegen:** Name „Frontend" eintippen, eine Farbe wählen, „Hinzufügen".
   - *Erwartet:* Tag erscheint als Zeile mit Namensfeld, Farbauswahl, Löschen-Icon.
3. **Umbenennen/Umfärben:** Im Namensfeld ändern; andere Farbe anklicken.
   - *Erwartet:* Änderung sofort sichtbar; bleibt nach Reload (persistiert).
4. **Tags zuweisen:** Eine Karte anklicken → Dialog „Task bearbeiten" → Abschnitt
   „Tags": Tag-Chips an-/abwählen (ausgewählt = volle Farbe, abgewählt = blass),
   „Speichern".
   - *Erwartet:* Chips erscheinen auf der Karte und in der Listenansicht (Spalte
     „Tags"); ab 4 Tags „+N" (Karte) bzw. 3 (Liste).
5. **Filtern:** In der Filterleiste „Tag" wählen.
   - *Erwartet:* Nur Tasks mit diesem Tag sichtbar; „Filter zurücksetzen" und der
     Empty-State „Keine Tasks für die aktuellen Filter" funktionieren wie gehabt.
   - *Hinweis (definiert):* Der Tag-Filter ist **einwertig** (ein Tag = „Item trägt
     diesen Tag", Membership-Test). Mehrfach-Tags mit UND/ODER sind hier bewusst
     **nicht** umgesetzt (FilterBar ist Single-Select).
6. **Löschen entkoppelt:** Im Tag-Manager einen zugewiesenen Tag löschen.
   - *Erwartet:* Tag verschwindet sofort von allen Karten/Zeilen und aus dem
     Filter-Dropdown – keine „Geister-Tags".
7. **Persistenz:** Seite neu laden.
   - *Erwartet:* Tags, Farben und Zuweisungen bleiben erhalten (localStorage
     `pm-studio-tags` + `pm-studio-board`).

## DoD-Abgleich (`docs/testing-strategy.md`)

- [x] TypeScript strict, kein `any`
- [x] Reine Logik unit-getestet (`tags.ts`, Filter), Komponente getestet
- [x] Loading/Empty-States vorhanden (Tag-Manager-Leerstaat, Filter-Empty-State)
- [x] Statusfarben single-sourced (Token-Palette in `src/lib/tags.ts`, keine Ad-hoc-Hex)
- [x] Persist-Migration additiv (`pm-studio-board` v4→v5, `tagIds` optional)
- [x] Lint/Typecheck/Test/Build grün
- [x] Doku aktualisiert (`design-system.md`, `frontend-plan.md`, `task-index.md`)
- [x] Testkonzept (diese Datei) vorhanden
