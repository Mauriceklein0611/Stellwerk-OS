# Testkonzept – TASK-055: Ceremonies-Bereich v2 (verlinkte Items + Kommentare)

Baut auf TASK-054 auf: Reviews/Retros docken jetzt an konkrete **Backlog-Items
des Sprints** an (`linkedStoryIds`/`linkedTaskIds`, Link navigiert zum Sprint)
und werden über **Kommentare** (`comments`) diskutierbar. Beides passiert am
Historien-Eintrag; der „Neue Review/Retro"-Dialog (TASK-054) bleibt unverändert.

## Automatisiert

| Datei | Prüfung |
| --- | --- |
| `ceremonies-links-comments.test.ts` | Reine Helfer: `toggleLink` (add/remove, tolerant ggü. `undefined`); `resolveLinks` (Titel-Auflösung, **gelöschtes Item ⇒ `missing`**, leere Ids); `createComment` (Trim, `null` bei leerem Text, Autor-Fallback „Unbekannt", Zufalls-Id); `addComment`/`removeComment` (immutabel), `commentsChronological` (älteste zuerst, stabil). |
| `sprint-store-ceremonies.test.ts` | Store-Actions: `toggleCeremonyStory`/`toggleCeremonyTask` (setzt/entfernt am richtigen Eintrag, Review vs. Retro getrennt, No-op bei falscher Id); `addCeremonyComment`/`removeCeremonyComment` (append/remove je Review/Retro unabhängig). |
| `CeremonyEnrichment.test.tsx` | Komponente: Empty-States; verlinkte Story als **Link auf `/sprints/<id>`**; **gelöschtes Item** robust (kein Anchor, „Gelöschtes Item"); Unlink-Button ruft Toggle; Picker verlinkt Task; Kommentar hinzufügen (Submit disabled bei leerem Text, baut Comment mit Text/Autor); Kommentar entfernen. |
| `e2e/ceremonies.spec.ts` (erweitert) | Review anlegen → Story über Picker verlinken (Chip + Link-Href) → Kommentar hinzufügen → **beides überlebt Reload**. |

Ausführen:

```bash
npx vitest run tests/task-055
npx playwright test e2e/ceremonies.spec.ts
```

## Manuell (klickbare Akzeptanz)

1. **Verlinken:** Auf `/ceremonies` einen Review/Retro-Eintrag → unter
   „Verknüpfte Items" auf **Verknüpfen** klicken. Erwartung: ein Panel listet die
   Stories und Tasks des zugehörigen Sprints. Eine Story anklicken → sie
   erscheint als Chip. Chip anklicken → navigiert zur Sprint-Detailseite.
2. **Entfernen:** Am Chip auf das ✕ klicken. Erwartung: Verknüpfung verschwindet.
3. **Kommentare:** Im Feld „Kommentar …" Text (optional Name) eingeben →
   „Hinzufügen" (oder Enter). Erwartung: Kommentar erscheint chronologisch
   (älteste zuerst) mit Autor + Datum. Der Button ist bei leerem Text deaktiviert.
   ✕ am Kommentar entfernt ihn.
4. **Gelöschtes Item robust:** Eine verlinkte Story/Task im Backlog bzw. Board
   löschen, dann `/ceremonies` neu laden. Erwartung: der Eintrag rendert weiter,
   das verwaiste Item wird als durchgestrichenes „Gelöschtes Item" angezeigt
   (kein Absturz, kein Link).
5. **Persistenz:** Seite neu laden. Erwartung: Verknüpfungen und Kommentare
   bleiben erhalten (additive Migration, TASK-054-Bestand bleibt gültig).

## DoD-Abgleich (`docs/testing-strategy.md`)

- [x] Typen zentral in `src/types/` (`CeremonyComment`, additive Felder an `CeremonyMeta`)
- [x] Logik in `src/lib/ceremonies.ts` (reine Helfer), Store-Actions dünn
- [x] Unit-Tests für Helfer + Store, Komponenten-Test inkl. Empty-/Missing-States
- [x] E2E für den Hauptfluss (Verlinken + Kommentar + Persistenz)
- [x] Status-Farbe nur über `<StatusBadge>` (unverändert); Chips neutral
- [x] Empty-/Loading-States (Hydration-Gate der Seite, „Keine Items", „Noch keine Kommentare")
- [x] Additive Persist-Migration (keine Version-Erhöhung nötig; Felder optional)
- [x] Verwaiste Links robust (`resolveLinks` markiert `missing`)
- [x] Lint/Typecheck/Test/Build grün
