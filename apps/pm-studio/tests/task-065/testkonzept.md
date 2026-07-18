# Testkonzept – TASK-065: Retro-Maßnahmen als Tasks (Action Items schließen den Zyklus)

Aus einer Retro-**Maßnahme** (String in `SprintRetro.actions`) wird mit einem
Klick ein echter **Board-Task** (Owner, optionales Fälligkeitsdatum,
Herkunfts-Referenz). Verknüpfung über zwei additive Felder am Task:
`sourceRetroId` (welche Retro) + `sourceRetroAction` (welcher Aktions-Text) –
zusammen identifizieren sie die *einzelne* Maßnahme und sichern den
Duplikat-Schutz. Zusätzlich listet die **Sprint-Detailseite** die Reviews/Retros
des Sprints (Link zu `/ceremonies`).

## Automatisiert

| Datei | Prüfung |
| --- | --- |
| `retro-actions.test.ts` | Reine Helfer: `findRetroActionTask`/`retroActionHasTask` (Match nur bei **Retro-Id UND Aktions-Text**; andere Aktion/andere Retro ⇒ kein Match); `buildRetroActionTask` (Spalte `todo`, Priorität `mittel`, Herkunfts-Felder gesetzt, Assignee/Due optional & bei Fehlen **weggelassen**, injizierbare Id, leerer Titel ⇒ Fallback auf Aktions-Text). |
| `CeremonyHistory-actions.test.tsx` | Komponente: „→ Task"-Button je Aktion, wenn kein Task existiert; Klick ruft `onCreateActionTask(retro, action)`; existiert bereits ein Task (`sourceRetroId`+`sourceRetroAction`) ⇒ **Badge „Task erstellt" statt Button** (Dedup, gemischt: eine verknüpfte + eine offene Aktion). |
| `RetroActionDialog.test.tsx` | Mini-Dialog: Titel **vorbefüllt** mit Aktions-Text; „Task erstellen" liefert `{title, assigneeId, dueDate}` und schließt; Button **disabled** bei leerem Titel. |
| `SprintDetail-ceremonies.test.tsx` | Sprint-Detail: Empty-State ohne Ceremonies; listet Reviews/Retros des Sprints mit Link auf `/ceremonies`; **nur** Ceremonies dieses Sprints (Fremd-Sprint gefiltert). |
| `e2e/ceremonies.spec.ts` (erweitert) | (1) Retro mit Aktion anlegen → Aktion → Task via vorbefülltem Dialog → **Badge statt Button** (Zweitklick unmöglich) → überlebt Reload → Task liegt real auf `/board`. (2) Sprint-Detail listet die Ceremony verlinkt. |

Ausführen:

```bash
npx vitest run tests/task-065
npx playwright test e2e/ceremonies.spec.ts
```

## Manuell (klickbare Akzeptanz)

1. **Maßnahme → Task:** Auf `/ceremonies` eine Retro mit einer Maßnahme unter
   „Aktionen" anlegen (oder eine bestehende öffnen). Neben der Maßnahme auf
   **„Task"** klicken. Erwartung: ein Mini-Dialog öffnet sich, der **Titel ist
   mit dem Maßnahmen-Text vorbelegt**; optional Zuständigkeit + Fälligkeit
   wählen → **Task erstellen**.
2. **Sofort sichtbar:** Auf `/board` (Projekt des Sprints) erscheint der Task in
   Spalte „To Do"; unter „Meine Aufgaben" (`/my-work`) erscheint er bei der
   gewählten Person.
3. **Kein Duplikat:** Zurück auf `/ceremonies` zeigt die Maßnahme jetzt ein
   grünes **„Task erstellt"**-Badge statt des Buttons – ein Zweitklick ist nicht
   möglich.
4. **Sprint-Detail:** Auf `/sprints/<id>` listet der Abschnitt „Ceremonies" die
   Reviews/Retros dieses Sprints; Klick führt zu `/ceremonies`. Ohne Ceremonies
   erscheint ein Empty-State.
5. **Robust bei Löschung:** Den erzeugten Task auf dem Board löschen, dann
   `/ceremonies` neu laden. Erwartung: die Maßnahme zeigt wieder den „Task"-Button
   (kein Absturz), ein neuer Task kann erzeugt werden.
6. **Persistenz:** Seite neu laden. Erwartung: verknüpfte Maßnahmen bleiben als
   „Task erstellt" markiert (Task im Board-Store persistiert).

## DoD-Abgleich (`docs/testing-strategy.md`)

- [x] Typen zentral in `src/types/` (`BoardTask.sourceRetroId`/`sourceRetroAction`, additiv)
- [x] Logik in `src/lib/retro-actions.ts` (reine Helfer), Store unverändert (`addTask` reicht)
- [x] Unit-Tests für Helfer + Komponenten (Dialog, History-Aktionen, Sprint-Detail)
- [x] E2E für den Hauptfluss (Maßnahme→Task, Dedup, Reload, Board) + Sprint-Detail-Listing
- [x] Status-Farbe nur über `<StatusBadge>` („Task erstellt"-Badge)
- [x] Empty-States (Sprint-Detail „Noch keine Reviews oder Retros")
- [x] Duplikat-Schutz je Maßnahme (Badge statt Button)
- [x] Gelöschter Task bricht die Anzeige nicht (Lookup fällt zurück auf Button)
- [x] Additive Persist-Migration (keine Version-Erhöhung; Felder optional)
- [x] Lint/Typecheck/Test/Build grün
