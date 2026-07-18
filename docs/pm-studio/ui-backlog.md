---
module: pm-studio
type: doc
status: current
imported: 2026-07-08
source: projectmind-os
---

# UI-Backlog & Feedback-Notizen

> **Zweck:** Sammelstelle für UI-Feedback und Design-Ideen, die noch **keine**
> beschlossene Task sind. Hält den Kontext über `/clear` hinweg. **Status-Quelle
> bleibt** `docs/task-index.md`; konkrete Arbeit entsteht erst als eigene
> Task-Datei in `/tasks` (Regel: genau ein Task pro Branch/PR). Diese Liste ist
> ein **Vorschlags-Backlog**, keine Roadmap und keine beschlossene Kette.

Erfasst am 2026-06-17 nach einem UI-Durchgang durch den Nutzer (inkl.
Octane-Backlog-Screenshot als Referenz).

## Nutzer-Feedback (Originaleindrücke)

### Board – gefällt
- Kanban-Ansicht insgesamt gut; Items lassen sich einzeln gut anpassen.
- Filter sind gut/ausreichend.

### Board – Wünsche
1. **Listenansicht-Gruppierung** wie die Kanban-Swimlanes: gruppieren/filtern nach
   **Assignee / Sprint / Tag** (ggf. „nach gesetztem Text"). Heute gibt es Swimlanes
   nur in der Kanban-Ansicht.
2. **„+ Spalte"-Kachel** direkt rechts neben der letzten Board-Spalte (Phase),
   zum schnellen Anlegen einer neuen Phase – zusätzlich zu „Spalten verwalten".

### Sprint-Ansicht – Kritik
- Das Kanban-Spalten-Layout (alle Sprints nebeneinander) fühlt sich noch nicht
  passend an; offen für **alternative Designs**, die Sprints besser abbilden.
- Die **weiße horizontale Scrollbar** unten wirkt designtechnisch unstimmig.
- **Backlog-/Story-Items im Sprint sollen anklick- und bearbeitbar** sein – wie
  in der Board-Ansicht.

### Story-Aufgaben – schlechte Auffindbarkeit (Befund 2026-06-17) — ✅ erledigt (TASK-052)
> **Behoben** (TASK-052, PR → `dev`): Im Backlog-Tab sind jetzt **alle Epics offen**
> (statt nur das erste), jede Story trägt eine klickbare **Aufgaben-Count-Badge**, die
> zur „Aufgaben"-Sektion scrollt, und ohne ausgeführte Pipeline erscheint im
> Backlog-Tab ein erklärender Empty-State **„Noch kein Backlog" + CTA „Pipeline
> ausführen"** statt einer leeren Zeile. Kein Datenmodell-Change.

Das Anlegen von Aufgaben unter einer User Story (TASK-037) existiert, ist aber in
der UI **praktisch nicht zu finden** – vier Ebenen tief vergraben:
1. `/projects` → Projekt öffnen,
2. Projekt braucht eine **ausgeführte Pipeline** (sonst kein Backlog → Sektion
   erscheint gar nicht),
3. Tab **„Backlog"**,
4. Epic-Akkordeon aufklappen – per Default ist nur das **erste** Epic offen
   (`BacklogView.tsx:31`, `epics.slice(0, 1)`),
5. unter der Story die Box **„Aufgaben"** mit „Neue Aufgabe …" (`StoryTasks.tsx:128`).

Probleme: nur im Backlog-Tab, nichts Zentrales; im zugeklappten Akkordeon; ohne
Pipeline unsichtbar. Deckt sich mit der Audit-Lücke „Story → Tasks: UX
harmonisieren". → **eigene kleine Task** (Discoverability-Fix): Story anklickbar →
Aufgaben, klarere Sektion, Hinweis wenn noch keine Pipeline lief.

### „Meine Aufgaben" / My Work – eigener Bereich (Wunsch 2026-06-17)
Es fehlt eine zentrale, projekt-/storyübergreifende Sicht auf die **eigenen**
Aufgaben. Heute existiert `BoardTask.assigneeId` (Person aus `/team`), aber nur als
**Filter** am Board – keine „Das ist meins"-Liste.
- Lokal (Single-User): `/my-work` = Personen-Auswahl + gefilterte Liste der
  zugewiesenen / offenen / überfälligen Tasks (Daten liegen vor: Assignee, Due Date,
  Status, Kapazität).
- **Wichtig mit Login:** der eingeloggte User = eine `Person`; `/my-work` zeigt dann
  automatisch dessen Arbeit über alle Projekte. Nahtlos erweiterbar.
- Entspricht **TASK-042 (My Work)** in `docs/future-scope.md`. ✅ **umgesetzt**
  (PR → `dev`): Route `/my-work` (reine Selektoren `src/lib/my-work.ts`,
  Person-Auflösung gekapselt) inkl. globaler CommandBar-Suche
  (`src/lib/search.ts`).

### Review & Retro – Wunsch eines eigenen, „agileren" Bereichs
Heute (TASK-018) sind Review/Retro ein **Dialog am einzelnen Sprint** (Upsert,
genau eins pro Sprint). Gewünscht ist ein **eigenständiger Ceremonies-Bereich**:
- Eigener **Tab/Route** (z. B. `/reviews` bzw. „Ceremonies").
- **„Neue Review / neue Retro erstellen"** als eigener Flow → **Sprint auswählen**.
- **Scope wählen:** team-übergreifend / pro Team / pro Projekt.
- **Backlog-Elemente des Sprints** an Review/Retro anhängen (verlinkte Items).
- **Kommentare** möglich.
- **Historie:** jede Review/Retro dauerhaft, chronologisch einsehbar; auf jede
  zugreifen können.
- Generell „agileres" Design, das zu Review/Retro passt.

## Referenz: ALM Octane – Backlog-Ansicht (Screenshot)

Beobachtete Muster, die als Inspiration dienen:
- **Scope-Filter oben:** `Release` + `Milestone` (mit ◄ ► durchblätterbar); alles
  darunter ist auf diesen Scope eingeschränkt.
- **Hierarchie-Baum links:** `Backlog` → Epics (aufklappbar zu deren Items). Reine
  Navigation/Eingrenzung.
- **Tabs nach Item-Typ:** Overview · Epics · Features · Backlog Items · Tests · BDD
  (wechselt die *Ebene*, nicht nur den Filter).
- **Konfigurierbare Tabelle:** Spalten ID, Actual Story Points, Rank, Name, Author,
  Story Points, Release; Auswahl-Checkboxen; **Rank** = Priorisierung.
- **Toolbar-Controls:** Suche, **Bearbeiten**, **Spalten**, **Gruppieren**,
  **Filter**, Vollbild + Aktionen (`+ Feature`, `Plan`, `More`).
- **Aggregat-Fußzeile:** „Selected: 1 of 46 | Story points: 70 of 1925 | **Actual**
  41 of 170" → Summen + geplant-vs-tatsächlich auf einen Blick.

### Übernehmen (passt zum Scope)
- **Gruppieren-Control in der Listen-Toolbar** (Assignee/Sprint/Tag) – Wiederverwendung
  von `src/lib/swimlanes.ts` (`buildSwimlanes`), gerendert als Abschnitte in
  `BoardListView`.
- **Aggregat-Fußzeile** in der Liste (Auswahl-Anzahl, erledigt/geplant PT) – günstig,
  wir berechnen PT-Summen bereits (`sumEstimatePt`).
- **Hierarchie-Baum** Epic → Story als Navigation im Backlog (schlanker als Octane).

### Bewusst (noch) nicht übernehmen – wäre Overengineering für jetzt
- Volle **Item-Typ-Tabs** (Epics/Features/Backlog Items/Tests/BDD) – unsere
  Hierarchie ist schlanker (Epic → Story → Board-Task).
- **Globales Rank/Ranking** als eigene Spalte – sinnvoll, aber separate, spätere Task
  (Audit-Lücke „Story priorisieren").
- **Author / BDD / Tests / TestManagement** – out of scope.

## Vorgeschlagene Tasks (je eigene Datei in `/tasks`, eine nach der anderen)

| # | Task (Vorschlag) | Größe | Anmerkung |
|---|---|---|---|
| A | Listenansicht im „Octane-Stil": Gruppieren-Control (Reuse `swimlanes.ts`) + Aggregat-Fußzeile + erweiterte Spalten | M | hoher Nutzen, geringes Risiko |
| B | „+ Spalte"-Kachel am Board (Reuse `useBoardColumnsStore.addColumn`, Muster `QuickAddTask`) | XS | Quick win |
| C | Sprint-Detailseite (Kopf Ziel/Zeitraum/Fortschritt/Burndown + Story/Task-Liste); löst Scrollbar-Thema | M | ersetzt/ergänzt das reine Spalten-Layout |
| D | Story-/Item-Edit aus Sprint & Backlog (anklickbare Items wie im Board) | M | hängt am Story-Edit-Modell (Audit-Lücke) |
| E | Ceremonies-Bereich v1: eigene Route + Historie + Scope (Team/Projekt), Review/Retro als eigenständige, mehrfache Einträge | M | **erweitert** das TASK-018-Modell (TASK-018 selbst bleibt unangetastet/abgeschlossen) |
| F | Ceremonies v2: verlinkte Backlog-Items + Kommentare | M | baut auf E |
| G | ✅ **erledigt** (TASK-052, PR → `dev`): Story-Aufgaben sichtbarer (alle Epics offen, Aufgaben-Count-Badge je Story → scrollt zur Sektion, Empty-State + CTA „Pipeline ausführen" ohne Backlog) | S | behebt Befund 2026-06-17 |
| H | ✅ **erledigt** (TASK-042, PR → `dev`): `/my-work` mit Person-Auswahl + zugewiesenen/offenen/überfälligen Tasks; globale CommandBar-Suche + Create-Aktionen | M | Person-Auflösung in `resolveMyWorkPersonId` gekapselt → mit Login = aktueller User ohne Umbau |

> Hinweis zu E: TASK-018 hat das Fundament gelegt (`SprintReview`/`SprintRetro`
> im `useSprintStore`, Upsert je Sprint). Der Ceremonies-Bereich erweitert das
> Modell (Scope/`teamId`, `linkedStoryIds`/`linkedTaskIds`, `comments`,
> `createdAt`) und löst sich von „genau eins pro Sprint" hin zu „mehrere,
> historisch". Das ist bewusst eine **neue** Task, kein Nachbau von TASK-018.

## Offene Punkte / Rückfragen
- Screenshot der **Review/Retro-/Ceremonies-Ansicht** (Octane oder anderes Tool)
  fehlt noch – würde Task E/F am meisten schärfen.
- Reihenfolge noch offen: schneller Board-Feinschliff (A/B) vs. Sprint-Detailseite
  (C) vs. Ceremonies-Bereich (E).
