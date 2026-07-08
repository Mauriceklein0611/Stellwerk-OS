# Testkonzept TASK-061 – Projekt-Detail entschlacken + Risiken als Entitäten

## Automatisiert

| Datei | Prüfung |
| --- | --- |
| `tests/task-061/useRiskStore.test.ts` | `setRisks` (Array ersetzen, funktioniert **ohne** Pipeline/Artefakt); `importRisks` (additiv & idempotent über Risiko-Id, überschreibt human-edited nie, backfillt fehlenden Status); `removeProjectRisks` (Lösch-Kaskade je Projekt); `restore` (Slice-Undo); `migrateFromArtifacts` (einmalig, Flag, Bestand gewinnt über Legacy, Status-Backfill). |
| `tests/task-061/BacklogReferenceCard.test.tsx` | Rollup projektbezogen (Epics/Stories/Σ PT, Fremdprojekt ausgeschlossen); Deep-Link `/backlog?project=<id>`; Null-Rollup ohne Backlog. |
| `tests/task-009/pipeline-store.test.ts` (erweitert) | Ein Pipeline-Lauf promotet die Risiken über `importRisks` in den `useRiskStore` (nicht nur ins Artefakt). |
| `tests/task-011/dashboard-selectors.test.ts` (angepasst) | `selectMetrics` zählt „Offene Risiken" aus dem neuen `risks`-Parameter (Risk-Store), nicht mehr aus dem Artefakt. |
| `tests/task-045/project-store-risks.test.ts` (angepasst) | Der obsolet gewordene `useProjectStore.setRisks`-Block wurde entfernt (Editieren lebt jetzt im Risk-Store); die Artefakt-Status-Migration (v1→v2) bleibt geprüft. |

## Manuell (klickbare Akzeptanz)

Voraussetzung: `npm run dev`, mindestens eine Projektidee vorhanden.

1. **Backlog-Verweis statt Tab-Duplikat**
   - Projekt öffnen → Tab **„Backlog"**. Erwartung: **kein** eingebettetes Backlog mehr, sondern eine Karte mit Rollup **Epics / Stories / Σ PT** und Button **„Backlog öffnen"**.
   - Rollup mit dem echten `/backlog`-Bereich abgleichen (gleiche Zahlen). „Backlog öffnen" führt nach `/backlog?project=<id>` mit vorgewähltem Projekt.

2. **Risiken ohne Pipeline**
   - Frisches Projekt (nie „Pipeline ausführen" gedrückt) → Tab **„Risiken"**. Erwartung: leeres Register mit **„Risiko hinzufügen"** (kein „Noch keine Artefakte"-Hinweis).
   - Risiko anlegen → erscheint sofort. Bearbeiten (Status/Owner/Maßnahme) → übernommen. Löschen → **Confirm-Dialog**, danach **Toast mit „Rückgängig"**; Undo stellt das Risiko wieder her.
   - **Reload** (F5): Risiken bleiben erhalten (persistiert im `pm-studio-risks`).

3. **Agentenlauf ersetzt nichts**
   - Auf einem Projekt mit manuell bearbeitetem Risiko **„Pipeline ausführen"**. Erwartung: Agenten-Risiken werden **ergänzt**, das bearbeitete Risiko bleibt unverändert (kein Überschreiben, keine Dublette bei erneutem Lauf).

4. **Primär-/Sekundäraktion & Stepper**
   - Projektkopf: Primär **„Planung starten"** (Sparkles) → `/backlog?project=<id>&plan=1`, **Agenten-Panel ist offen**. „Pipeline ausführen" ist die **sekundäre** (outline) Aktion.
   - Im Stepper auf den **Scrum/Backlog-Schritt** klicken (sobald „done") → springt nach `/backlog?project=<id>` statt in einen Tab.

5. **Migration Bestand**
   - Projekt, dessen Risiken vor diesem Task über die Pipeline entstanden sind, öffnen → Risiken erscheinen im neuen Register (einmalige, verlustfreie Übernahme aus dem Artefakt).

6. **Dashboard-Konsistenz**
   - Dashboard-Kachel **„Offene Risiken"** entspricht der Summe aller Risiken (inkl. der ohne Pipeline von Hand angelegten).

## DoD-Abgleich (`docs/testing-strategy.md`)

- [x] Lint, Typecheck, Unit-Tests, Build grün (610 Tests).
- [x] Neue Logik in reinen Helfern/Store, unit-getestet (`useRiskStore`, `BacklogReferenceCard`).
- [x] Keine neue Dependency, keine Secrets.
- [x] Loading-/Empty-States: Risiko-Register-Empty, Null-Rollup der Verweiskarte.
- [x] Status-Farben ausschließlich über `<StatusBadge>` (unverändert in `RiskTable`).
- [x] Safe-Delete via `useConfirmDelete` (Projekt-Löschen snapshottet zusätzlich die Risk-Slice).
- [x] Testkonzept vorhanden (diese Datei) mit manueller Checkliste.
- [x] Doku aktualisiert (`architecture.md`, `frontend-plan.md`, `task-index.md`).
