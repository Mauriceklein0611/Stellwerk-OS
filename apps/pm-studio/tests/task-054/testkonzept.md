# Testkonzept – TASK-054: Ceremonies-Bereich v1

Review und Retro lösen sich vom „genau einer Dialog pro Sprint" (TASK-018) und
werden ein eigenständiger **Ceremonies-Bereich** mit historischer Liste, Scope
(cross/team/project) und explizitem „Neue Review / neue Retro"-Flow.

## Automatisiert

| Datei | Prüfung |
| --- | --- |
| `ceremonies.test.ts` | `createReview`/`createRetro`: injizierbare `id`/`createdAt`, `teamId` nur bei `scope==="team"`, Zufalls-Id ohne Options; `isCeremonyInputValid` (Team-Scope braucht Team); `scopeLabel` (cross/project/team + Fallback); `ceremonyHistory` (Merge neueste-zuerst, leere Historie). |
| `sprint-store-migration.test.ts` | Persist-Migration v1→v2: Backfill der TASK-018-Upsert-Einträge (id/scope/`createdAt`=Epoch, Inhalt erhalten), tolerant ggü. fehlenden Arrays, No-op für bereits migrierte v2-Einträge. |
| `CeremonyHistory.test.tsx` | Empty-State; Reviews+Retros **neueste zuerst** mit Scope-Label + Sprint-Label; Legacy-Epoch-Datum als „Datum unbekannt". |
| `e2e/ceremonies.spec.ts` | Anlegen einer Review über den Flow → erscheint in der Historie → überlebt Reload; Anlegen einer Retro. |
| `tests/task-018/*` (angepasst) | Store nutzt jetzt `addReview`/`addRetro` (Append, mehrere je Sprint) statt Upsert; `removeSprint` räumt weiterhin auf; Schema-Content-Helfer unverändert (nur Rückgabetyp `ReviewContent`/`RetroContent`). |

Ausführen:

```bash
npx vitest run tests/task-054 tests/task-018
npx playwright test e2e/ceremonies.spec.ts
```

## Manuell (klickbare Akzeptanz)

1. **Route & Navigation:** In der Sidebar unter „Delivery" auf **Ceremonies**
   klicken → Seite „Ceremonies" öffnet sich. Erwartung: ohne Sprints ein
   Empty-State mit Link „Zu den Sprints"; mit Sprints die Buttons „Neue Review"
   / „Neue Retro".
2. **Neue Review:** „Neue Review" klicken → Dialog. Sprint ist vorausgewählt,
   Bezug = „Team-übergreifend". Text bei „Was wurde geliefert" eintragen,
   erreichte PT setzen, „Review speichern". Erwartung: Dialog schließt, Eintrag
   erscheint oben in der Historie mit Badge „Review", Sprint-Label und Datum.
3. **Scope Team:** „Neue Retro" → Bezug auf „Team" stellen. Erwartung: ein
   Team-Auswahlfeld erscheint; solange kein Team gewählt ist, steht ein Hinweis
   statt des Formulars. Team wählen → Formular erscheint. Nach dem Speichern
   zeigt der Eintrag „Team: <Name>".
4. **Historie/Mehrfach:** Für denselben Sprint mehrere Reviews anlegen.
   Erwartung: alle bleiben erhalten (kein Überschreiben), neueste zuerst.
5. **Klemmbrett-Flow bleibt:** Auf `/sprints` beim aktiven/erledigten Sprint das
   Klemmbrett-Icon → Review/Retro speichern. Erwartung: Eintrag erscheint (mit
   Bezug „Projekt") in der Ceremonies-Historie.
6. **Persistenz/Migration:** Seite neu laden. Erwartung: alle Einträge bleiben.
   (Bestehende TASK-018-Einträge werden beim ersten Laden verlustfrei in die
   Listenform überführt und als „Datum unbekannt" angezeigt.)

## DoD-Abgleich (`docs/testing-strategy.md`)

- [x] Typen zentral in `src/types/` (CeremonyScope/Meta/Content), Logik in `src/lib/`
- [x] Unit-Tests für reine Helfer + Store-Migration
- [x] Komponenten-Test (CeremonyHistory) inkl. Empty-State
- [x] E2E für den Hauptfluss (Anlegen + Historie + Persistenz)
- [x] Status-Farbe nur über `<StatusBadge>`; Scope als neutraler Chip
- [x] Loading-/Empty-States (Hydration-Gate, Empty-Historie, „keine Sprints")
- [x] Persist-Migration v1→v2 verlustfrei
- [x] Lint/Typecheck/Test/Build grün
