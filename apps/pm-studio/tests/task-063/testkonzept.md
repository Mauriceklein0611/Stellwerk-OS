# Testkonzept TASK-063 – Board-Listenansicht im Octane-Stil (Gruppieren + Aggregat-Fußzeile)

## Automatisiert

| Datei | Prüfung |
| --- | --- |
| `summarize-board-rows.test.ts` | Reiner Helfer `summarizeBoardRows`: Anzahl + Σ geplant (fehlende Schätzung = 0), Σ erledigt nur über terminale Phase (`isTerminalColumn`), Leerliste = alles 0, respektiert Custom-Terminal-Phasen (Done folgt dem Phasen-Flag, nicht dem Namen „done"). |
| `BoardListView.test.tsx` | Globale Fußzeile (`board-list-footer`) mit Anzahl + geplant/erledigt PT; **keine** Gruppenköpfe im Flat-Modus; je Swimlane eine Sektion (`board-group-<laneId>`) mit Zwischensumme im Kopf; „ohne Zuordnung"-Lane zuletzt; alle Task-Zeilen bleiben sichtbar; Inline-Edit (Titel) und Zeilenklick (TaskDialog) funktionieren **innerhalb** einer Gruppe unverändert. |
| `e2e/board.spec.ts` (Bestand erweitert) | „groups the list view into sections with an aggregate footer that survives a reload": Liste → Fußzeile sichtbar; Gruppieren nach „Zuständig" (geteilter `groupBy`) erzeugt „Nicht zugewiesen"-Sektion, alle Zeilen sichtbar; View + Gruppierung überleben Reload (Board-Store-Persist). |

## Manuell (klickbare Akzeptanz)

Voraussetzung: Board mit einigen Tasks (idealerweise verschiedene Zuständige/Sprints/Tags und einige in einer erledigten Phase).

1. **Auf `/board` gehen → „Liste" wählen.**
   - Erwartung: Tabelle mit Task-Zeilen; **unten eine Fußzeile** „N Tasks · Σ geplant X PT · Σ erledigt Y PT".
2. **Oben rechts „Gruppieren nach" auf „Zuständig" stellen** (der Umschalter ist jetzt auch in der Liste sichtbar).
   - Erwartung: Die Liste zerfällt in Sektionen je Person; jeder **Sektionskopf** zeigt den Namen + eine **Zwischensumme** (Anzahl/geplant/erledigt). Tasks ohne Zuständige landen in „Nicht zugewiesen" **ganz unten**.
3. **Auf „Sprint" bzw. „Tag" umschalten.**
   - Erwartung: Gruppierung wechselt entsprechend; leere Gruppen erscheinen nicht; „ohne Zuordnung"-Sektion bleibt zuletzt.
4. **Innerhalb einer Gruppe eine Zelle inline bearbeiten** (Titel/Status/Priorität/PT) und **eine Zeile daneben anklicken**.
   - Erwartung: Inline-Edit speichert wie in der flachen Liste; Klick auf den Rest der Zeile öffnet den Task-Dialog. Zwischensummen und Fußzeile aktualisieren sich.
5. **Auf „Kanban" umschalten.**
   - Erwartung: Dieselbe Gruppierung (geteilter Zustand) greift als Swimlanes.
6. **Seite neu laden.**
   - Erwartung: Ansicht (Liste) **und** Gruppierung bleiben erhalten.
7. **Einen Filter setzen (z. B. Projekt/Priorität).**
   - Erwartung: Gruppen und Fußzeile beziehen sich nur auf die gefilterten Tasks; leere Gruppen verschwinden.

## DoD-Abgleich (`docs/testing-strategy.md`)

- [x] Reine Logik (`summarizeBoardRows`) unit-getestet, deterministisch, keine zweite Done-Logik (nutzt `isTerminalColumn`, konsistent zu TASK-032/038).
- [x] Komponententests für Gruppierung, Zwischensummen, Fußzeile und Interaktions-Regression (Inline-Edit/Zeilenklick).
- [x] E2E deckt den Nutzerfluss (Liste + Gruppieren + Fußzeile + Reload-Persistenz) ab.
- [x] Keine neue Dependency; Gruppierung nutzt exakt `buildSwimlanes` (eine Quelle, TASK-036); `groupBy` geteilt/persistiert.
- [x] Loading/Empty-States: bestehender „Keine Tasks vorhanden."-Zustand bleibt; leere Gruppen werden ausgeblendet.
- [x] Barrierefreiheit: Gruppieren-Umschalter ist die bestehende ARIA-Radiogroup; Fußzeile/Sektionsköpfe sind reiner Text.
- [x] Abwärtskompatibel: `lanes`/`groupBy` optional (Default = flache Liste) ⇒ `/my-work` und Bestandstests unverändert grün.
