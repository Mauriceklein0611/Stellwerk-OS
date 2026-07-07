# Testkonzept – TASK-064: Lesbare Item-Keys (PROJ-123)

Menschlich lesbare, fortlaufende Keys je Projekt (`PMS-42`) für Stories **und**
Board-Tasks – zusätzlich zur internen UUID. Eine gemeinsame Laufnummer pro Projekt
(Jira-Muster), zentral im **`useItemKeyStore`** (Leaf-Store) als Karte
`itemId → key` gehalten (keine Persist-Migration auf Backlog-/Board-Store,
undo-stabil, da Keys nie entfernt werden).

## Automatisiert

| Datei | Prüfung |
|---|---|
| `item-key.test.ts` | `derivePrefix`: Wort-Initialen (mehrere Wörter), erste Buchstaben (ein Wort), Akzent-Strip, deterministischer Suffix bei Kollision, `PRJ`-Fallback. `formatItemKey`. `buildKeyBackfill`: Prefix je Projekt, Keys **Stories (nach `rank`) vor Tasks**, geteilte Laufnummer, Idempotenz (Re-Run = No-op), Zähler zählt nur hoch (neue Items), Projekt-Prefix-Kollision. |
| `useItemKeyStore.test.ts` | `registerProject` (idempotent + Kollision), `assignKey` (Laufnummer je Projekt, idempotent per Item-Id, nie wiederverwendet, Lazy-Prefix aus Name), `runBackfill` (liest die drei Stores aus `localStorage`, keyt Bestand, **einmalig** – zweiter Lauf No-op). |
| `search-keys.test.ts` | `searchEntities` findet Task/Story per Key (case-insensitiv), **exakter Key-Match rankt zuerst**, `keys`-Feld optional (Altaufrufer bleiben gültig). |
| `BoardListView-key.test.tsx` | Erste Spalte („Key") zeigt den lesbaren Key; Fallback auf die Kurz-Id, solange kein Key vorhanden ist. |
| `e2e/backlog.spec.ts` (Ergänzung) | Backfill vergibt `EBP-1`/`EBP-2` (Prefix aus „E2E Backlog-Projekt"), Key überlebt Reload, globale Suche findet die Story per Key und springt zum Projekt. |

Bestehende Suites unverändert grün (655 Unit-Tests): die Item-Erzeugung
(`addStory`/`addTask`/`importBacklog`) ruft `assignKey` zusätzlich auf, ohne die
bestehenden Assertions zu berühren.

## Manuell (klickbare Akzeptanz)

1. **Neue Story bekommt einen Key**
   - `/backlog` öffnen, Projekt wählen, „+ Story" → Titel eingeben, Enter.
   - Erwartung: die Zeile zeigt links einen mono-Key `⟨PREFIX⟩-N` (ab ≥ sm-Breite).
2. **Neuer Task teilt die Projekt-Sequenz**
   - Auf dem `/board` per Quick-Add einen Task im selben Projekt anlegen.
   - Erwartung: der Key läuft mit der Story-Nummerierung weiter (z. B. Story `PMS-3`, Task `PMS-4`).
3. **Key überall sichtbar**
   - Task-Karte (Board), Task-Dialog-Kopf, Listenansicht-Spalte „Key",
     Backlog-Zeile, Story-Dialog-Kopf, Sprint-Story-Zeile/-Karte.
   - Erwartung: derselbe Key erscheint an jeder dieser Stellen.
4. **Suche per Key**
   - ⌘K / Such-Button, Key (z. B. `PMS-4`) eingeben.
   - Erwartung: der Treffer erscheint mit Key-Badge und öffnet das Item/Projekt;
     ein exakter Key-Match steht ganz oben.
5. **Stabilität nach Löschen/Undo**
   - Eine Story löschen, per Undo-Toast wiederherstellen; Seite neu laden.
   - Erwartung: die Story trägt wieder denselben Key; neu angelegte Items bekommen
     eine **neue** Nummer (kein Recycling).
6. **Bestand nachnummeriert**
   - Mit vorhandenen (vor dem Feature angelegten) Stories/Tasks laden.
   - Erwartung: alle Bestandsitems haben nach dem ersten Laden Keys (Erstellungs-
     reihenfolge: Stories nach `rank`, dann Tasks).

## DoD-Abgleich (`docs/testing-strategy.md`)

- [x] Reine Logik isoliert & unit-getestet (`item-key.ts`, `search.ts`).
- [x] Store-Verhalten getestet (Register/Assign/Backfill, Idempotenz).
- [x] Komponenten-Render getestet (Listenansicht-Key-Spalte) + E2E (Backlog + Suche).
- [x] Keine neue Dependency, keine Persist-Migration bestehender Stores.
- [x] Status-Farben unberührt (Key ist neutral/mono, kein Status).
- [x] Gate grün: Lint (0 Fehler), `tsc --noEmit`, 655 Unit-Tests, Build, E2E (Board 12, Backlog 8, Sprints 3).
