---
module: pm-studio
type: doc
status: frozen
imported: 2026-07-08
source: projectmind-os
---

> **Frozen** – importiert aus projectmind-os (Issue #10). Offene Alt-Tasks werden als [PMS]-Issues nachgezogen (separates Triage-Issue).

# Aufgaben-Archiv

Vollständiger Inhalt **abgeschlossener** Task-Dateien. Sobald ein Task fertig
(gemergt) ist, wandert seine `tasks/TASK-XXX.md` hierher (neueste zuerst) und die
Originaldatei in `tasks/` wird gelöscht. `tasks/` enthält damit nur noch offene
bzw. aktive Arbeit; der Status-Überblick bleibt in [task-index.md](task-index.md).

---

## TASK-065: Retro-Maßnahmen als Tasks (Action Items schließen den Zyklus)

**Abgeschlossen:** 2026-07-06 · **Meilenstein:** UI-Backlog · **Branch:** `feat/task-065-retro-action-tasks`

**Meilenstein:** UI-Backlog · **Umfang:** klein–mittel · **Priorität:** P2
**Quelle:** Review 2026-07-02, Abschnitt 5 · **Abhängigkeit:** keine (TASK-054/055 vorhanden)

### Ziel

Aus einer Retro-Maßnahme mit einem Klick einen echten Board-Task machen (Owner,
optionales Fälligkeitsdatum, Herkunfts-Referenz), damit Maßnahmen nicht versanden.
Zusätzlich: Ceremonies eines Sprints auf der Sprint-Detailseite verlinken.

### Betroffene Dateien

- `src/types/index.ts` – `BoardTask.sourceRetroId?` **und** `sourceRetroAction?` (additiv). Bewusste Abweichung von der ursprünglichen Skizze (nur `sourceRetroId`): eine Retro hat mehrere Aktionen, die Retro-Id allein identifiziert die einzelne Maßnahme nicht ⇒ zweites Feld für den Duplikat-Schutz.
- `src/lib/retro-actions.ts` (neu) – reine Helfer `findRetroActionTask`/`retroActionHasTask`/`buildRetroActionTask`.
- `src/components/ceremony/RetroActionDialog.tsx` (neu) – vorbefüllter Mini-Dialog (Titel/Assignee/Due), keyed-Form.
- `src/components/ceremony/CeremonyHistory.tsx` – „→ Task"-Button bzw. „Task erstellt"-Badge je Maßnahme (`RetroBody`).
- `src/app/(dashboard)/ceremonies/page.tsx` – Orchestrierung (Projekt aus Sprint, `addTask`, Dialog-State).
- `src/store/useBoardStore.ts` – unverändert (`addTask` reicht).
- `src/components/sprint/SprintDetail.tsx` – Abschnitt „Ceremonies" (Reviews/Retros des Sprints, Link zu `/ceremonies`).
- `tests/task-065/`

### Technische Anforderungen

- Duplikat-Schutz: je Maßnahme höchstens ein verknüpfter Task (Badge statt Button, wenn vorhanden).
- Gelöschter Task bricht die Ceremonies-Anzeige nicht (Lookup fällt auf den Button zurück; Muster TASK-055 `missing`).
- Task erbt Projekt des Sprints; Spalte Default `todo`.

### Akzeptanzkriterien

- [x] Maßnahme → Task mit Owner/Due erzeugbar; erscheint sofort auf Board & My Work
- [x] Zweitklick erzeugt kein Duplikat; Verknüpfungsstatus sichtbar (Badge „Task erstellt")
- [x] Sprint-Detailseite listet zugehörige Reviews/Retros verlinkt
- [x] Gate grün; `tests/task-065/` + `testkonzept.md`

### Erwartetes Ergebnis

Der Scrum-Zyklus schließt sich: Retro-Erkenntnisse werden nachverfolgbare Arbeit.

### Umsetzungsnotiz

- **Identität einer Maßnahme:** Retro-`actions` sind reine Strings ohne Id. Die
  Verknüpfung nutzt daher `sourceRetroId` + Original-`sourceRetroAction`; der
  Task-Titel ist editierbar, die Verknüpfung bleibt am Original-Text stabil.
- **Store dünn:** keine neue Board-Action – `buildRetroActionTask` erzeugt das
  `Omit<BoardTask,"order">`, `addTask` vergibt `order` und (TASK-064) den Item-Key.
- **Kein setState-in-Effect:** der Mini-Dialog initialisiert eine **keyed** innere
  Form aus den Props (Muster `CeremonyDialog`), statt in `useEffect` zurückzusetzen.
- Tests: `tests/task-065/` (retro-actions 11, CeremonyHistory-actions 3,
  RetroActionDialog 3, SprintDetail-ceremonies 3 = 16) + `e2e/ceremonies.spec.ts`
  (Maßnahme→Task+Dedup+Reload+Board, Sprint-Detail-Listing). Gate grün
  (671 Tests, Build) + E2E (Ceremonies 5, Board 12, Sprints 3).

---

## TASK-064: Lesbare Item-Keys (PROJ-123)

**Abgeschlossen:** 2026-07-06 · **Meilenstein:** UI-Backlog · **Branch:** `feat/task-064-readable-item-keys`

**Meilenstein:** UI-Backlog · **Umfang:** klein · **Priorität:** P2
**Quelle:** Review 2026-07-02, Abschnitt 6 (Jira-Muster) · **Abhängigkeit:** TASK-056

### Ziel

Menschlich lesbare, fortlaufende Keys je Projekt für Stories und Board-Tasks
(z. B. `PMS-42`), zusätzlich zur internen UUID – für Kommunikation, Suche und
später präzise Agenten-Referenzen.

### Umsetzung (Abweichung von der „Betroffene Dateien"-Skizze bewusst)

- **Neuer Leaf-Store `useItemKeyStore`** (`pm-studio-item-keys` v1) statt Zähler
  in `useProjectStore` und `key?`-Feld auf jeder Entität: hält `prefixes`
  (projectId→Prefix), `counters` (projectId→zuletzt vergebene Nummer, zählt nur
  hoch) und eine **zentrale Karte `keys` (itemId→Key)**. Vorteile: **keine
  Persist-Migration** auf Backlog-/Board-Store, **keine** Store-Init-Zyklus-
  Erweiterung (der Store importiert nichts; Projekt-/Backlog-/Board-Store rufen
  ihn zur Laufzeit via `getState()` – Muster `useActivityStore`), und Keys sind
  **undo-stabil**, weil sie nie aus der Karte entfernt werden.
- **Gemeinsame Sequenz je Projekt** über Stories **und** Tasks (Jira-Muster):
  `PMS-1` kann eine Story, `PMS-2` ein Task sein.
- **Reine Helfer `src/lib/item-key.ts`:** `derivePrefix(name, taken)` (Initialen
  bei mehreren Wörtern bzw. erste Buchstaben bei einem Wort, Akzent-Strip via
  `normalize`, `PRJ`-Fallback, **deterministischer Zahlensuffix** bei Kollision),
  `formatItemKey`, `buildKeyBackfill` (pure, idempotent).
- **Vergabe zentral in den Create-Actions:** `useProjectStore.addIdea` →
  `registerProject`; `useBacklogStore.addStory`/`importBacklog` und
  `useBoardStore.addTask` → `assignKey` (außerhalb des `set`-Updaters, wie
  `logActivity`). Alle Anlege-Pfade (Quick-Add, StoryTasks, „In Board übernehmen",
  Vorschlags-Inbox, Pipeline) bekommen dadurch automatisch Keys.
- **Bestand nachnummeriert (einmalig):** `runBackfill` liest die drei Stores
  **direkt aus `localStorage`** (zyklusfrei, hydrationsreihenfolge-unabhängig,
  Muster Backlog-Artefakt-Migration) und keyt vorhandene Items in stabiler
  Erstellungsreihenfolge-Näherung (Stories nach `rank`, dann Tasks nach
  `column`/`order`); Flag `backfilled` verhindert Doppelvergabe.
- **Anzeige überall über den Store** (primitiver Selektor `keys[id]`, kein
  getSnapshot-Loop): `TaskCard`, `TaskDialog`-Kopf, `StoryDialog`-Kopf,
  Backlog-Zeile (`BacklogTree`), `SprintStoryCard` (Row + Card),
  `BoardListView` (erste Spalte „Key", Fallback Kurz-Id; `itemKey` über
  `buildBoardRows` mit neuem optionalen `keys`-Parameter → auch `/my-work`).
- **Suche (`searchEntities`):** neues optionales `keys`-Feld in `SearchSources`;
  Task/Story matchen zusätzlich per Key, **exakter Key-Match rankt zuerst**;
  Ergebnis trägt ein `badge` (Key), das die CommandBar mono voranstellt.

### Technische Anforderungen

- Keys sind eindeutig je Projekt, werden nie wiederverwendet (Zähler zählt nur hoch, auch nach Löschen).
- UUID bleibt Primärschlüssel; Key ist Anzeige/Referenz.
- Präfix-Kollisionen beim Ableiten (zwei Projekte → gleiches Kürzel) deterministisch auflösen (Suffix).

### Akzeptanzkriterien

- [x] Neue Stories/Tasks erhalten automatisch einen Key; Bestand ist nachnummeriert
- [x] Key überall dort sichtbar, wo das Item erscheint; Suche findet Items per Key
- [x] Keys bleiben nach Löschen/Undo stabil und eindeutig
- [x] Gate grün; `tests/task-064/` + `testkonzept.md`

### Tests

`tests/task-064/` (`item-key` 12, `useItemKeyStore` 8, `search-keys` 4,
`BoardListView-key` 2 = 24) + `e2e/backlog.spec.ts` (Backfill-Keys + Reload +
Suche per Key, 8 gesamt) + `testkonzept.md`. Gate grün (655 Tests, Build) +
E2E (Board 12, Backlog 8, Sprints 3).

### Erwartetes Ergebnis

Items sind endlich benennbar („nimm PMS-42 in den Sprint") – kleiner Aufwand,
großer Alltagsnutzen.

---

## TASK-063: Board-Listenansicht im Octane-Stil (Gruppieren + Aggregat-Fußzeile)

**Abgeschlossen:** 2026-07-06 · **Meilenstein:** UI-Backlog · **Branch:** `feat/task-063-board-list-grouping`

**Meilenstein:** UI-Backlog · **Umfang:** mittel · **Priorität:** P2
**Quelle:** `docs/ui-backlog.md` Vorschlag „A" (bislang unnummeriert) · **Abhängigkeit:** keine (parallel zur 056er-Welle möglich)

### Ziel

Die Board-**Listenansicht** um ein Gruppieren-Control (Assignee / Sprint / Tag,
Reuse `buildSwimlanes`) und eine Aggregat-Fußzeile (Anzahl, Σ PT geplant/erledigt)
erweitern – die im Octane-Screenshot analysierten und als „Übernehmen" markierten
Muster.

### Betroffene Dateien

- `src/components/board/BoardListView.tsx` – gruppierte Sektionen (Lanes aus `src/lib/swimlanes.ts` als Abschnitte gerendert), Fußzeile
- `src/lib/board-rows.ts` – Summen-Helfer (Reuse `sumEstimatePt`, terminal via `isTerminalColumn`)
- `src/app/(dashboard)/board/page.tsx` – `SwimlaneSelect` auch in der Listenansicht anbieten (gleicher persistierter `groupBy`-State)
- `tests/task-063/`

### Technische Anforderungen

- Gruppierung nutzt exakt die Kanban-Swimlane-Logik (eine Quelle, TASK-036); „ohne Zuordnung" zuletzt, leere Gruppen ausgeblendet.
- Fußzeile global und je Gruppe (Zwischensumme im Sektionskopf).
- Sortierung innerhalb der Gruppen bleibt TanStack-basiert; Inline-Editing (TASK-030) unverändert.

### Akzeptanzkriterien

- [x] Liste gruppierbar nach Assignee/Sprint/Tag; Auswahl mit Kanban geteilt und persistiert
- [x] Fußzeile zeigt Anzahl + PT geplant/erledigt (gesamt und je Gruppe), konsistent zu TASK-038
- [x] Inline-Edit, Zeilenklick (TaskDialog) und Filter funktionieren in gruppierter Ansicht unverändert
- [x] Gate grün; `tests/task-063/` + `testkonzept.md`

### Erwartetes Ergebnis

Die Listenansicht erreicht Octane-Niveau für tägliche Triage: gruppieren,
überblicken, summieren.

### Umsetzungsnotiz

Umgesetzt mit **einer** Tabelle / **einem** `useReactTable`: die Sektionen
partitionieren das **bereits sortierte** Row-Model (Filter je Lane-Task-Id aus
`buildSwimlanes`), damit TanStack-Sortierung und Inline-Editing (TASK-030) exakt
erhalten bleiben. Die Zwischensumme sitzt im Sektionskopf (`<tr>` mit `colSpan`),
die globale Summe in `<tfoot>`. `summarizeBoardRows` leitet „erledigt"
ausschließlich über `isTerminalColumn` ab (konsistent zu TASK-032/038, keine
zweite Done-Logik) und reused `sumEstimatePt`. Die neuen Props `lanes`/`groupBy`
sind **optional** (Default = flache Liste), damit `/my-work` und die
Bestandstests (`tests/task-030`) unverändert grün bleiben. Der `SwimlaneSelect`
wird jetzt in beiden Ansichten gerendert und teilt den persistierten
`groupBy`-State des Board-Stores. Tests: `tests/task-063/`
(`summarize-board-rows` 4 + `BoardListView` 7 = 11) + `e2e/board.spec.ts` (Liste
gruppieren + Fußzeile + Reload). Gate grün (631 Tests, Build) + Board-E2E (12).

---

## TASK-062: Release-Scope – Items einem Release zuordnen + Scope-Filter

**Abgeschlossen:** 2026-07-06 · **Meilenstein:** 5++++ Backlog als Modul · **Branch:** `feat/task-062-release-scope`

**Meilenstein:** 5++++ Backlog als Modul · **Umfang:** mittel · **Priorität:** P1/P2
**Quelle:** Review 2026-07-02, Abschnitte 5+6 (Octane-/Jira-fixVersion-Muster) · **Abhängigkeit:** TASK-056, TASK-057 (TASK-058 empfohlen)

### Ziel

Releases erhalten einen inhaltlichen Scope: Stories können einem Release
zugeordnet werden (`releaseId`, analog Jira fixVersion / Octane Release), der
Backlog-Kopf bekommt einen Release-Scope-Filter, die `ReleaseCard` zeigt den Scope.

### Kontext

Ein Release kennt heute nur seine generierten Sprints; `releaseProgress` bleibt
sprint-basiert bestehen. `UserStory.releaseId?` wurde in TASK-056 als Typfeld
vorbereitet – hier folgt die UI.

### Betroffene Dateien

- `src/components/backlog/StoryDialog.tsx` + Backlog-Zeile – Release-Select (Releases des Projekts, `useReleaseStore`)
- `src/app/(dashboard)/backlog/page.tsx` – Scope-Filter „Release" im Kopf (Octane-Muster; „Alle" Default)
- `src/lib/release.ts` – reiner Helfer `releaseScope(releaseId, stories)` (n Stories, Σ PT, davon erledigt via `isStoryDone`)
- `src/components/release/ReleaseCard.tsx` – Scope-Zeile ergänzen (zusätzlich zum sprint-basierten Fortschritt)
- `useReleaseStore.removeRelease` – Kaskade: `releaseId` an Stories entkoppeln (Muster `detachTag`)
- `tests/task-062/`

### Technische Anforderungen

- Zuordnung ist optional und einwertig; Release löschen hinterlässt keine dangling `releaseId`.
- Scope-Filter kombiniert sich mit bestehenden Filtern (UND, `FilterBar`-Muster TASK-022).
- Keine zweite Done-/Fortschrittslogik: alles über `isStoryDone`/`storyTaskRollup`.
- Abgrenzung: Burnup-Chart und Velocity-Forecast bewusst **nicht** in diesem Task (Notiz in `docs/future-scope.md`).

### Akzeptanzkriterien

- [x] Story im Dialog und inline einem Release zuordenbar/entfernbar
- [x] Backlog nach Release filterbar; Fußzeilen-Summen folgen dem Scope
- [x] `ReleaseCard` zeigt Scope (n Stories, PT erledigt/geplant) konsistent zur TASK-038-Semantik
- [x] Release löschen entkoppelt Zuordnungen (Confirm/Undo unverändert)
- [x] Gate grün; `tests/task-062/` + `testkonzept.md`

### Erwartetes Ergebnis

„Was ist im Release?" ist erstmals beantwortbar – Grundlage für spätere
Forecast-/Burnup-Ausbauten.

### Umsetzungsnotizen (Abschluss)

- **Zuordnung an zwei Stellen, eine Store-Action:** `StoryDialog` (Release-Select mit „Kein Release" = `undefined`) **und** inline in der Backlog-Zeile (`EditableSelectCell`, ersetzt den `–`-Platzhalter; **`disabled` ohne Releases**). Beide gehen über `updateStory({ releaseId })` (Patch-Typ ließ `releaseId` seit TASK-056 bereits zu). Sentinel `NO_RELEASE = "__none__"`, weil base-ui `Select` einen String-Value braucht (leerer String ist unzulässig).
- **Scope-Filter** im Backlog-Kopf nur, wenn das Projekt Releases hat (sonst nur der Prioritätsfilter). Ein Sentinel `NO_RELEASE` matcht Stories **ohne** `releaseId` („Ohne Release"). Der Filter wirkt auf `filteredStories`, und weil `backlogSummary` genau darüber summiert, **folgt die Fußzeile automatisch dem Scope** – keine separate Scope-Summe.
- **Reiner Helfer `releaseScope`** spiegelt `backlogSummary`/`releaseProgress`: Signatur `(releaseId, stories, tasks, terminalColumns?)`; „erledigt" **ausschließlich** über `isStoryDone` (TASK-038). Zwei Scope-Begriffe bewusst getrennt: **Content-Scope** (release-zugeordnete Stories via `releaseId`, TASK-062) vs. **Sprint-Fortschritt** (Stories in den Release-Sprints, TASK-041). Auf der `ReleaseCard` steht die neue Scope-Zeile **zusätzlich**; die alte „Scope:"-Zeile wurde zu **„Sprints:"** umbenannt (Disambiguierung, Bestandstest angepasst).
- **Kaskade** wie `useTagStore.removeTag → useBoardStore.detachTag`: neue `useBacklogStore.detachRelease(releaseId)` (setzt `releaseId → undefined`, verwirft keine Story), aufgerufen aus `useReleaseStore.removeRelease`. **Kein Import-Zyklus** (`useBacklogStore` importiert nicht `useReleaseStore`). Der Release-Löschen-**Undo** (`releases/page.tsx`) snapshottet/restauriert jetzt zusätzlich die **Backlog-Slice** (sonst käme die Zuordnung nicht zurück).
- **Tests:** `release-scope` (Zählung, Done nur wenn alle Tasks terminal, Custom-Terminal-Spalten), `detach-release` (Action + `removeRelease`-Kaskade, kein dangling), `BacklogTreeRelease` (Inline zuordnen/entfernen/disabled) + Backlog-E2E (Inline-Zuordnung, Scope-Filter, Reload-Persistenz). Bestandstests `task-041` (`scope`-Prop, „Sprints:") und `task-057` (`releases`-Prop) angepasst.
- **Abgeschlossen** die Milestone-Gruppe **„5++++ Backlog als Modul" (056–062)**. Kein Release fällig (v0.6.0 = M6 „erster echter Agent").

---

## TASK-061: Projekt-Detail entschlacken + Risiken als Entitäten

**Abgeschlossen:** 2026-07-06 · **Meilenstein:** 5++++ Backlog als Modul · **Branch:** `feat/task-061-project-detail-risks`

**Meilenstein:** 5++++ Backlog als Modul · **Umfang:** klein–mittel · **Priorität:** P1
**Quelle:** Review 2026-07-02, Abschnitte 3+4 · **Abhängigkeit:** TASK-056, TASK-057 (TASK-060 empfohlen)

### Ziel

Die Projektseite wird zur Projekt-Zentrale (Übersicht · Idee · Entwurf ·
Requirements · Risiken · Verlauf); der Backlog-Tab wird durch einen Verweis auf
den Backlog-Bereich ersetzt. Risiken werden – analog zu Stories – vom
Artefakt-Blob in eine Store-Collection gehoben.

### Kontext

`ProjectDetail.tsx` trug den prominenten „Pipeline ausführen"-Button und einen
vollwertigen Backlog-Tab (Duplikat zum neuen `/backlog`). Risiken waren seit
TASK-045 editierbar, aber via `setRisks`-Patch am Artefakt – ein Regenerieren
ersetzte sie, und ohne Pipeline existierten keine.

### Umsetzung

- **Neuer `useRiskStore`** (`src/store/useRiskStore.ts`, persist `pm-studio-risks` v1):
  `risks: Record<projectId, RiskEntry[]>` + `artifactsMigrated`-Flag. Actions
  `setRisks` (Array ersetzen, **funktioniert ohne Pipeline** – nicht mehr no-op),
  `importRisks` (additiv & idempotent über Risiko-Id, backfillt Status via
  `withRiskStatus`), `removeProjectRisks` (Kaskade), `restore` (Undo),
  `migrateFromArtifacts` (einmalige, verlustfreie Übernahme; Bestand gewinnt über
  Legacy). **Zyklusfrei** wie `useBacklogStore` (TASK-056): importiert **nicht**
  `useProjectStore`, liest Alt-Artefakte in `onRehydrateStorage`/`queueMicrotask`
  **direkt aus `localStorage`** (`pm-studio-projects`).
- **Pipeline** (`runPipelineForIdea`): nach `importBacklog` zusätzlich
  `importRisks(idea.id, result.artifacts.risks.risks)` – Re-Run ergänzt statt zu
  ersetzen; das Artefakt bleibt Snapshot.
- **`useProjectStore`:** `removeIdea`-Kaskade um `useRiskStore.removeProjectRisks`
  erweitert; **`setRisks` entfernt** (Editieren lebt jetzt im Risk-Store). Die
  Artefakt-Status-Migration (v1→v2) bleibt (hält den Snapshot gültig).
- **`ProjectDetail.tsx`:** Backlog-Tab → neue **`BacklogReferenceCard`** (Rollup
  Epics/Stories/Σ PT aus dem Backlog-Store + Deep-Link `/backlog?project=<id>`,
  **keine zweite Backlog-Render-Logik**). Primäraktion **„Planung starten"**
  (Sparkles → `/backlog?project=<id>&plan=1`, öffnet Agent-Panel), **Pipeline-Batch**
  als sekundäre (outline) Aktion. Risiken-Tab liest/schreibt den Risk-Store
  (`RiskTable`-API unverändert), funktioniert ohne Artefakte. Projekt-Löschen
  snapshottet zusätzlich die **Risk-Slice** für Undo. Stepper bleibt reiner
  Statusindikator; Klick auf den **Backlog/Scrum-Schritt** navigiert nach
  `/backlog?project=<id>` statt in einen Tab.
- **`/backlog` page:** liest `?plan=1` einmal beim Mount (`initialPlanFromUrl`) →
  Agent-Panel initial offen.
- **Konsistenz „eine Quelle":** `OverviewTab` „Top-Risiken" und die
  Dashboard-Kachel „Offene Risiken" (`selectMetrics` bekommt neuen `risks`-Param)
  lesen jetzt aus dem Risk-Store, nicht mehr aus dem Artefakt-Snapshot.

### Technische Anforderungen (erfüllt)

- Verweiskarte statt Tab-Duplikat: keine zweite Backlog-Render-Logik im Projekt. ✅
- Risiken ohne Pipeline; „+ Risiko" auf frischem Projekt; Regenerieren ergänzt. ✅
- Einmalige, verlustfreie Risiko-Migration (Muster TASK-056); `removeIdea`-Kaskade
  erweitert. ✅
- `PipelineStepper` als reiner Statusindikator; Backlog-Schritt → `/backlog?project=`. ✅

### Akzeptanzkriterien

- [x] Projektseite ohne eingebetteten Backlog; Verweis mit korrektem Rollup und Deep-Link
- [x] Risiken ohne Pipeline anleg-/pfleg-/löschbar (Confirm/Undo); Bestand migriert; Agentenlauf ersetzt nichts
- [x] „Planung starten" führt in den Backlog-Flow; Batch-Lauf bleibt als Sekundärweg erreichbar
- [x] Gate grün; `tests/task-061/` + `testkonzept.md`; Doku (`architecture.md`, `frontend-plan.md`) aktualisiert

### Tests

`tests/task-061/useRiskStore.test.ts` (setRisks/importRisks/removeProjectRisks/
restore/migrateFromArtifacts, 14) + `tests/task-061/BacklogReferenceCard.test.tsx`
(Rollup projektbezogen, Deep-Link, Null-Rollup, 3) + `testkonzept.md`. Bestandstests
angepasst: `tests/task-009/pipeline-store.test.ts` (Risiken in Store promotet),
`tests/task-011/dashboard-selectors.test.ts` (`selectMetrics`-`risks`-Param),
`tests/task-045/project-store-risks.test.ts` (obsoleter `setRisks`-Block entfernt,
Artefakt-Migration bleibt). Gate grün (610 Tests, Build) + Backlog-E2E (6).

### Entscheidungen / offene Punkte

- **Scope-Entscheidung:** `BacklogView.tsx`/`StoryTasks.tsx` bleiben physisch
  bestehen (weiter durch tests/task-007/008/037/052 abgedeckt), werden aber im
  Projekt-Detail **nicht mehr gerendert** → AC „keine zweite Backlog-Render-Logik"
  erfüllt; physisches Entfernen der ungenutzten Komponenten wäre ein separater
  Refactor-Schritt.
- **Artefakt bleibt Snapshot:** `ProjectArtifacts.risks`/`.backlog` werden von der
  Pipeline weiter geschrieben (Mock-/Pipeline-Tests unberührt), sind aber nicht
  mehr die editierbare Quelle.
- **zustand-Selektor-Falle:** Risiken je Projekt als **stabile** Slice selektieren
  (`state.risks[id]`) und das `?? []` **im Render** halten – ein `?? []` im Selektor
  würde den „getSnapshot should be cached"-Loop auslösen (vgl. TASK-031/043).

---

## TASK-060: Agenten-Panel im Backlog (Mockup) – Chat + Vorschlags-Inbox

**Abgeschlossen:** 2026-07-06 · **Meilenstein:** 5++++ Backlog als Modul · **Branch:** `feat/task-060-agent-panel-backlog`

**Meilenstein:** 5++++ Backlog als Modul · **Umfang:** mittel · **Priorität:** P1
**Quelle:** Review 2026-07-02, Abschnitt 4; Konzept in `docs/agent-system.md` (Konversation, Gates, Provenienz) · **Abhängigkeit:** TASK-056, TASK-057

### Ziel

Das dokumentierte artefakt-zentrierte Interaktionsmodell als **UI-Mockup** in den
Backlog-Bereich bringen: rechte Agenten-Seitenleiste mit Chat-Einstieg und
Vorschlags-Inbox. Der Agent schreibt nie direkt ins Backlog – er macht Vorschläge,
die einzeln übernommen, bearbeitet oder verworfen werden.

### Kontext

Alle Agenten bleiben Mock (deterministisch, `AgentService`-Naht aus TASK-009).
Dieser Task ist die UI-Vorstufe zu TASK-012/013/015 (echtes HITL/Chat in M7) und
ersetzt diese **nicht**; er verlagert den Einstieg von „Pipeline ausführen" hin zu
„geführte Planung im Backlog". Der Batch-Lauf bleibt als Auto-Modus erhalten.

### Betroffene Dateien

- **neu** `src/components/backlog/AgentPanel.tsx` (Sheet), `ProposalCard.tsx`, `AgentChat.tsx`, `ProvenanceBadge.tsx`
- **neu** `src/store/useProposalStore.ts` (persist light: offene Vorschläge + Chat/Phase je Projekt)
- **neu** `src/lib/mock-planning.ts` – deterministische Chat-Rückfrage + Vorschlags-Erzeugung (nutzt die Scrum-Mock-Kette; bewusst getrennt von der `mock-agent-service.ts`-Seam), `src/lib/proposals.ts`, `src/lib/provenance.ts`
- `src/app/(dashboard)/backlog/page.tsx` – Panel-Trigger „Planung mit Agent", `PipelineStepper` als Gate-Indikator im Kopf (Reuse `stepStatusesForPhase`)
- `src/lib/pipeline-steps.ts` – Status `awaiting_review` + `stepStatusesForPhase` (rein additiv, Anzeige)
- `src/components/backlog/BacklogTree.tsx` – Provenance-Badge an Story-Zeilen
- `tests/task-060/`

### Technische Anforderungen (Umsetzung)

- **Chat-Modus:** Nutzer beschreibt Idee/Feedback, Mock-Agent stellt genau eine deterministische Rückfrage; „Entwurf erstellen" setzt den Gate auf `draft_review`. Datenmodell `AgentConversation`/`AgentMessage` aus `docs/agent-system.md` in `src/types` übernommen.
- **Gates:** nach Entwurf und Requirements hält der Stepper auf `awaiting_review`; „Freigeben" startet den nächsten Mock-Schritt (Zustände nur im UI/Store, kein Backend). Guards im Store: jede Phasen-Transition nur aus der Vorgänger-Phase.
- **Vorschlags-Inbox:** der Scrum-Schritt erzeugt Vorschlagskarten (Epics/Stories) statt eines direkten Imports. Aktionen je Karte: **Übernehmen** (→ Backlog-Store, `provenance: "agent"`), **Bearbeiten** (öffnet TASK-058-Dialog vorbefüllt, Übernahme mit `provenance: "human_edited"`), **Verwerfen**. „Alle übernehmen" als Sammelaktion.
- Provenance-Badge an Backlog-Zeilen (klein, `<StatusBadge>`-Quelle).
- Auto-Modus: „Automatisch durchlaufen" erzeugt alle Vorschläge auf einmal, Ergebnis geht ebenfalls durch die Inbox (mit „Alle übernehmen" vorausgewählt).

### Akzeptanzkriterien

- [x] Agent-Panel im Backlog öffenbar; Chat-Einstieg erzeugt Entwurf erst nach expliziter Bestätigung
- [x] Stepper zeigt Gate-Zustände; ohne Freigabe läuft kein Folgeschritt
- [x] Vorschläge landen in einer Inbox und erst nach Übernehmen/Bearbeiten im Backlog; Verwerfen hinterlässt nichts
- [x] Übernommene Items tragen sichtbare Provenienz (agent / human_edited)
- [x] Kein Mock-Pfad **des Panels** schreibt ungefragt ins Backlog (Scope-Entscheidung: Legacy-`runPipelineForIdea` bleibt Direkt-Import)
- [x] Gate grün; `tests/task-060/` (Inbox-Flows, Gate-Logik, Provenienz) + `testkonzept.md`

### Erwartetes Ergebnis

Das Agenten-Erlebnis ist als klickbares Mockup erlebbar und definiert die UI, an
die in M6/M7 nur noch der echte `AgentService` angeschlossen wird.

### Umsetzungsnotizen

- **Scope „Nur Agent-Panel" (Nutzer-Entscheidung):** `runPipelineForIdea` (ProjectDetail „Pipeline ausführen") bleibt unverändert und importiert weiter direkt; das AC „kein Mock-Pfad schreibt ungefragt" gilt für das neue Panel. Hält CLAUDE.md-Scope + Bestandstest `tests/task-009/pipeline-store.test.ts`.
- **Architektur-Seam:** Mock-Content-Funktionen in `lib/mock-planning.ts`, nicht in `mock-agent-service.ts` – der Guard `tests/task-009/architecture.test.ts` (nur `agent-service.ts` darf die Mock-Impl importieren) bleibt grün. Der Leaf-`useProposalStore` importiert keine anderen Stores; die Proposal→Backlog-Übernahme orchestriert das `AgentPanel` (Ränge aus aktuellem Backlog-Zustand, Muster TASK-043).
- **Bearbeiten = übernehmen + editieren:** Karte wird als `human_edited` in den Store geschrieben und dann im `StoryDialog` geöffnet; Abbrechen lässt sie als `human_edited` (Kuratierung durch den Menschen ist bereits erfolgt).
- **Draft/Requirements** werden nicht persistiert; die Vorschläge werden bei der Scrum-Freigabe deterministisch aus der Idee neu erzeugt (`draft → requirements → scrum`).

## TASK-066: UI-Sprache konsequent vereinheitlichen (Deutsch)

**Abgeschlossen:** 2026-07-03 · **Meilenstein:** UI-Backlog · **Branch:** `feat/task-066-ui-language-de`

**Meilenstein:** UI-Backlog · **Umfang:** klein · **Priorität:** P2
**Quelle:** NFR aus `docs/product-requirements.md`; Audit-Detail „Navigation mischt Englisch/Deutsch" · **Abhängigkeit:** keine (sinnvoll NACH TASK-057/059, um Neubau nicht doppelt anzufassen)

### Ziel

Alle UI-Texte auf **Deutsch** vereinheitlichen (Ist-Mehrheit der Oberfläche;
Abweichung von der PRD-Empfehlung „UI englisch" wird dokumentiert). Doku bleibt
deutsch, Code/Commits englisch.

### Betroffene Dateien

- `src/lib/navigation.ts` – Gruppen/Labels (Overview→Übersicht, Projects→Projekte, Delivery→Delivery bleibt als Eigenname ODER „Umsetzung" – Entscheidung im PR begründen), „New Idea"→„Neue Idee" usw.
- Sichtbare Strings in Seiten/Komponenten (grep nach engl. UI-Labels; Fachbegriffe wie „Backlog", „Sprint", „Release", „Board" bleiben unübersetzt)
- `docs/product-requirements.md` – NFR-Zeile aktualisieren (Entscheidung festhalten)
- E2E-/Unit-Tests, die auf Labels matchen, anpassen
- `tests/task-066/` (Smoke: Navigation rendert erwartete Labels)

### Technische Anforderungen

- Keine i18n-Bibliothek (Overengineering für Single-User lokal) – zentrale Label-Konstanten dort, wo bereits Quellen existieren (`navigation.ts`, Status-Maps).
- Etablierte Scrum-Anglizismen bewusst behalten (Glossar-Absatz in `docs/design-system.md` oder `frontend-plan.md`).

### Akzeptanzkriterien

- [x] Navigation, Seitenköpfe, Buttons, Empty-States durchgängig deutsch (Fachbegriffe ausgenommen)
- [x] Entscheidung inkl. Begründung in der PRD dokumentiert
- [x] Alle Tests/E2E an neue Labels angepasst; Gate grün
- [x] `tests/task-066/` + `testkonzept.md`

### Erwartetes Ergebnis

Konsistente Sprache = professionellerer Portfolio-Eindruck und erfüllte eigene NFR.

### Umsetzungsnotiz (Abschluss)

Die Oberfläche war bereits mehrheitlich deutsch; verbliebene englische Chrome-Strings
übersetzt. **Navigation** (`navigation.ts`, einzige Quelle für Sidebar + CommandBar):
`Overview→Übersicht`, `Projects→Projekte`, `Agents→Agenten`, `Delivery→Umsetzung`
(Gruppe „System" bleibt, ist im Deutschen gleich), Items `Projects→Projekte`,
`New Idea→Neue Idee`, `Agents→Agenten`. **Weitere generische Labels:**
`Assignee→Zuständig` (`SWIMLANE_MODES` + `BoardListView`-Spalte & aria-label),
`Owner→Verantwortlich` (`RiskTable`/`RiskDialog`), sr-only `Close→Schließen`
(`ui/dialog.tsx`/`ui/sheet.tsx`).

**Entscheidung „Delivery → Umsetzung":** Gruppen-Label ist ein generisches
Sektionswort (kein Produkt-Fachbegriff) und wird übersetzt; die *Produkt-Nomen*
darunter (Backlog, Board, Sprints, Ceremonies, Releases) bleiben als etablierte
Scrum-/Kanban-Anglizismen englisch. Ebenso bleiben Workflow/Dashboard/Team
(Lehnwörter) und Velocity/Review/Retro (Scrum-Kennzahl/Zeremonien). Glossar dazu
in `docs/design-system.md`, Begründung der Sprachwahl in
`docs/product-requirements.md` (NFR von „UI englisch" auf „durchgängig deutsch"
geändert).

**Keine i18n-Bibliothek** – Label-Konstanten bleiben in den bestehenden Quellen.
Keine neue Dependency, keine Persist-Migration. Tests
`tests/task-066/navigation-language.test.ts` (5, Datenquelle `navGroups`/`navItems`
statt Komponenten-Render, da kein next/navigation-Mock existiert) + `testkonzept.md`;
Bestandstests an die neuen Labels angepasst statt gelöscht
(`tests/task-036/SwimlaneSelect.test.tsx`, `e2e/board.spec.ts` Swimlane-Radio).
Gate grün (567 Tests, Build) + Board-E2E (11).

---

## TASK-059: Sprint-Planung v2 – vertikales Layout mit klickbaren Items

**Abgeschlossen:** 2026-07-03 · **Meilenstein:** 5++++ Backlog als Modul · **Branch:** `feat/task-059-sprint-planning-v2`

**Meilenstein:** 5++++ Backlog als Modul · **Umfang:** mittel–groß · **Priorität:** P1
**Quelle:** Review 2026-07-02, Abschnitt 5; Kritik aus `docs/ui-backlog.md` (Spalten-Layout) · **Abhängigkeit:** TASK-058

### Ziel

Die Sprint-Übersicht `/sprints` vom horizontalen Spalten-Layout auf das
Industriestandard-Planungslayout umstellen (Jira-Backlog-/Azure-Sprints-Muster):
vertikal gestapelte Sprint-Sektionen + Backlog-Sektion, Items per Drag zwischen
Sektionen, jede Story klickbar (TASK-058-Dialog).

### Kontext

Das Nebeneinander aller Sprints wurde als unpassend markiert; es skaliert nicht
mit vielen Sprints. Die Sprint-Detailseite (TASK-053) bleibt unverändert bestehen.
Kapazitäts-/Fortschrittsanzeigen (`sprintWorkload`, `sprintProgress`,
`ProgressBar`) sind Stärken und wandern ins neue Layout mit.

### Betroffene Dateien

- `src/app/(dashboard)/sprints/page.tsx` – Layout-Umbau (D&D-Logik/Filter bleiben)
- **neu** `src/components/sprint/SprintSection.tsx` (ersetzt `SprintColumn` in der Übersicht; `SprintColumn` kann entfallen, sofern nirgends sonst genutzt)
- `src/components/sprint/SprintStoryCard.tsx` – Zeilen-Variante (kompakt, Handle + Klick aus TASK-058)
- `src/lib/capacity.ts` – unverändert; **neu** Commitment-Warnung als reiner Helfer (`plannedPt` vs. Σ Team-Kapazität)
- `tests/task-059/`, `e2e/sprints.spec.ts` anpassen

### Technische Anforderungen

- **Sektionen:** je Sprint ein auf-/zuklappbarer Abschnitt (Kopf: Name, Status/Aktiv-Badge, Zeitraum, Ziel, Fortschrittsbalken, PT-Summe, Öffnen-Link `/sprints/[id]`, Edit-/Review-Aktionen wie bisher); unten die Sektion „Backlog / Nicht zugeordnet" (Rank-Reihenfolge aus TASK-057).
- **D&D:** vertikal zwischen Sektionen (`assignStory`), innerhalb der Backlog-Sektion = Rank; bestehende Sensorik/`data`-Muster wiederverwenden.
- **Commitment-Hinweis:** überschreiten geplante PT die Summe der Personen-Kapazitäten des Teams, zeigt der Sektionskopf einen Warn-Badge (`<StatusBadge>`, keine Ad-hoc-Farben).
- Filter (`FilterBar`) und Projekt-Scope wie bisher; `.thin-scrollbar`-Thema entfällt mit dem Layout.
- Auslastung je Person bleibt je Sprint-Sektion sichtbar (einklappbar).

### Akzeptanzkriterien

- [x] Sprints + Backlog vertikal; Stories per Drag zwischen Backlog und Sprints verschiebbar
- [x] Jede Story per Klick im Dialog editierbar; Drag weiterhin per Handle/Tastatur
- [x] Fortschritt, Zeitraum, Aktiv-Status, Auslastung und Review/Retro-Einstieg wie zuvor verfügbar
- [x] Commitment-Warnung erscheint bei Überplanung, verschwindet bei Entlastung
- [x] Gate grün; `tests/task-059/` + angepasste Sprint-E2E + `testkonzept.md`

### Erwartetes Ergebnis

Eine Sprint-Planung, die sich wie Jira/Azure anfühlt, mit vielen Sprints skaliert
und deren Items vollwertig bearbeitbar sind.

### Umsetzungsnotizen (Abschluss)

- **Layout:** `sprints/page.tsx` rendert die Sektionen jetzt in einem vertikalen `flex-col` statt im horizontalen `overflow-x-auto`; das `columns`-Memo ordnet die Sprints zuerst und die „Backlog / Nicht zugeordnet"-Sektion zuletzt. `SprintColumn.tsx` wurde entfernt (nur hier genutzt), ebenso die `.thin-scrollbar`-Utility aus `globals.css`.
- **`SprintSection`** kapselt Kopf (Collapse-Toggle, Badges inkl. Commitment-Warnung, Detail-/Review-/Edit-Aktionen), die droppable Story-Zeilenliste (`SortableContext`) und einen eigen-einklappbaren Auslastungs-Block. Fortschritt/Done kommen ausschließlich aus `sprintProgress`/`isStoryDone` (TASK-038).
- **`sprintCommitment(plannedPt, persons)`** (rein, in `capacity.ts`): summiert die Kapazität der übergebenen Personen (heute der ganze Roster = „Team") und meldet `overcommitted`, wenn `plannedPt` sie übersteigt; ohne Kapazität wird **nie** gewarnt (leerer Roster flaggt nicht jeden Sprint).
- **Story-Zeile:** `SprintStoryCard variant="row"` – einzeilig; Griff trägt die dnd-Listener, Zeilenklick öffnet den `StoryDialog` (TASK-058).
- **Test-Isolationsfalle:** ein `userEvent.click` auf den dnd-Griff startet in jsdom einen echten dnd-kit-Drag (Default-Sensor aktiviert auf `pointerdown`); dessen Reststate stört den unmittelbar folgenden Test. Griff-Klicks in Unit-Tests deshalb via `fireEvent.click` (reines Click-Event, kein Drag).
- **Nebenbefund (out of scope):** `e2e/my-work.spec.ts` scheitert weiter am veralteten Projekt-Seed (Version 1 ohne `risks` ⇒ v1→v2-Risk-Migration crasht); CI führt kein E2E aus.

---

## TASK-058: Story-Dialog / Item-Detail (eine Komponente für überall)

**Abgeschlossen:** 2026-07-03 · **Meilenstein:** 5++++ Backlog als Modul · **Branch:** `feat/task-058-story-dialog`
**Umfang:** mittel · **Priorität:** P1 · **Quelle:** Review 2026-07-02, Abschnitt 3+5; `docs/ui-backlog.md` Vorschlag „D"; Audit-Lücke „AKs als prüfbare Items" · **Abhängigkeit:** TASK-056 (TASK-057 empfohlen)

### Ziel

Ein wiederverwendbarer `StoryDialog` (Muster `TaskDialog`), der eine User Story
überall öffnet und bearbeitet: Backlog, Sprint-Planung, Sprint-Detail. Damit wird
der Wunsch „in der Sprintansicht auf Items drücken und bearbeiten" einlösbar.

### Kontext

Es existierte kein Story-Edit-Pfad; `SprintStoryCard` war reine Drag-Fläche
(dnd-kit-`listeners` über der ganzen Karte). Akzeptanzkriterien waren `string[]`
(read-only Aufzählung in `BacklogView`).

### Umsetzung

- **Typen (`src/types/index.ts`):** neuer `AcceptanceCriterion { id, text, done }`;
  `UserStory.acceptance_criteria` von `string[]` auf `AcceptanceCriterion[]` gehoben.
  Das Agenten-Artefakt `BacklogStory` bleibt bewusst bei `string[]` (Run-Snapshot).
  `ActivityEntityType` additiv um `"story"` erweitert.
- **Reine Transforms `src/lib/acceptance.ts`** (Spiegel von `checklist.ts`, aber
  Story-Ebene + Pflichtfeld ⇒ `normalizeAcceptance` gibt **immer** ein Array):
  `acceptanceProgress`/`acceptanceComplete`, `add`/`toggle`/`rename`(ohne Trim)/`remove`,
  `normalizeAcceptance`, `criteriaFromStrings` (Strings→offene Kriterien, injizierbare Id).
- **`flattenBacklog`** mappt Artefakt-Strings über `criteriaFromStrings`; **Persist-
  Migration v1→v2** im Backlog-Store (exportiert als `migrateBacklogPersistedState`)
  hebt persistierte String-AKs verlustfrei auf abhakbare Kriterien.
- **Store (`useBacklogStore`):** neue Action `moveStoryToEpic` (setzt `epicId`, rankt
  ans Ende des Ziel-Epics, hebt `agent`→`human_edited`; No-op bei gleichem/unbekanntem
  Epic). **Activity-Logging** (`logActivity`, Leaf-Store außerhalb `set`): create/update/
  delete + `move`; **`reorderStory` loggt bewusst nicht** (Granularität TASK-043).
- **Neu `src/components/backlog/StoryDialog.tsx`** (self-contained, Muster `TaskDialog`):
  Titel/Beschreibung/Epic(Select, verschieben)/Priorität/PT + Akzeptanzkriterien als
  abhakbare Liste (transaktional über Save-Patch), Aufgaben-Sektion via `StoryTasks`
  (TASK-037), Verlauf via `ActivityFeedPanel entityType="story"`, Löschen via
  `useConfirmDelete` (Backlog- + Board-Slice-Snapshot, TASK-040/056).
- **Andockpunkte:** Backlog-Zeile (`BacklogTree` `StoryRow`: Klick auf die Zeile öffnet;
  Inline-Zellen/Griff/Löschen stoppen `stopPropagation`), Sprint-Planung
  (`SprintStoryCard` bekommt **Grip-Handle** – Klick auf den Kartenkörper öffnet den
  Dialog, Ziehen nur am Griff; Keyboard-D&D bleibt am Griff), Sprint-Detail
  (`SprintDetail` Story-Kopf als Button). `BacklogView` rendert AKs jetzt als
  `criterion.text` (durchgestrichen bei `done`).

### Akzeptanzkriterien

- [x] Story aus Backlog, Sprint-Übersicht und Sprint-Detail per Klick öffnen und bearbeiten
- [x] Akzeptanzkriterien einzeln abhakbar; Bestand (Strings) verlustfrei migriert
- [x] Story zwischen Epics verschiebbar; D&D in der Sprint-Planung funktioniert weiterhin (Handle)
- [x] Story-Änderungen erscheinen im Verlauf (Activity, Granularität wie TASK-043)
- [x] Gate grün; `tests/task-058/` (AC-Transforms, Store/Migration/Move/Logging, Dialog-CRUD, Karten-Klick vs. Drag) + `testkonzept.md`

### Ergebnis

Ein Dialog als einzige Story-Bearbeitungsquelle – identisches Bedienmuster wie beim
`TaskDialog`, überall verlinkbar. Keine neue Dependency.

---

## TASK-057: Backlog-Bereich `/backlog` unter Delivery

**Abgeschlossen:** 2026-07-03 · **Meilenstein:** 5++++ Backlog als Modul · **Branch:** `feat/task-057-backlog-area`
**Umfang:** groß · **Priorität:** P1 · **Quelle:** Review 2026-07-02, Abschnitt 3; Octane-Muster aus `docs/ui-backlog.md` · **Abhängigkeit:** TASK-056

### Ziel

Ein eigenständiger Backlog-Arbeitsbereich als erster Eintrag der Delivery-Gruppe:
Projekt auswählen, alle Items (Epic → Story → Aufgaben) sehen, anlegen, inline
bearbeiten, per Drag priorisieren (Rank) – mit Aggregat-Fußzeile im Octane-Stil.

### Kontext

Heute ist das Backlog vier Ebenen tief im Projekt-Tab versteckt und existiert nur
nach Pipeline-Lauf (Befund `docs/ui-backlog.md` 2026-06-17; TASK-052 hat nur
Symptome gelindert). Octane-Referenzmuster wurden dort bereits analysiert:
Scope-Filter oben, Hierarchie, konfigurierbare Tabelle, Rank, Aggregat-Fußzeile.
Dieser Task setzt die als „Übernehmen" markierten Muster um und ersetzt den
Vorschlag „A" aus `docs/ui-backlog.md` für den Backlog-Kontext.

### Betroffene Dateien

- `src/lib/navigation.ts` – Delivery: `Backlog` (`/backlog`) an erster Position
- **neu** `src/app/(dashboard)/backlog/page.tsx`
- **neu** `src/components/backlog/BacklogTree.tsx` (Epic-Sektionen + Story-Zeilen), `EpicHeader.tsx`, `BacklogFooter.tsx`
- Reuse: `EditableTextCell`/`EditableSelectCell` (`src/components/board/cells/`), `FilterBar`, `useConfirmDelete`, dnd-kit-Muster aus `sprints/page.tsx`
- `src/components/layout/CommandBar.tsx` – Create-Aktion „Neue Story" (Intent via `useCommandActionStore`, Muster TASK-042)
- `src/lib/backlog.ts` – Selektoren/Summen erweitern
- `tests/task-057/`, `e2e/backlog.spec.ts`

### Technische Anforderungen

- **Scope-Kopf:** Projekt-Select (Muster `sprints/page.tsx`); Filter (Priorität, Tag, Freitext) über `FilterBar`; Deep-Link `?project=<id>` wird ausgelesen (für TASK-061).
- **Hierarchie:** Epics als Sektionen (auf-/zuklappbar, alle offen als Default – Lehre aus TASK-052), Stories als Zeilen mit Spalten: Rank-Handle, Titel (inline), Priorität (Select), PT (inline), Aufgaben-Rollup (`storyTaskRollup`), Release (ab TASK-062). Zeilenklick öffnet den Story-Dialog (TASK-058; bis dahin Platzhalter/Inline).
- **CRUD:** „+ Epic" im Kopf, „+ Story" je Epic-Sektion (Inline-Feld, Muster `QuickAddTask`), Löschen über `useConfirmDelete` mit Undo (Restore-Slice aus TASK-056).
- **Rank:** vertikales D&D je Epic (dnd-kit, `activationConstraint` wie Board); Reihenfolge persistiert (`reorderStory`).
- **Aggregat-Fußzeile:** Anzahl Stories, Σ geplant PT, Σ erledigt PT (über `storyTaskRollup`/`isStoryDone` – keine zweite Done-Logik, TASK-038).
- **Empty-States:** kein Projekt → CTA „Erste Idee anlegen"; Projekt ohne Items → zwei CTAs „Story manuell anlegen" und „Planung mit Agent starten" (Letzteres bis TASK-060 = Pipeline-Lauf).

### Akzeptanzkriterien

- [x] `/backlog` in der Delivery-Navigation (erste Position) und per ⌘K erreichbar
- [x] Projekt wählbar; Epics/Stories vollständig sichtbar, anlegbar, inline editierbar, löschbar (Confirm/Undo)
- [x] Stories per Drag innerhalb eines Epics priorisierbar; Reihenfolge überlebt Reload
- [x] Aggregat-Fußzeile zeigt Anzahl + PT geplant/erledigt konsistent zur TASK-038-Semantik
- [x] CommandBar-Aktion „Neue Story" springt ins Backlog und öffnet das Anlage-Feld
- [x] Backlog funktioniert für ein Projekt ohne jeglichen Pipeline-Lauf
- [x] Gate grün; `tests/task-057/` + `e2e/backlog.spec.ts` + `testkonzept.md`

### Umsetzungsnotizen (Abschluss)

- **Route & Nav:** `Backlog` (Icon `ListTree`) als erster Delivery-Eintrag in `navigation.ts` (Sidebar + ⌘K teilen die Quelle). Page hinter `useHydrated`-Gate (localStorage-abhängig), Projekt-Select wie `sprints`/`releases`.
- **Deep-Link:** `?project=<id>` wird beim Mount aus `window.location.search` gelesen (`initialProjectFromUrl`), SSR-sicher, weil die Ausgabe bis zum Hydration-Gate „Lädt …" ist – kein `useSearchParams`/Suspense nötig.
- **Komponenten:** `BacklogTree` (DnD + Accordion, alle Epics offen), `EpicHeader` (Toggle als **eigener** kleiner `AccordionTrigger`, damit inline-Titel + Löschen **Geschwister** sind – keine verschachtelten Buttons), `BacklogFooter` (Aggregat). Story-Zeile: Griff (`GripVertical`, nur der Griff trägt die dnd-Listener ⇒ Zellen bleiben klickbar), Titel/PT via `EditableTextCell`, Priorität via `EditableSelectCell` (`StatusBadge`-Nodes), Rollup `doneTasks/total`, Release-Platzhalter „–" (TASK-062).
- **Rank:** ein `DndContext` mit einem `SortableContext` je Epic; `handleDragEnd` ignoriert Drags über Epic-Grenzen (Map `storyId→epicId`), sonst `reorderStory(epicId, storyId, targetIndex)`.
- **CRUD/Undo:** kontrollierte `InlineAdd` (aus `BacklogTree` exportiert) für „+ Epic"/„+ Story"; Enter fügt hinzu und hält das Feld offen. Löschen über `useConfirmDelete`; der Undo-Snapshot umfasst **Backlog- und Board-Slice** (`useBacklogStore.restore` + `useBoardStore.restore`), weil ein Story-/Epic-Delete Board-Tasks detacht – so kehrt Undo beides zurück.
- **Aggregat:** neuer reiner Helfer `backlogSummary(stories, tasks, columns?)` in `src/lib/backlog.ts` – `plannedPt` summiert alle Story-PT, `donePt` nur erledigte Stories (Done via `storyTaskRollup`/`isStoryDone`, TASK-038).
- **CommandBar:** neue Intent-Variante `new-story` + Aktion „Neue Story anlegen" → `/backlog`; die Page öffnet das Add-Feld des ersten Epics **deklarativ** (`addStoryEpicId ?? (wantNewStory ? firstEpic : null)`, Schließen räumt den Intent ab – Muster TASK-042, kein setState-in-Effect).
- **Bewusst weggelassen:** **Tag-Filter** (Stories haben kein Tag-Feld; Tags leben auf Board-Aufgaben, TASK-031) → umgesetzt sind Prioritäts- + Freitext-Filter. **Row-Click-Story-Dialog** kommt mit TASK-058; bis dahin decken die Inline-Zellen Titel/Priorität/PT ab.
- **Empty-States:** kein Projekt → `EmptyCard` „Erste Idee anlegen"; Projekt ohne Items → „Story manuell anlegen" (legt Default-Epic „Neues Epic" an + öffnet dessen Feld) + deaktiviertes „Planung mit Agent starten" (bis TASK-060). Bei aktiven Filtern ohne Treffer eigener Reset-Hinweis.
- **Tests:** `tests/task-057/backlog-summary.test.ts` (3) + `BacklogTree.test.tsx` (7) + `e2e/backlog.spec.ts` (4, Store direkt geseedet ⇒ Beweis „ohne Pipeline"). Gate grün (541 Tests, Build) + E2E (backlog 4, board 11, sprints 3, ceremonies 3). Keine neue Dependency, keine Persist-Migration.

---

## TASK-056: Backlog-Entities – Epic & Story als Store-Entitäten

**Abgeschlossen:** 2026-07-02 · **Meilenstein:** 5++++ Backlog als Modul · **Branch:** `feat/task-056-backlog-entities`
**Umfang:** groß · **Priorität:** P0 (Fundament) · **Quelle:** Review 2026-07-02 (`docs/review-backlog-und-pm-konzept.md`, Abschnitt 3) · **Abhängigkeit:** keine
**Reihenfolge:** MUSS vor TASK-057–062 laufen – jede Backlog-UI vor diesem Task wäre Wegwerfarbeit.

### Ziel

Epics und User Stories aus dem Artefakt-Blob (`ProjectArtifacts.backlog`) in einen
eigenen, persistierten Store promoten, sodass Backlog-Items **ohne Pipeline**
existieren, manuell angelegt/bearbeitet/gelöscht werden können und ein erneuter
Agentenlauf den Bestand **nicht mehr ersetzt**.

### Kontext

Heute sind Epics/Stories Felder im `Backlog`-Artefakt (`src/types/index.ts`), es
gibt keinerlei CRUD-Pfad, und `setArtifacts` entkoppelt beim Regenerieren alle
Story-Tasks (`detachStory`-Kaskade in `useProjectStore.ts:19-24`). Zielmodell laut
Review: Backlog-Store als Quelle der Wahrheit, Agenten-Output wird künftig
**importiert** statt geschrieben. `ProjectArtifacts.backlog` bleibt als
Agenten-Artefakt (Snapshot des Laufs) erhalten – die UI liest ihn aber nicht mehr.

### Betroffene Dateien

- `src/types/index.ts` – `Epic`/`UserStory` erweitern (siehe unten), bestehende Felder bleiben kompatibel
- **neu** `src/store/useBacklogStore.ts` – persist `pm-studio-backlog` (v1)
- **neu** `src/lib/backlog.ts` – reine Helfer (`storiesForProject`, `storiesForEpic`, `epicRollup`, Rank-Reorder)
- `src/store/useProjectStore.ts` – `removeIdea`-Kaskade auf Backlog-Store umleiten; `setArtifacts` entkoppelt **nicht mehr**
- `src/lib/agent-service.ts` / `src/lib/mock-agent-service.ts` – unverändert erzeugen, aber neuer Import-Pfad `importBacklog`
- Konsumenten auf Store-Selektoren umstellen: `app/(dashboard)/sprints/page.tsx`, `sprints/[id]` (`SprintDetail`), `releases/page.tsx`, `ceremonies/page.tsx`, `src/lib/dashboard-selectors.ts` (`selectVelocity`, `selectMetrics`), `src/lib/search.ts`, `src/components/project/BacklogView.tsx`
- `tests/task-056/`

### Technische Anforderungen

- **Typen (additiv, kompatibel):**
  - `Epic { id, projectId, title, description?, rank }` – Stories nicht mehr genestet
  - `UserStory` + `epicId`, `projectId`, `description?`, `rank`, `releaseId?`, `sourceRequirementIds?`, `provenance: "agent" | "human" | "human_edited"`
  - Bestehende Felder (`id`, `title`, `acceptance_criteria`, `estimate_pt`, `priority`) bleiben unverändert → `storyId`-Referenzen in Board/Sprint-Store bleiben gültig, **keine** Migration dort nötig.
- **Store-Actions:** `addEpic`, `updateEpic`, `removeEpic` (Kaskade: Stories löschen → `detachStory` je Story), `addStory`, `updateStory`, `removeStory` (→ `detachStory`), `reorderStory`/`reorderEpic` (Rank), `restore(slice)` (Confirm/Undo-Muster TASK-040), `importBacklog(projectId, backlog, provenance)` – fügt hinzu, ersetzt nie; Duplikate über Artefakt-Story-Id idempotent.
- **Einmalige Migration:** beim ersten Hydrate vorhandene `artifacts[*].backlog`-Daten in den Store übernehmen (`provenance: "agent"`, Rank = bisherige Reihenfolge); Flag im Persist-State, damit der Import nur einmal läuft.
- **Kaskaden:** Projekt löschen → Epics/Stories des Projekts löschen (+ bestehende Task-Entkopplung). Kein Konsument liest Stories mehr aus `artifacts` (grep-Beweis im PR).
- `runPipelineForIdea` ruft nach dem Scrum-Schritt `importBacklog` auf (Verhalten für den Nutzer zunächst unverändert; die Vorschlags-Inbox kommt in TASK-060).
- Sprint-Vorschläge (`backlog.sprint_suggestions`) bleiben vorerst am Artefakt (Import unverändert über `importSuggestions`).

### Akzeptanzkriterien

- [x] Story/Epic ohne Pipeline anlegbar (Store-API `addEpic`/`addStory`; UI folgt in TASK-057)
- [x] Erneuter Pipeline-Lauf ersetzt bestehende Stories nicht und entkoppelt keine Tasks mehr (`importBacklog` additiv/idempotent, `setArtifacts` ohne Detach)
- [x] Bestehende Nutzerdaten werden einmalig verlustfrei migriert (Sprint-Zuordnungen und Board-`storyId`s funktionieren danach unverändert; E2E bestätigt)
- [x] Epic/Story löschen räumt Referenzen auf (keine dangling `storyId`s), mit Confirm/Undo (Projekt-Delete-Undo stellt Backlog-Slice mit her)
- [x] Alle bisherigen Konsumenten lesen aus dem neuen Store; Gate grün
- [x] `tests/task-056/` (Store-CRUD, Kaskaden, Idempotenz von `importBacklog`, Migration) + `testkonzept.md`

### Umsetzungsnotizen (Abweichungen/Entscheidungen)

- **Zwei Typ-Familien statt einer:** Der Agenten-Output bleibt der **nested** Snapshot (`BacklogEpic`/`BacklogStory`, `mock-templates` unverändert im Inhalt), die Store-Entitäten sind **flach** (`Epic`/`UserStory` mit `epicId`/`rank`). `flattenBacklog` überführt Snapshot→Store und erhält Story-Ids 1:1.
- **Migration ohne Import-Zyklus:** `useBacklogStore` importiert **nicht** `useProjectStore` (das importiert seinerseits den Backlog-Store für die `removeIdea`-Kaskade). Die einmalige Übernahme liest die persistierten Artefakte **direkt aus `localStorage`** (`pm-studio-projects`) in einem `queueMicrotask` in `onRehydrateStorage` – so ist sie zyklusfrei und unabhängig von der Hydrationsreihenfolge. `migrateFromArtifacts(map)` selbst ist rein/testbar; das Flag `artifactsMigrated` verhindert Doppelimport.
- **`importBacklog` idempotent:** fügt nur Ids hinzu, die noch nicht existieren – überschreibt (ggf. editierte) Bestandsitems nie; neue Epics werden hinter die bestehenden gerankt.
- **`updateStory` markiert Herkunft:** eine editierte `agent`-Story wird zu `human_edited` (expliziter `provenance` im Patch gewinnt) – Grundlage für die Vorschlags-Inbox (TASK-060).
- **`setArtifacts` nur noch Snapshot:** kein Detach mehr beim Re-Run; `runPipelineForIdea` ruft zusätzlich `importBacklog(idea.id, artifacts.backlog, "agent")`.
- **Konsumenten:** `BacklogView` bekommt `sprintSuggestions`-Prop (Rest aus Store), `OverviewTab` bekommt `projectId`, `selectMetrics`/`selectVelocity` bekommen `stories`, `SearchSources.artifacts`→`stories`. `sprints/page` gated jetzt auf `stories.length === 0` statt `!activeArtifacts`.
- **Kein Activity-Log** für Backlog-Änderungen (`ActivityEntityType` kennt kein epic/story; Granularität gegen Rauschen wie TASK-043/045).

### Erwartetes Ergebnis

Backlog-Items sind echte Entitäten mit eigenem Lebenszyklus. Die Pipeline ist nur
noch *ein* Erzeugungsweg – Grundlage für den Backlog-Bereich (TASK-057), den
Story-Dialog (TASK-058) und das Agenten-Panel (TASK-060).

---

## TASK-055: Ceremonies-Bereich v2 (verlinkte Items + Kommentare)

**Abgeschlossen:** 2026-07-02 · **Meilenstein:** UI-Backlog · **Branch:** `feat/task-055-ceremonies-area-v2`
**Umfang:** mittel · **Priorität:** P2 · **Quelle:** `docs/ui-backlog.md` (Wunsch F) · **Abhängigkeit:** TASK-054

### Ziel
Den Ceremonies-Bereich (TASK-054) um **verlinkte Backlog-Items** des Sprints und
**Kommentare** erweitern, sodass Review/Retro inhaltlich an konkrete Items andocken
und diskutierbar werden.

### Kontext
Baut direkt auf TASK-054 auf (eigenständiger Ceremonies-Bereich, Historie, Scope).
TASK-054 hat Review/Retro auf mehrere, historische Einträge mit `id`/`createdAt`
umgestellt – hier kommen Relationen und Kommentare dazu.

### Betroffene Dateien
- `src/types/index.ts` (`linkedStoryIds?`, `linkedTaskIds?`, `comments?` an Review/Retro)
- `src/store/useSprintStore.ts` (Relationen + Kommentare, additive Migration)
- `src/components/sprint/` bzw. Ceremonies-Komponenten (Item-Picker, Kommentar-Liste)
- ggf. Wiederverwendung eines allgemeinen Kommentar-Bausteins (falls bis dahin vorhanden)
- `tests/task-055/`

### Technische Anforderungen
- **Verlinkte Items:** Stories/Tasks des betroffenen Sprints auswählbar an
  Review/Retro anhängen (`linkedStoryIds`/`linkedTaskIds`); Klick navigiert zum Item.
- **Kommentare:** `comments: { id, author, text, createdAt }[]` an Review/Retro;
  hinzufügen/entfernen.
- Persist-Migration **additiv** (Felder optional; v54-Bestand bleibt gültig).
- Empty-/Loading-States; verwaiste Links robust behandeln (gelöschtes Item).

### Akzeptanzkriterien
- [x] Backlog-Items des Sprints an Review/Retro verlinkbar; Link navigiert zum Item
- [x] Kommentare an Review/Retro hinzufügbar/entfernbar, chronologisch
- [x] Gelöschte verlinkte Items brechen die Ansicht nicht (robustes Rendering)
- [x] Additive Persist-Migration; TASK-054-Bestand bleibt gültig
- [x] Lint/Typecheck/Test/Build grün
- [x] `tests/task-055/` mit `testkonzept.md`

### Erwartetes Ergebnis
Reviews/Retros sind nicht nur Freitext, sondern an konkrete Arbeit gekoppelt und
diskutierbar – ein „agileres", kollaboratives Ceremonies-Erlebnis.

### Umsetzung (Ist-Stand)
- **Datenmodell:** neuer Typ `CeremonyComment { id, author, text, createdAt }`;
  `CeremonyMeta` (geteilt von Review **und** Retro) additiv um `linkedStoryIds?`,
  `linkedTaskIds?`, `comments?` erweitert. Alle Felder optional ⇒ **keine
  Version-Erhöhung** des Persist-Stores nötig (v2 bleibt gültig; additive Migration).
- **Reine Helfer** in `src/lib/ceremonies.ts`: `toggleLink` (Membership-Toggle),
  `resolveLinks` (Ids → `{id,label,missing}`; **gelöschtes Item ⇒ `missing:true`**
  statt Absturz), `createComment` (Trim, `null` bei leerem Text, Autor-Fallback
  „Unbekannt", id/now injizierbar), `addComment`/`removeComment` (immutabel),
  `commentsChronological` (älteste zuerst, stabiler Sort).
- **Store-Actions** (dünn, delegieren an die Helfer) in `useSprintStore`:
  `toggleCeremonyStory`/`toggleCeremonyTask`, `addCeremonyComment`/
  `removeCeremonyComment` – je mit `kind: "review"|"retro"`; ein generischer
  `patchEntry(state, kind, entryId, fn)` mappt über die richtige Liste (Review/Retro
  teilen `CeremonyMeta`). **Keine Activity-Logs** (Granularität gegen Rauschen,
  konsistent mit TASK-045/043).
- **UI:** neue Komponente `CeremonyEnrichment` (an jedem Historien-Eintrag): Sektion
  „Verknüpfte Items" (Chips mit Link zur Sprint-Detailseite `/sprints/<id>`; ✕ zum
  Entfernen; „Verknüpfen"-Picker mit Story-/Task-Buttons des Sprints, `aria-pressed`)
  + Sektion „Kommentare" (chronologische Liste, Autor+Datum, ✕; Add-Form mit
  optionalem Namen, Enter/Button, disabled bei leerem Text). `CeremonyHistory` reicht
  pro Eintrag die linkbaren Items (`sprintItems(sprintId)`) und die vier Callbacks
  durch – **alle neuen Props optional** (TASK-054-Aufrufer/-Tests bleiben grün).
  `ceremonies/page.tsx` leitet die linkbaren Stories aus `artifacts[projectId].backlog`
  (gefiltert auf `sprint.storyIds`) und die Tasks aus dem `useBoardStore`
  (`storyId ∈ storyIds`) ab und verdrahtet die Store-Actions.
- **Navigation:** verlinkte Items (Story wie Task) führen zur **Sprint-Detailseite**
  `/sprints/<sprintId>` (TASK-053) – dort werden genau diese Items gezeigt; es gibt
  keinen per-Item-Deeplink. Verwaiste Links rendern als durchgestrichenes
  „Gelöschtes Item" ohne Anchor.
- **Der TASK-054-Dialog bleibt unverändert** (Verlinken/Kommentieren passiert
  bewusst am Historien-Eintrag, nicht beim Anlegen ⇒ minimales Regressionsrisiko).

### Tests
- `tests/task-055/ceremonies-links-comments.test.ts` – reine Helfer.
- `tests/task-055/sprint-store-ceremonies.test.ts` – Store-Actions (Review/Retro getrennt).
- `tests/task-055/CeremonyEnrichment.test.tsx` – Render/Interaktion inkl. Missing-Item.
- `e2e/ceremonies.spec.ts` (erweitert) – Verlinken + Kommentar + Reload-Persistenz.
- Gate grün: Lint (0 Errors), `tsc`, 501 Unit-Tests, Build; Ceremonies-E2E (3).

---

## TASK-054: Ceremonies-Bereich v1 (Review/Retro als eigenständiger Bereich)

**Abgeschlossen:** 2026-07-02 · **Meilenstein:** UI-Backlog · **Branch:** `feat/task-054-ceremonies-area-v1`
**Umfang:** mittel · **Priorität:** P2 · **Quelle:** `docs/ui-backlog.md` (Wunsch E) · **Erweitert** TASK-018

### Ziel
Review und Retro lösen sich vom „genau einer Dialog pro Sprint" und werden ein
**eigenständiger Ceremonies-Bereich**: eigene Route, **mehrere, historische**
Einträge, Scope-Wahl (team-übergreifend / pro Team / pro Projekt) und ein
expliziter „Neue Review / neue Retro"-Flow mit Sprint-Auswahl.

### Kontext
TASK-018 hat das Fundament gelegt: `SprintReview`/`SprintRetro` im `useSprintStore`,
**Upsert je Sprint** (genau ein Eintrag), Einstieg über das Klemmbrett-Icon in
`SprintColumn`. Gewünscht (ui-backlog) ist ein eigener Bereich mit Historie. Das ist
bewusst eine **neue** Task, **kein** Nachbau von TASK-018 – TASK-018 bleibt
unangetastet/abgeschlossen.

### Betroffene Dateien
- `src/app/(dashboard)/ceremonies/page.tsx` (neue Route „Ceremonies")
- `src/store/useSprintStore.ts` (Modell erweitert; **Persist-Migration v1→v2**)
- `src/types/index.ts` (`CeremonyScope`/`CeremonyMeta`; `ReviewContent`/`RetroContent`;
  `SprintReview`/`SprintRetro` = Content & Meta)
- `src/lib/ceremonies.ts` (neu: `createReview`/`createRetro`, `ceremonyHistory`,
  `scopeLabel`, `isCeremonyInputValid`, `CEREMONY_SCOPES`)
- `src/lib/sprint-review-schema.ts` (Rückgabetyp der Content-Helfer)
- `src/components/ceremony/CeremonyDialog.tsx`, `CeremonyHistory.tsx` (neu)
- `src/components/sprint/ReviewForm.tsx`, `RetroForm.tsx`, `SprintReviewDialog.tsx`
  (Content-Callbacks statt fertiger Objekte)
- `src/lib/navigation.ts` (Delivery-Gruppe: „Ceremonies")
- `tests/task-054/`

### Technische Anforderungen
- **Modellwechsel** von „eins pro Sprint (Upsert)" zu „mehrere, historisch":
  Reviews/Retros sind Listen mit `id` + `createdAt`; je Sprint mehrere möglich.
- **Persist-Migration v1→v2** mit `migrate`: TASK-018-Upsert-Einträge werden
  verlustfrei in die Listenform überführt (id/`scope: "cross"`/`createdAt`=Epoch
  backfillen, Inhalt erhalten).
- **Scope:** `scope = cross | team | project`; bei `team` ein `teamId`
  (aus `usePeopleStore`), nur dort gesetzt.
- **Neuer Flow:** „Neue Review / neue Retro" → Sprint (vorausgewählt) + Scope
  (+ Team) → wiederverwendetes Review-/Retro-Formular.
- **Historie:** alle Einträge chronologisch (neueste zuerst), dauerhaft einsehbar.
- Geplante PT weiterhin **abgeleitet** (nicht gespeichert), konsistent mit TASK-018.

### Akzeptanzkriterien
- [x] Eigene Route „Ceremonies" mit chronologischer Historie
- [x] Mehrere Reviews/Retros möglich (kein Upsert mehr je Sprint)
- [x] Scope team/project/cross wählbar; bei Team-Scope `teamId` gesetzt
- [x] Persist-Migration überführt TASK-018-Bestand verlustfrei in die Listenform
- [x] Lint/Typecheck/Test/Build grün; E2E für Anlegen + Historie
- [x] `tests/task-054/` mit `testkonzept.md`

### Architektur-Entscheidungen / gelöste Edge Cases
- **Content vs. Meta getrennt:** `reviewFromForm`/`retroFromLists` liefern nur den
  Inhalt (`ReviewContent`/`RetroContent`); `createReview`/`createRetro` ergänzen die
  Ceremony-Metadaten (id/scope/teamId/createdAt, id/now injizierbar). So blieben
  die TASK-018-Schema-Helfer + -Tests inhaltlich unangetastet.
- **Append-only:** `setReview`/`setRetro` (Upsert) → `addReview`/`addRetro` (Append).
  `removeSprint` räumt weiterhin alle Einträge des Sprints ab.
- **teamId nur bei Team-Scope** – cross/project tragen es nie (kein Dangling).
- **Klemmbrett-Flow bleibt** (`/sprints`): speichert jetzt als neuen Eintrag mit
  `scope: "project"`; die Historie ist unter „Ceremonies" einsehbar.
- **Legacy-Datum:** migrierte Einträge (Epoch) zeigen „Datum unbekannt".
- **SSR:** Ceremonies-Seite hinter `useHydrated`-Gate (Datumsformatierung, Persist).
- Verlinkte Backlog-Items + Kommentare sind **TASK-055** (v2), hier out of scope.

### Dokumentation
`docs/task-index.md`, `docs/frontend-plan.md`, `tests/task-054/testkonzept.md`.

---

## TASK-053: Sprint-Detailseite

**Abgeschlossen:** 2026-07-02 · **Meilenstein:** UI-Backlog · **Branch:** `feat/task-053-sprint-detail-page`
**Umfang:** mittel · **Priorität:** P1 (UX) · **Quelle:** `docs/ui-backlog.md` (Kritik Sprint-Ansicht, Wunsch C) · **Abhängigkeit:** TASK-038 (Fortschritt korrekt)

### Ziel
Eine eigenständige **Sprint-Detailseite** mit Kopf (Ziel, Zeitraum, Fortschritt,
Burndown) und einer **klickbaren Story-/Task-Liste** – als Alternative/Ergänzung
zum heutigen Spalten-Layout, das alle Sprints nebeneinander zeigt.

### Kontext
Kritik aus `docs/ui-backlog.md`: das Kanban-Spalten-Layout (alle Sprints
nebeneinander) fühlt sich unpassend an, die **weiße horizontale Scrollbar** unten
wirkt unstimmig, und **Backlog-/Story-Items im Sprint sollen anklick- und
bearbeitbar** sein (wie im Board). Bausteine existieren: `SprintColumn`,
`sprint-progress.ts`, `burndown.ts` (`SprintBurndownChart`), `useSprintStore`.

### Betroffene Dateien
- `src/app/(dashboard)/sprints/[id]/page.tsx` (neue Detail-Route) **oder** Detail-Panel
- `src/app/(dashboard)/sprints/page.tsx` (Navigation zur Detailseite; Scrollbar-Thema)
- `src/components/sprint/` (neu: `SprintDetail` – Kopf + Liste; `SprintColumn` ggf. wiederverwenden)
- `src/lib/sprint-progress.ts`, `src/lib/burndown.ts` (vorhandene Berechnungen nutzen)
- `tests/task-053/`

### Technische Anforderungen
- **Kopf:** Ziel/Name, Zeitraum (`formatSprintRange`), Aktiv-Badge, Fortschritt
  (`sprintProgress`, baut auf TASK-038-Done-Semantik), Burndown (`SprintBurndownChart`).
- **Liste:** zugeordnete Stories und deren Tasks, **anklickbar → öffnet `TaskDialog`**
  (gleiche Quelle wie Board) bzw. Story-Edit (siehe ui-backlog D, separat).
- **Scrollbar-Thema lösen:** das horizontale Spalten-Layout entweder ersetzen oder
  so gestalten, dass die unstimmige Scrollbar verschwindet.
- Empty-/Loading-States; SSR-sicher; Status-Farben über `<StatusBadge>`.

### Akzeptanzkriterien
- [x] Sprint-Detailseite mit Ziel/Zeitraum/Fortschritt/Burndown
- [x] Story-/Task-Liste im Sprint ist anklickbar (öffnet `TaskDialog`)
- [x] Fortschritt nutzt TASK-038-Done-Semantik (keine Doppellogik)
- [x] Horizontale Scrollbar-Unstimmigkeit der Sprint-Übersicht behoben
- [x] Lint/Typecheck/Test/Build grün; E2E für Navigation + Klick
- [x] `tests/task-053/` mit `testkonzept.md`

### Erwartetes Ergebnis
Ein Sprint ist als eigene Seite überblickbar und bedienbar – nicht nur eine Spalte
unter vielen.

### Umsetzung (Ist)
Eigene dynamische Route `src/app/(dashboard)/sprints/[id]/page.tsx` (Server-Component
reicht `id` an die Client-Component durch, Muster wie `projects/[id]`). Neue
`src/components/sprint/SprintDetail.tsx`: Back-Link, Kopf (Name, Ziel, Zeitraum,
Status- + abgeleitetes „Aktiv"-Badge), Fortschritts-Karte (`sprintProgress` +
`ProgressBar`), `SprintBurndownChart` (`sprintBurndown`), und eine klickbare
Story-/Task-Liste (`tasksForStory`), deren Task-Buttons denselben `TaskDialog` wie
das Board öffnen (`onSave → updateTask`, `onDelete → useConfirmDelete`). Done-/
Fortschrittslogik kommt **ausschließlich** aus der TASK-038-Quelle (`isStoryDone`),
keine zweite `.some/.every`-Logik. Navigation über neues optionales `detailHref`-Prop
an `SprintColumn` (Öffnen-Icon ↗ nur bei realen Sprints). Scrollbar: neue
`.thin-scrollbar`-Utility in `globals.css` (themed über `scrollbar-color` +
`::-webkit-scrollbar`, Border-Token) auf die horizontale Spaltenreihe der Übersicht.
Not-Found-/Empty-States, `useHydrated`-Gate für SSR-Sicherheit, Status-Farben nur
über `<StatusBadge>`. Keine neue Dependency, keine Persist-Migration. Nebenbefund:
der Projekt-Seed in `e2e/sprints.spec.ts` war auf Version 1 (ohne `risks`) und
crashte an der v1→v2-Risk-Migration (TASK-045) – auf Version 2 + `risks:{risks:[]}`
angehoben. Tests `tests/task-053/SprintDetail.test.tsx` (5) + `e2e/sprints.spec.ts`
(Detail öffnen, Task-Klick, Back) + `testkonzept.md`. Gate grün (461 Tests, Build)
+ Sprint-E2E (3).

### Offene Punkte
- Detailseite vs. erweitertes Panel: **entschieden → eigene Route** (klar „eigene Seite").
- Story-Edit aus dem Sprint (ui-backlog **D**) bleibt eine eigene, noch unnummerierte
  Task – hier nur die Verlinkung/Klickbarkeit der Tasks, nicht das volle Edit-Modell.

---

## TASK-052: Story-Aufgaben auffindbar machen (Discoverability-Fix)

**Abgeschlossen:** 2026-06-22 · **Meilenstein:** UI-Backlog (Quick Win) · **Branch:** `feat/task-052-story-tasks-discoverability`
**Umfang:** S · **Priorität:** Quick Win · **Quelle:** `docs/ui-backlog.md` (Befund 2026-06-17, Wunsch G)

### Ziel
Das Anlegen von Aufgaben unter einer User Story (TASK-037) existiert, ist aber in
der UI praktisch nicht zu finden – vier Ebenen tief vergraben. Diese Task macht
Story-Aufgaben **sichtbar und erreichbar**.

### Kontext (der Befund)
Heutiger Pfad: `/projects` → Projekt → **ausgeführte Pipeline nötig** (sonst kein
Backlog) → Tab „Backlog" → Epic-Akkordeon aufklappen (per Default nur das **erste**
Epic offen, `BacklogView.tsx:31` `epics.slice(0, 1)`) → unter der Story die Box
„Aufgaben" (`StoryTasks.tsx:128`). Probleme: nur im Backlog-Tab, im zugeklappten
Akkordeon, ohne Pipeline unsichtbar. Deckt sich mit der Audit-Lücke
„Story → Tasks: UX harmonisieren".

### Betroffene Dateien
- `src/components/project/BacklogView.tsx` (Default-Aufklapp-Verhalten / klarere
  Sektion / Hinweis ohne Pipeline)
- `src/components/project/StoryTasks.tsx` (Sektion klarer kennzeichnen, ggf. Count
  prominenter)
- ggf. `src/components/project/ProjectDetail.tsx` (Story anklickbar → Aufgaben)
- `tests/task-052/`

### Technische Anforderungen
- **Hinweis statt Leere**, wenn noch keine Pipeline lief: erklärender Empty-State
  mit CTA „Pipeline ausführen", statt dass die Backlog-Sektion gar nicht erscheint.
- Story-Aufgaben besser sichtbar: z. B. Aufgaben-Count/Badge an der Story-Zeile,
  Story anklickbar → öffnet/scrollt zur Aufgaben-Sektion; Default-Akkordeon so
  wählen, dass Aufgaben nicht „versteckt" sind (Verhalten dokumentieren).
- **Keine** Änderung am Datenmodell (Story-Tasks bleiben Board-Tasks mit `storyId`).
- Reine Darstellungs-/Discoverability-Verbesserung; bestehende Tests grün halten.

### Akzeptanzkriterien
- [x] Ohne ausgeführte Pipeline erscheint ein erklärender Hinweis + CTA statt „nichts"
- [x] Story-Aufgaben sind ohne Tiefsuche erkennbar (Badge/Count) und erreichbar
- [x] Anlegen einer Story-Aufgabe ist aus der Story heraus klar auffindbar
- [x] Lint/Typecheck/Test/Build grün; betroffene E2E grün
- [x] `tests/task-052/` mit `testkonzept.md`

### Erwartetes Ergebnis
Der in `docs/ui-backlog.md` (2026-06-17) festgehaltene Discoverability-Befund ist
behoben – Story-Aufgaben sind ohne Vorwissen findbar.

### Umsetzung (Ist-Zustand)
- **`BacklogView.tsx`:** Akkordeon öffnet jetzt **alle** Epics by default
  (`backlog.epics.map(...)` statt `slice(0, 1)`). Pro Story eine klickbare
  **Aufgaben-Count-Badge** (`data-testid="story-task-count-<storyId>"`,
  „N Aufgaben"/„1 Aufgabe"/„Keine Aufgaben"), die per `scrollIntoView` (mit
  Optional-Call, jsdom-sicher) zur Sektion `#story-tasks-<storyId>` springt.
  Neuer Export **`BacklogEmpty`** (Empty-State „Noch kein Backlog" + CTA
  „Pipeline ausführen", `onRunPipeline`/`isRunning`-Props). `inBoard` unverändert
  (= Story hat ≥1 verknüpften Task).
- **`StoryTasks.tsx`:** Wrapper bekommt Anker-`id="story-tasks-<storyId>"` +
  `scroll-mt-20`; Sektionsüberschrift „Aufgaben" mit `ListChecks`-Icon klarer
  gekennzeichnet. Verhalten/Datenfluss unverändert.
- **`ProjectDetail.tsx`:** Backlog-Tab nutzt ohne Artefakte `BacklogEmpty`
  (CTA ruft `runPipelineForIdea(idea)`) statt des generischen `TabEmpty`.
- **Kein Datenmodell-Change**, keine neue Dependency, keine Persist-Migration.
- Tests `tests/task-052/BacklogView.test.tsx` (alle Epics offen, Count-Badge
  Plural/Singular/leer, Scroll-Klick, `BacklogEmpty` CTA + Disabled) +
  `testkonzept.md`. Gate grün (455 Tests, Build).

### Architektur-Notizen / Edge Cases
- **Discoverability bleibt reine Darstellung:** kein „mine"/„visible"-Feld, Count
  wird aus `useBoardStore.tasks` abgeleitet (`task.storyId === story.id`). Die
  Story-Badge zeigt bewusst nur die **Gesamtzahl** – das detaillierte Roll-up
  (`doneTasks/total · PT`) bleibt in `StoryTasks` (eine Quelle, kein Doppelbau der
  Terminal-/PT-Logik in `BacklogView`).
- **Alle Epics offen** ist die getroffene Default-Entscheidung (Verhalten
  dokumentiert): die „Aufgaben"-Sektion ist damit ohne Vorab-Klick sichtbar; die
  Count-Badge dient als Scan-Signal + Sprungmarke innerhalb eines offenen Epics.
- **`scrollIntoView` jsdom-sicher:** Aufruf via `?.scrollIntoView?.({...})` – in
  jsdom ist die Methode undefiniert, Optional-Call wirft nicht; im Test gestubbt.
- **Empty-State liegt in `ProjectDetail`**, weil dort `artifacts` geprüft wird
  (`BacklogView` rendert nur mit Artefakten); `BacklogEmpty` ist bewusst ein
  exportiertes, dummes Presentational-Component (CTA + Disabled-Flag von außen).

---

## TASK-051: „+ Spalte"-Kachel am Board

**Abgeschlossen:** 2026-06-22 · **Meilenstein:** UI-Backlog (Quick Win) · **Branch:** `feat/task-051-board-add-column-tile`
**Umfang:** XS · **Priorität:** Quick Win · **Quelle:** `docs/ui-backlog.md` (Wunsch B)

### Ziel
Direkt **rechts neben der letzten Board-Spalte** eine „+ Spalte"-Kachel zum
schnellen Anlegen einer neuen Phase – zusätzlich zum bestehenden „Spalten
verwalten".

### Kontext
Phasen sind Daten im `useBoardColumnsStore` (TASK-032) mit `addColumn`. Heute legt
man Spalten nur über den `ColumnManager`-Dialog an. Muster für das Inline-Anlegen
liefert `QuickAddTask` (`src/components/board/QuickAddTask.tsx`).

### Betroffene Dateien
- `src/components/board/AddColumnTile.tsx` (neu, analog `QuickAddTask`)
- `src/app/(dashboard)/board/page.tsx` (Kachel als letztes Element der Spaltenreihe)
- `src/store/useBoardColumnsStore.ts` (`addColumn` wiederverwendet – keine neue Action)
- `tests/task-051/`

### Umsetzung
- Neue **`AddColumnTile`** (dumb, Client-State wie `QuickAddTask`): gestrichelte
  Kachel mit Trigger „+ Spalte" → Inline-`<Input>`. **Enter** ruft `onAdd(label)`
  mit getrimmtem Label und hält das Feld **offen/leer** für den nächsten Eintrag,
  **Esc/Blur** schließt, leere/whitespace-Labels werden ignoriert (testids
  `add-column-trigger`/`add-column-input`).
- `board/page.tsx` rendert die Kachel **als letztes Element** der Spaltenreihe –
  **nur in der flachen Kanban-Ansicht** (`view === "kanban"` & `groupBy === "none"`),
  nicht in Liste/Swimlanes (konsistent zu Quick-Add). `onAdd` ruft
  `useBoardColumnsStore.addColumn({ label })` – **keine neue Action**.
- **Verhalten der neuen Spalte:** `addColumn({ label })` (ohne Status/Terminal)
  hängt die Phase **ans Ende** an, **nicht-terminal**, Default-Status `idle`
  (Store-Default). Done-Semantik (`terminalColumnIds`) bleibt unberührt.
- Keine neue Dependency, **keine Persist-Migration** (Store kann das bereits;
  Spalten persistieren über `pm-studio-board-columns`).

### Akzeptanzkriterien
- [x] „+ Spalte"-Kachel rechts neben der letzten Spalte (Kanban)
- [x] Inline-Anlegen verhält sich wie `QuickAddTask` (Enter/Esc/Blur, leer ignoriert)
- [x] Neue Spalte erscheint sofort und überlebt Reload (persistiert über Store)
- [x] Lint/Typecheck/Test/Build grün; Board-E2E grün (Spalte anlegen)
- [x] `tests/task-051/` mit `testkonzept.md`

### Tests
`tests/task-051/AddColumnTile.test.tsx` (Trigger/Enter/Trim/leer/offen-bleiben/Esc/Blur),
`tests/task-051/add-column-default.test.ts` (Kachel-Aufruf `addColumn({ label })` ⇒
nicht-terminal ans Ende; leer ignoriert – breiteres `addColumn` bleibt in task-032),
`e2e/board.spec.ts` („+ Spalte"-Kachel legt Phase an, erscheint sofort, überlebt
Reload) + `testkonzept.md`. Gate grün (449 Tests, Build) + Board-E2E (11).

---

## TASK-045: Editable Risk Register

**Abgeschlossen:** 2026-06-22 · **Meilenstein:** Future Scope / Nachvollziehbarkeit · **Branch:** `feat/task-045-editable-risk-register`
**Umfang:** mittel · **Priorität:** P1

### Ziel
Risiken sind nicht mehr nur read-only Agenten-Output, sondern **manuell pflegbar**:
mit **Owner**, **Status**, **Mitigation** und **Eskalation** – inkl. neuer Risiken,
Bearbeiten und Entfernen.

### Kontext
Heute ist die Risiko-Tabelle read-only (`docs/audit-2026-06.md`, Teil A „Risks"):
`RiskTable.tsx` zeigt `RiskRegister.risks` (`src/types/index.ts` `RiskEntry`,
`RiskRegister`), die als Artefakt am Projekt hängen (`risks: RiskRegister`).
Bearbeiten erfolgt über das Project-Artifact-Patching im `useProjectStore`.

### Betroffene Dateien
- `src/types/index.ts` (`RiskStatus` neu; `RiskEntry` um `owner?`, `status`
  erweitert, `mitigation?`/`escalation?` optional gemacht – additiv)
- `src/lib/risk.ts` (neu: Status-Meta `RISK_STATUS`/`RISK_STATUS_ORDER`,
  `riskStatusBadge`, reine Transforms `createRisk`/`addRisk`/`updateRisk`/
  `removeRisk`, `riskFormValues`, `withRiskStatus` für die Migration)
- `src/components/project/RiskDialog.tsx` (neu: Add/Edit-Dialog)
- `src/components/project/RiskTable.tsx` (interaktiv: Spalten Owner/Status/
  Eskalation, „Risiko hinzufügen", Bearbeiten, Löschen via `useConfirmDelete`)
- `src/components/project/ProjectDetail.tsx` (`onChange` → `setRisks`)
- `src/store/useProjectStore.ts` (`setRisks` + Persist-Migration v1→v2)
- `src/data/mock-templates.ts` (generierte Risiken bekommen `status: "open"`)
- `tests/task-045/` (+ angepasste Bestandsfixtures task-007/task-011)

### Akzeptanzkriterien
- [x] Risiken anlegen/bearbeiten/löschen mit Owner, Status, Mitigation, Eskalation
- [x] Agentengenerierte Risiken bleiben nach Migration gültig und editierbar
- [x] Status-Farbe ausschließlich über `<StatusBadge>`
- [x] Risk-Transforms als reine Funktionen unit-getestet
- [x] Lint/Typecheck/Test/Build grün (442 Tests)
- [x] `tests/task-045/` mit `testkonzept.md`

### Umsetzungsnotizen
- **Status = neues gepflegtes Feld** (`RiskStatus = open|mitigating|monitoring|
  closed`), Farbe **single-sourced** über `RISK_STATUS` → `<StatusBadge>`
  (spiegelt SPRINT_STATUS/RELEASE_STATUS). `owner`/`mitigation`/`escalation`
  sind optionale Textfelder (Trim, leer ⇒ `undefined`).
- **Reine Transforms** in `src/lib/risk.ts` mit injizierbarer id (deterministische
  Tests, Muster wie `createActivityEvent`); Komponente trägt keine Logik.
- **Transaktional** über das Save-Patch des Projekt-Artefakts: `RiskTable` reicht
  das **gesamte** nächste Array via `onChange` an `useProjectStore.setRisks`
  (no-op ohne Artefakte). Abbrechen verwirft (lokaler Dialog-State).
- **Migration v1→v2** backfillt fehlenden `status` auf „open" (`withRiskStatus`),
  damit vor dem Feature persistierte Agenten-Risiken gültig/editierbar bleiben;
  die Generierung (`mock-templates`) setzt `status` direkt.
- **Löschen** über die gemeinsame Confirm/Undo/Toast-Mechanik (TASK-040):
  Snapshot des Arrays vor dem Löschen, Undo spielt es 1:1 zurück.
- Aktivitäts-Logging der Risiko-Änderungen bewusst **out of scope** (Granularität
  gegen Rauschen, TASK-043); spätere Anbindung über `logActivity` möglich.

---

## TASK-043: Activity Feed & Decision Log

**Abgeschlossen:** 2026-06-22 · **Meilenstein:** Future Scope / Nachvollziehbarkeit · **Branch:** `feat/task-043-activity-decision-log`
**Umfang:** mittel–groß · **Priorität:** P1 · **Abhängigkeit:** TASK-040 (Lifecycle-Events als erste Quelle)

### Ziel
Relevante Änderungen, Agentenläufe, Reviews und menschliche Entscheidungen werden
**nachvollziehbar** gespeichert und angezeigt: ein **Activity Feed** je Entität
(Project/Sprint/Release/Task) und ein **Decision Log** für menschliche Freigaben
und Scope-Entscheidungen.

### Kontext
Heute zeigt das Dashboard nur Agent-Runs, aber keinen Entity-Feed
(`docs/audit-2026-06.md`, Teil B „Activity Feed / Decision Log"). Für den
„agentic"-Anspruch ist eine nachvollziehbare Historie nahezu Pflicht (Octane-
Traceability als Benchmark).

### Umgesetzt
- **Typen** (`src/types/index.ts`): `ActorKind`, `ActivityEntityType`, `ActivityKind`,
  `ActivityEvent { id, entityType, entityId, kind, summary, actor, createdAt }`,
  `Decision { id, context, choice, rationale?, actor, createdAt, relatedEntity? }`.
- **Zentrales Schreiben (append-only):** `useActivityStore.log(input)` + Wrapper
  `logActivity(input)`. Der Store ist ein **Leaf** (importiert keine andere Store-Datei),
  daher rufen die Mutations-Actions in `useProjectStore`/`useBoardStore`/`useSprintStore`/
  `useReleaseStore` ihn **außerhalb** des `set`-Updaters auf (kein Modul-Zyklus, Updater rein).
- **Granularität (gegen Rauschen):** create/delete für Project/Task/Sprint/Release;
  *update* nur für **bedeutsame** Änderungen – Task-**Spaltenwechsel** (`moveTask`/
  `updateTask`, mit Phasen-Label aus `columnLabel`), Sprint-Update, Release-Update.
  Reine Feldedits, Reorder innerhalb einer Spalte und Cascade-Detaches erzeugen **kein** Event.
- **Reine Helfer:** `src/lib/activity.ts` (`createActivityEvent` mit injizierbarer
  id/now ⇒ deterministisch testbar, `eventsForEntity` neueste-zuerst, `ACTIVITY_KIND_META`
  → `<StatusBadge>`-Akzent) und `src/lib/decision.ts` (`createDecision` trimmt + `null`
  bei leerem Kontext/Wahl, `decisionsForEntity`).
- **Decision-Store:** `useDecisionStore` (addDecision/removeDecision/restore), persistiert.
- **UI:** `ActivityFeedPanel` (read-only, `limit`-Prop) + `DecisionLogPanel` (Inline-Add-
  Formular), beide hinter `useHydrated`-Gate; das Store-Array wird **stabil** selektiert
  und der Entity-Slice via `useMemo` abgeleitet (vermeidet den zustand-getSnapshot-Loop,
  TASK-031). Eingebettet in ProjectDetail-Tab „Verlauf" (Feed + Decisions), `TaskDialog`
  (Feed), `SprintDialog`/`ReleaseDialog` jeweils nur im **Edit-Modus** (Feed + Decisions).
- Persist additiv (`pm-studio-activity`/`pm-studio-decisions`, v1), keine neue Dependency.

### Akzeptanzkriterien
- [x] create/update/delete an zentralen Entitäten erzeugt einen Activity-Event
- [x] Activity Feed je Project/Sprint/Release/Task sichtbar, chronologisch
- [x] Decision Log erfasst menschliche Entscheidungen mit Begründung
- [x] Event-/Decision-Erzeugung und Selektoren als reine Funktionen unit-getestet
- [x] Lint/Typecheck/Test/Build grün
- [x] `tests/task-043/` mit `testkonzept.md`

### Architektur-Entscheidungen / Edge Cases
- **Granularität** bewusst festgelegt (Offener Punkt der Task): nur bedeutsame Updates
  loggen, sonst Feed-Rauschen. Spaltenwechsel = der bedeutsame Board-Update.
- **Undo (TASK-040):** Der Lösch-Event bleibt nach einem Undo im Log stehen – der Log
  ist append-only/historisch („wurde gelöscht, dann wiederhergestellt"); bewusst **nicht**
  in die Snapshot/Restore-Mechanik eingebunden.
- **Gleiche Millisekunde:** Events einer schnellen Folge teilen `createdAt`; der
  „neueste zuerst"-Sort ist stabil ⇒ Gleichstände behalten Einfügereihenfolge (für den
  lokalen Single-User-Log unkritisch).
- `review`/`run`-Kinds sind für spätere Agenten-/HITL-Läufe (TASK-012/013) reserviert.

### Tests
`tests/task-043/`: `activity.test.ts` (Factory/Selektor/Meta), `decision.test.ts`
(Factory/Selektor), `activity-store.test.ts` (Store-`log` + Instrumentierung inkl.
Granularität: Reorder/Feldedit erzeugen kein Event), `decision-store.test.ts`,
`ActivityFeedPanel.test.tsx` (Empty/Order/Limit) = 25 Tests. Gate grün (422 Tests, Build).

---

## TASK-042: My Work & globale Suche

**Abgeschlossen:** 2026-06-17 · **Meilenstein:** Future Scope (PM-Korrektheit) · **Branch:** `feat/task-042-my-work-global-search`

### Ziel
Zwei zusammengehörige Lücken schließen:
1. **My Work** – eine zentrale, projekt-/storyübergreifende Sicht auf die Arbeit
   **einer Person** (zugewiesen / offen / überfällig).
2. **Globale Suche/Aktionen** – die CommandBar findet nicht nur Routen, sondern
   **Projekte, Tasks, Stories, Personen, Releases** und bietet Aktionen
   („Task/Person/Release anlegen").

### Umsetzung
- **My Work (`/my-work`, Nav „Meine Aufgaben"):** Reine Selektoren in neu
  `src/lib/my-work.ts` – `tasksForPerson`, `isTaskOpen`, `isTaskOverdue`
  (delegiert an `src/lib/due.ts`, keine zweite Logik), `myWorkCounts`,
  `filterMyWork` (Scope assigned/open/overdue). Done-Semantik über
  `terminalColumnIds` (TASK-032). **Person-Auflösung gekapselt** in
  `resolveMyWorkPersonId(preferredId, persons)` → späterer Login setzt nur
  `preferredId`, Seite bleibt unverändert (Fallback erste Person). UI
  wiederverwendet `BoardListView`/`buildBoardRows`/`FilterBar` + Zähl-Chips
  (zugleich Scope-Schnellfilter); Empty-States via Hydration-Gate und
  „keine Personen"-Karte mit Link zum Team; Safe-Delete aus dem `TaskDialog`
  über `useConfirmDelete` (TASK-040).
- **Globale Suche (CommandBar):** indexfreie `searchEntities(query, sources)` in
  neu `src/lib/search.ts` über Projects/Tasks/Stories/People/Releases
  (case-insensitiv, pro Art gekappt, mit Navigations-`href`; Story-Sublabel =
  Projektname). Die `CommandBar` läuft mit `Command shouldFilter={false}` und
  kontrollierter Query, gruppiert Treffer nach Art und filtert Routen/Aktionen
  manuell.
- **Create-Aktionen:** „Neue Idee anlegen" (→ `/ideas/new`); „Neue Person"/
  „Neues Release" navigieren zur Zielseite und öffnen deren Dialog **deklarativ**
  über den neuen ephemeren `useCommandActionStore` (Intent wird im Render der
  Zielseite ausgelesen, beim Schließen geleert) – bewusst **kein** `setState` im
  Effect (verstößt sonst gegen `react-hooks/set-state-in-effect`) und keine
  URL-Param-Plumbing.
- Keine neue Dependency, keine Persist-Migration (Intent-Store ephemer).

### Tests
- `tests/task-042/my-work.test.ts` – Selektoren (Tasks/Open/Overdue/Counts/Filter/
  Person-Auflösung, inkl. Custom-Terminal-Spalten, ohne `today`).
- `tests/task-042/search.test.ts` – Treffer über alle Arten, hrefs, Sublabel,
  Rollen-Treffer, Kappung, eindeutige Keys.
- `e2e/my-work.spec.ts` – My-Work-Filter + Personenwechsel; CommandBar-Such-
  Navigation; Create-Aktionen „Neue Idee" und „Neue Person".
- `tests/task-042/testkonzept.md`.
- Gate grün: Lint, `tsc`, 397 Unit-Tests, Build, E2E (5).

### Akzeptanzkriterien
- [x] `/my-work`: Person wählbar; zugewiesene / offene / überfällige Tasks korrekt
- [x] Überfällig-Logik nutzt `src/lib/due.ts` (keine Doppellogik)
- [x] CommandBar findet Projects/Tasks/Stories/People/Releases und navigiert dorthin
- [x] Mindestens eine Create-Aktion aus der CommandBar (Idee/Person/Release)
- [x] Selektoren als reine Funktionen unit-getestet
- [x] Lint/Typecheck/Test/Build grün; E2E für `/my-work` + CommandBar-Suche
- [x] `tests/task-042/` mit `testkonzept.md`

---

## TASK-041: Release-Fortschritt & Timeline

**Abgeschlossen:** 2026-06-17 · **Meilenstein:** Future Scope (PM-Korrektheit) · **Branch:** `feat/task-041-release-progress-timeline`

### Ziel
Releases vom reinen „Sprint-Generator" zu einem echten Release-Management-Objekt
machen: mit **Status**, **Scope**, **Fortschritt** (aus den Sprints/Stories/Tasks)
und einer sichtbaren **Sprint-Timeline**. Der Fortschritt setzt auf der korrigierten
Story-Done-Semantik aus TASK-038 auf.

### Umsetzung
- **Typ** (`src/types/index.ts`): `ReleaseStatus = "planned" | "active" | "done"`
  und neues Feld `Release.status`. Manuell gepflegt – der *Fortschritt* wird
  dagegen rein berechnet, nicht aus dem Status abgeleitet.
- **Status-Map** (`src/lib/release-meta.ts`): `RELEASE_STATUS` (Label + `StatusType`)
  + `RELEASE_STATUS_ORDER`, spiegelt `SPRINT_STATUS` → Farbe ausschließlich über
  `<StatusBadge>` (eine Quelle).
- **Reine Aggregation** (`src/lib/release.ts`): `releaseProgress(releaseId, sprints,
  stories, boardTasks, terminalColumns)` summiert `sprintProgress` (TASK-038) über
  die Release-Sprints → `{ donePt, plannedPt, doneCount, total, sprintCount }`.
  **Keine zweite Done-Logik** – `sprintProgress` nutzt `isStoryDone`; eine Story lebt
  in höchstens einem Sprint, daher kein Doppelzählen. Timeline-Helfer `releaseSprints`
  (gefiltert + nach `order` sortiert).
- **Store** (`src/store/useReleaseStore.ts`): Persist **v1→v2** mit additiver
  `migrate` – Altbestand ohne `status` ⇒ `"planned"` (alte Releases bleiben gültig).
- **UI:** `ReleaseDialog` mit Status-Select; `ReleaseCard` zeigt Status-Badge, Scope
  (`n Stories · PT`), Progress-Text + `ProgressBar` (donePt/plannedPt) und die
  Sprint-Timeline (aktiver Sprint via `isActiveSprint` hervorgehoben, Empty-State
  ohne Sprints). `releases/page.tsx` liest Stories aus `artifacts[activeProjectId]`
  + terminale Spalten-Ids (`terminalColumnIds`) und reicht `progress`/`sprints`/`today`
  durch; `today` SSR-sicher erst nach dem `useHydrated`-Gate.
- Keine neue Dependency.

### Akzeptanzkriterien
- [x] Release zeigt Status (StatusBadge), Scope und berechneten Fortschritt
- [x] Fortschritt basiert nachweislich auf TASK-038-Done-Semantik (keine Doppellogik)
- [x] Sprint-Timeline des Releases sichtbar, aktiver Sprint markiert
- [x] Progress-Aggregation als reine Funktion unit-getestet (`releaseProgress`)
- [x] Lint/Typecheck/Test/Build grün (375 Tests) + Playwright (13)
- [x] `tests/task-041/` mit `testkonzept.md`

### Tests
`tests/task-041/`: `release-progress.test.ts` (reine `releaseProgress`/`releaseSprints`
inkl. TASK-038-Fälle: 0 Tasks ⇒ offen, alle Tasks terminal, Custom-Terminal-Spalten),
`ReleaseCard.test.tsx` (Status-Badge, Scope/Progress, Timeline-Aktiv-Markierung,
Empty-State), `release-store-migration.test.ts` (v1→v2 additiv) + `testkonzept.md`.
Bestandsfixtures `tests/task-025` + `tests/task-040` um `status` ergänzt.

### Erwartetes Ergebnis
Ein Release ist auf einen Blick einschätzbar: Wo stehen wir (Fortschritt), was ist
drin (Scope/Status), wann laufen die Sprints (Timeline) – konsistent zu Sprint-/
Velocity-Kennzahlen.

---

## TASK-040: Sichere Lifecycle-Aktionen (Confirm/Undo/Toast)

**Abgeschlossen:** 2026-06-17 · **Meilenstein:** Future Scope (PM-Korrektheit) · **Branch:** `feat/task-040-safe-lifecycle-actions` · **PR:** #78 · **Abhängigkeit:** TASK-038

### Ziel
Destruktive und bearbeitende Aktionen (Löschen / Archivieren / Bearbeiten) für die
zentralen Entitäten sind durchgängig **abgesichert**: keine stillen Löschungen,
eine **Bestätigung** vor irreversiblen Schritten, ein **Undo** per **Toast** und
keine verwaisten Referenzen.

### Umsetzung
Eine **gemeinsame** Mechanik statt Ad-hoc-Dialoge: `useConfirmStore` (imperatives
Promise `confirm(options)`) + `ConfirmDialog`-Host, `useToastStore` (ephemer, kein
Persist) + `Toaster` (Undo-Action, Auto-Dismiss 8 s im Component-Timer), gebündelt
im Hook **`useConfirmDelete`** (`src/components/common/`) als Ablauf **bestätigen →
löschen → Toast mit Undo**; beide Hosts hängen einmalig im `(dashboard)/layout`.
**Undo = Snapshot + `restore`:** jeder betroffene Store hat eine `restore(slice)`-Action
(board/people/project/release/sprint/columns), die die vorherige Slice 1:1 zurückspielt
(Cascade inklusive). **Referenz-Aufräumung beim Löschen:** `usePeopleStore.removePerson`
ruft `useBoardStore.detachAssignee(id)` (Helfer `detachAssignee` in `src/lib/assignment.ts`)
→ kein dangling `assigneeId` (Muster wie `useTagStore.removeTag`→`detachTag`). Konsumenten
verdrahtet: Projekt/Idee (neuer Delete-Header-Button in `ProjectDetail`), Board-Task
(neues Pflicht-Prop `onDelete` im `TaskDialog`), Person/Team (`team/page.tsx`), Release
(`releases/page.tsx`), Board-Phase (`ColumnManager`). Keine neue Dependency, keine
Persist-Migration (Toast/Confirm ephemer).

### Akzeptanzkriterien
- [x] Kein stilles Löschen mehr: Idea/Project, Board-Task, Person, Release, Spalte laufen über Confirm + Toast mit Undo
- [x] Person löschen hinterlässt keine dangling `assigneeId` (Tasks bereinigt)
- [x] Undo stellt gelöschte Entität samt Verknüpfungen wieder her
- [x] Gemeinsame Confirm/Toast-Komponente wiederverwendet (eine Quelle)
- [x] Lint/Typecheck/Test/Build grün; betroffene E2E grün
- [x] `tests/task-040/` mit `testkonzept.md`

### Tests
`tests/task-040/` (assignment-Helfer, Toast-/Confirm-Store, Cross-Store-Cascade+Undo,
voller UI-Fluss `confirm-delete-flow`) + Board-E2E „deletes a task via confirm … undo"
+ `testkonzept.md`; Bestandstests angepasst statt gelöscht: `tests/task-032/ColumnManager`
(Delete hinter Confirm), `tests/task-035/TaskDialog` (neues `onDelete`-Prop).

### Erwartetes Ergebnis
Destruktive Aktionen sind sicher, nachvollziehbar und umkehrbar – die App fühlt sich
„produktreif" an statt prototypisch.

---

## TASK-038: Story-Done-Semantik korrigieren

**Abgeschlossen:** 2026-06-17 · **Meilenstein:** Future Scope (PM-Korrektheit), P0 · **Branch:** `feat/task-038-story-done-semantics` · **PR:** #76

### Ziel
Eine User Story gilt erst dann als **fertig**, wenn **alle** ihr zugeordneten
Story-Tasks in einer terminalen Spalte liegen (und mindestens **ein** Task
existiert). Vorher reichte **irgendein** terminaler Task – das machte Velocity,
Burndown und Sprint-Fortschritt fachlich zu optimistisch.

### Umsetzung
`isStoryDone` (`src/lib/sprint-progress.ts`) zählt eine Story nur noch als fertig,
wenn sie **≥1 Task** hat und **alle** Story-Tasks terminal sind (vorher
`.some(... terminal)`); **0 Tasks ⇒ offen** (kein leeres-`every()`-`true`). Bleibt die
**eine** Done-Quelle: `storyTaskRollup.storyDone` (`story-tasks.ts`), `sprintProgress`,
`selectVelocity` (`dashboard-selectors.ts`) und `sprintBurndown` konsumieren sie weiter –
keine zweite `.some/.every`-Logik. In `burndown.ts` wurde die dortige zweite Done-Entscheidung
in `storyDoneDate` durch `isStoryDone` ersetzt; **Done-Datum = spätestes `doneAt`** (Story
erst mit letztem Task fertig) statt vorher frühestem. UI-Badges (`StoryTasks`/`SprintColumn`/
`SprintStoryCard`) erben die Regel.

### Akzeptanzkriterien
- [x] `isStoryDone`: 0 Tasks = offen, 1/2 = offen, 2/2 = done (unit-getestet)
- [x] `storyTaskRollup.storyDone`, `sprintProgress`, Burndown und Dashboard-Velocity spiegeln die neue Semantik konsistent wider
- [x] Done-Badges in Backlog (`StoryTasks`) und Sprint (`SprintColumn`/`SprintStoryCard`) zeigen erst bei vollständig terminalen Story-Tasks „fertig"
- [x] Keine zweite Done-Quelle eingeführt; bestehende Tests angepasst statt gelöscht/geskippt
- [x] Lint/Typecheck/Test/Build grün; bestehende Board-/Sprint-E2E grün
- [x] `tests/task-038/` mit `testkonzept.md`

### Tests
Bestandstests angepasst statt gelöscht: `tests/task-037` (1/3 ⇒ `storyDone:false`),
`tests/task-032` (1/2, „done"≠terminal ⇒ `false`), `tests/task-026` (Burndown `[3,0]`);
`tests/task-021`/`tests/task-011` bleiben grün. Neu `tests/task-038/` (0/1-von-2/2-von-2
über alle Konsumenten) + `testkonzept.md`.

### Erwartetes Ergebnis
Sprint-Fortschritt, Velocity und Burndown bilden echte Fertigstellung ab: Eine Story
zählt erst als erledigt, wenn ihre gesamte Arbeit terminal ist.

---

## TASK-036: Swimlanes (Gruppierung im Board)

**Abgeschlossen:** 2026-06-16 · **Meilenstein:** 5+++ (Board- & Backlog-Tiefe) · **Branch:** `feat/task-036-board-swimlanes` · **PR:** #67

### Ziel
Das Kanban-Board optional in **Swimlanes** (horizontale Zeilen) gruppieren – nach
Assignee, Sprint oder Tag –, sodass Spalten je Gruppe wiederholt werden; „keine" =
heutige flache Ansicht.

### Umsetzung
Reine Gruppierung in `src/lib/swimlanes.ts`: `SwimlaneMode = none|assignee|sprint|tag`,
`buildSwimlanes(tasks, mode, refs)` → `Swimlane[]` (Lanes in Store-Reihenfolge der
Referenz-Entität, „ohne Zuordnung"-Lane `UNGROUPED_LANE` immer **zuletzt**, **keine
leeren Lanes**; Sprint via `storyId`→Sprint-Map, **Tag via erstem Tag `tagIds[0]`** ⇒
jeder Task in genau einer Lane); `laneReassignment(mode, laneId)`. Auswahl `groupBy`
persistiert im `useBoardStore` (Persist **v7→v8** additiv, Default `none`). Neu
`BoardSwimlanes` (wiederverwendet `KanbanColumn` je Lane) + `SwimlaneSelect`-Umschalter
(nur Kanban-Ansicht). **D&D lane-aware über Drag-`data` statt Id-Parsing:** Droppable
trägt `{type:"column",columnId,laneId}` (Ids/testids per Lane namespaced `<laneId>__<colId>`;
flache Ansicht ohne `laneId` = unveränderte bare Ids), Sortable trägt
`{type:"task",taskId,columnId,laneId}`. `board/page.tsx#handleDragEnd` liest
`over.data.current`; bei Lane-Wechsel zusätzlich `laneReassignment`: Assignee →
`updateTask({assigneeId})`, Sprint → `assignStory` (nur mit storyId), **Tag → nur Spalte**.
Keine neue Dependency.

### Akzeptanzkriterien
- [x] Gruppierung nach Assignee/Sprint/Tag umschaltbar + persistiert
- [x] Lanes mit korrekten Tasks inkl. „ohne Zuordnung"
- [x] Drag & Drop innerhalb/zwischen Lanes funktioniert + dokumentiert
- [x] `buildSwimlanes` unit-getestet; bestehende Board-E2E grün
- [x] Lint/Typecheck/Test/Build grün; `tests/task-036/` mit `testkonzept.md`

### Tests
`tests/task-036/` (swimlanes-Helfer, board-store-groupby, `SwimlaneSelect`,
`BoardSwimlanes` mit `DndContext`-Wrapper) + E2E „groups the board into swimlanes …
survives a reload".

### Erwartetes Ergebnis
Das Board lässt sich nach der relevanten Dimension gruppieren – Überblick über
Auslastung/Sprint/Kategorie auf einen Blick.

---

## TASK-018: Retro- & Review-Formulare

**Abgeschlossen:** 2026-06-16 · **Meilenstein:** 5 (Nacharbeit) · **Branch:** `feat/task-018-retro-review-forms`

### Ziel
Sprint-Review- und Retrospektive-Formulare ergänzen, damit ein Sprint am Ende
abgeschlossen und reflektiert werden kann. Lokal persistiert, pro Sprint.

### Umsetzung
- **Typen** (`src/types/index.ts`): `SprintReview { sprintId, delivered,
  achievedPt, notes? }` und `SprintRetro { sprintId, good[], improve[],
  actions[] }`. Geplante Story-Points werden **nicht** gespeichert, sondern aus
  der Sprint-Zuordnung abgeleitet.
- **Store** (`useSprintStore`): neue Felder `reviews`/`retros` (persistiert) mit
  `setReview`/`setRetro` als **Upsert** über `sprintId` (genau ein Eintrag pro
  Sprint, keine Duplikate); `removeSprint` löscht den zugehörigen Review/Retro mit.
- **Schema/Mapping** (`src/lib/sprint-review-schema.ts`, rein & testbar):
  `reviewFormSchema` (zod v4: `delivered` Pflichtfeld, `achievedPt` Zahl ≥ 0),
  `reviewFromForm`/`reviewFormDefaults`; Retro-Helfer `retroFromLists`,
  `cleanRetroItems`, `retroListsFromRetro`, Konstante `RETRO_COLUMNS`.
- **UI**: `ReviewForm` (react-hook-form + zod, erreichte vs. abgeleitete geplante
  PT, Saved-State), `RetroForm` (drei Listen mit Add/Remove, Enter-to-add),
  zusammengeführt in `SprintReviewDialog` (Tabs Review/Retro). Einstieg über ein
  Klemmbrett-Icon in `SprintColumn`, nur für Sprints im Status `active`/`done`.
  Verdrahtung in `src/app/(dashboard)/sprints/page.tsx` (State, plannedPt-Ableitung).
- **Tests** (`tests/task-018/`): Store-Upsert & Cleanup beim Löschen
  (`useSprintStore.test.ts`), Schema-Validierung & Mapping
  (`sprint-review-schema.test.ts`) – 17 Tests; plus `testkonzept.md`.

### Akzeptanzkriterien (alle erfüllt)
- [x] Review ausfüllen & speichern → Reload → Werte erhalten
- [x] Retro-Items hinzufügen/entfernen & speichern → Reload → erhalten
- [x] Validierung greift (Pflichtfeld, positive Zahl)
- [x] Pro Sprint genau ein Review/eine Retro (Upsert, keine Duplikate)
- [x] Lint/Typecheck/Test/Build grün; `tests/task-018/` mit Tests **und** `testkonzept.md`

---

## TASK-032: Anpassbare Kanban-Phasen (Spalten)

**Abgeschlossen:** 2026-06-16 · **Meilenstein:** 5+++ (Board- & Backlog-Tiefe) · **Branches:** `feat/task-032a-board-columns-store` (PR #64), `feat/task-032b-is-terminal`

### Ziel
Eigene Board-Phasen anlegen/umbenennen/sortieren/löschen, je Phase Status-Akzent
und optionales WIP-Limit – statt der fest verdrahteten 6 Spalten. Kennzahlen
(Burndown/Velocity/Done) bleiben korrekt, weil sie an einem `isTerminal`-Flag der
Phase hängen statt an einem festen Spaltennamen.

### Umsetzung
- **032a – Phasen als Daten:** neuer Typ `BoardColumnDef { id, label, status,
  order, wipLimit?, isTerminal }`; `BoardColumn` ist jetzt eine freie String-Id.
  Neuer `useBoardColumnsStore` (persist `pm-studio-board-columns`, v1 =
  `DEFAULT_BOARD_COLUMNS`) mit CRUD: `addColumn`, `renameColumn`,
  `setColumnStatus`, `setColumnWip`, `setColumnTerminal` (schützt die letzte
  terminale Phase), `reorderColumns`, `removeColumn` (verschiebt die Tasks der
  gelöschten Phase via neuer `useBoardStore.reassignColumn` auf eine Fallback-
  Phase; schützt letzte/letzte-terminale Phase). `src/lib/board.ts` liefert nur
  noch `DEFAULT_BOARD_COLUMNS` + spaltenbewusste Helfer (`findColumn`,
  `columnLabel`, `columnStatus`, `isWipExceeded(def,count)`) – die früheren
  Konstanten `BOARD_COLUMNS`/`BOARD_COLUMN_STATUS`/`BOARD_WIP_LIMITS` entfallen.
  Neuer `ColumnManager` („Spalten verwalten") mit Inline-Rename, Status-Select,
  WIP-Feld, „Abgeschlossen"-Toggle, Reihenfolge per ▲/▼ und Löschen. Alle
  Konsumenten lesen die Phasen aus dem Store (`board/page.tsx`, `KanbanColumn`
  [nimmt jetzt `column: BoardColumnDef`], `BoardListView` [Status-Optionen via
  `meta`], `TaskDialog`, `StoryTasks`) bzw. nehmen sie als Parameter (reine
  Helfer `board-rows`, `story-tasks`; Default = Standardphasen).
- **032b – `isTerminal` als Done-Quelle:** neue Helfer `terminalColumnIds(columns)`
  /`DEFAULT_TERMINAL_COLUMN_IDS`/`isTerminalColumn` in `src/lib/board.ts`. Das
  literale `column === "done"` ist überall ersetzt: `useBoardStore.stampDone`
  (`doneAt` beim Eintritt/Verlassen einer terminalen Phase), `sprintBurndown`,
  `isStoryDone`/`sprintProgress` (Velocity), `storyTaskRollup`, Überfällig
  (`filterBoardTasks` → `isOverdue`), `storyMatchesFilter`, sowie
  `dashboard-selectors` (`selectProjects`, `selectVelocity`, Donut
  `selectTaskStatusDistribution` jetzt nach Status-Akzent gebucketet → kein Crash
  bei Custom-Spalten-Ids). Komponenten/Seiten reichen die terminalen Ids durch
  (`TaskCard.isTerminal`, `BoardListView`-Due-Zelle, `SprintColumn.terminalColumns`,
  Dashboard/Sprints/Board-Seite via `terminalColumnIds(boardColumns)`). Alle
  Helfer defaulten auf die Standard-Terminal-Id (`done`) → Bestand bleibt stabil.
- **Migration ohne Datenverlust:** neuer Store v1 = Default-Phasen; bestehende
  Task-`column`-Ids = Default-Ids, kein Transform nötig. Keine neue Dependency.

### Tests
`tests/task-032/`: `useBoardColumnsStore.test.ts` (CRUD/Reorder/Guards/Task-Umzug),
`dynamic-columns.test.ts` (Label/Status/Ordering mit Custom-Phasen),
`ColumnManager.test.tsx` (anlegen/rename/move/löschen/Schutz), `is-terminal.test.ts`
(Done-Semantik folgt dem Flag, nicht „done"), `board-store-terminal.test.ts`
(`doneAt`-Stempel folgt `isTerminal`). Angepasst: `tests/task-027`,
`tests/task-030`. E2E `e2e/board.spec.ts`: Phase über „Spalten verwalten" anlegen,
überlebt Reload. `testkonzept.md` mit manueller Checkliste + DoD-Abgleich.

### Akzeptanzkriterien
- [x] Spalten anlegen/umbenennen/sortieren/löschen; persistiert + migriert
- [x] Status-Akzent + WIP je Spalte konfigurierbar (Token-Farben)
- [x] `isTerminal` ersetzt literal `done` in Burndown/Velocity/`doneAt` korrekt
- [x] Bestehende Board-/Burndown-/Velocity-Tests bleiben grün (ggf. angepasst)
- [x] Lint/Typecheck/Test/Build grün; `tests/task-032/` mit `testkonzept.md`

### Erwartetes Ergebnis
Teams modellieren ihren eigenen Flow; Kennzahlen bleiben korrekt, weil sie an
`isTerminal` statt an einem festen Spaltennamen hängen.

---

## TASK-035: Checklisten/Subtasks auf Task-Ebene

**Abgeschlossen:** 2026-06-16 · **Meilenstein:** 5+++ (Board- & Backlog-Tiefe) · **Branch:** `feat/task-035-task-checklists`

### Ziel
Innerhalb eines Tasks eine **Checkliste** abhakbarer Punkte führen und den
Fortschritt („n/m") auf Karte und in der Liste anzeigen. Leichtgewichtige
Unterpunkte *innerhalb* eines Board-Tasks – abzugrenzen von Story→Aufgaben
(TASK-037, eigene Board-Tasks).

### Umsetzung
- **Modell:** `ChecklistItem { id, text, done }` + `BoardTask.checklist?`
  (`src/types/index.ts`); additive Persist-Migration **v6→v7** (Altbestand ohne
  Wert, kein Transform).
- **Logik (`src/lib/checklist.ts`, rein/unit-getestet):** `checklistProgress(items)`
  → `{ done, total }` (fehlend = 0/0), `checklistComplete`; Array-Transforms
  `addChecklistItem` (Trim, leer ignoriert, `crypto.randomUUID`),
  `toggleChecklistItem`, `renameChecklistItem` (bewusst **ohne** Trim – erlaubt
  Zwischenstände beim Tippen), `removeChecklistItem`, `normalizeChecklist` (trimmt,
  leere raus, `undefined` wenn nichts bleibt → Feld wird wie `tagIds`/`dueDate`
  gar nicht persistiert).
- **Anzeige:** neue `ChecklistProgress.tsx` (`ChecklistProgressBadge`) – kompakte
  „n/m"-Pille mit `ListChecks`-Icon, grün bei vollständig; Farbe **nur** über
  `STATUS_STYLES.success` (gleiche Quelle wie `<StatusBadge>`), sonst neutral
  (`bg-secondary`). Rendert nichts ohne Checkliste. Auf `TaskCard` (Meta-Zeile
  neben `DueBadge`/PT) und als nicht-sortierbare Spalte „Checkliste" in
  `BoardListView` (`BoardRow.checklist`, sonst „–").
- **Editor (`TaskDialog`):** Abschnitt „Checkliste" mit Mini-`ProgressBar`
  (TASK-028; `success` bei vollständig, sonst `info`), je Punkt Checkbox
  (`role="checkbox"`, Toggle), Inline-`<Input>` (Umbenennen) und ✕ (Entfernen);
  neues Feld + „Hinzufügen"/Enter legt an. Persistenz **transaktional** über das
  bestehende Save-Patch (`checklist: normalizeChecklist(...)`) – konsistent mit
  Tags/Fälligkeit, daher **keine** neuen Store-Actions. Tastaturbedienbar,
  Empty-State sauber. Keine neue Dependency.

### Tests
`tests/task-035/`: `checklist.test.ts` (alle Helfer inkl. Edge Cases – leer/
teilweise/vollständig, Trim/Normalize), `ChecklistProgress.test.tsx` (Anzeige,
`data-complete`), `TaskDialog.checklist.test.tsx` (anlegen/abhaken/entfernen →
Save-Patch, geleerter Punkt fällt raus). `testkonzept.md` mit manueller
Checkliste + DoD-Abgleich.

### Akzeptanzkriterien
- [x] Checklistenpunkte im Dialog anlegen/abhaken/umbenennen/entfernen (persistiert)
- [x] Fortschritt „n/m" auf Karte + Liste (nur bei vorhandener Checkliste)
- [x] `checklistProgress` unit-getestet (leer, teilweise, vollständig)
- [x] Lint/Typecheck/Test/Build grün; `tests/task-035/` mit `testkonzept.md`

### Erwartetes Ergebnis
Feinere Aufgabenverfolgung innerhalb eines Tasks mit sichtbarem Fortschritt.

---

## TASK-034: Fälligkeitsdaten & Überfällig-Hinweis

**Abgeschlossen:** 2026-06-16 · **Meilenstein:** 5+++ (Board- & Backlog-Tiefe) · **Branch:** `feat/task-034-due-dates`

### Ziel
Tasks ein optionales **Fälligkeitsdatum** geben, es auf Karte/Liste anzeigen,
Überfälligkeit dezent kennzeichnen und danach filtern können.

### Umsetzung
- **Modell:** `BoardTask.dueDate?` (ISO `YYYY-MM-DD`, `src/types/index.ts`); additive
  Persist-Migration v5→v6 (Altbestand ohne Wert, kein Transform).
- **Logik (`src/lib/due.ts`, rein/unit-getestet):** `isOverdue(dueDate, today, done)`
  (Termin < heute, offen; lexikografischer ISO-Vergleich – kein Date/Zeitzonen-Handling),
  `dueStatus` → `overdue | today | upcoming` (erledigte Tasks immer neutral),
  `DUE_STATUS_TOKEN` (Zustand → StatusBadge-Token: danger/warning/neutral),
  `formatDueDate` (`DD.MM.`). ⚠️ `done` kapselt die terminale Spalte (heute
  `column === "done"`) – für TASK-032 über `isTerminal` versorgen.
- **Anzeige:** neue `DueBadge` (`src/components/board/DueBadge.tsx`) – kompakte Pille
  `DD.MM.` mit Kalender-Icon; Warnfärbung **nur** über `STATUS_STYLES` (gleiche Quelle
  wie `<StatusBadge>`), `upcoming` neutral (`bg-secondary`). Auf `TaskCard` und als
  sortierbare Spalte „Fällig" in `BoardListView` (`BoardRow.dueDate`).
- **Dialog:** Feld „Fällig am" (`type="date"`) im `TaskDialog`; leer ⇒ `dueDate: undefined`.
- **Filter:** Sentinel `OVERDUE` in `board-filters.ts` (`BoardFilter.due`), ausgewertet
  gegen das clientseitige `today` (optionaler Param von `filterBoardTasks`); Control
  „Fälligkeit" in `board/page.tsx`.
- **SSR-sicher:** „heute" (`new Date().toLocaleDateString("sv-SE")`) erst nach dem
  Hydration-Gate berechnet und per Prop an `KanbanColumn`/`TaskCard`/`BoardListView`
  durchgereicht (Muster wie `isActiveSprint`). Keine neue Dependency.

### Tests
`tests/task-034/`: `due.test.ts` (Helfer inkl. Edge Cases), `board-filter-due.test.ts`
(Überfällig-Filter, ohne `today` no-op), `DueBadge.test.tsx` (Anzeige/Status/Done).
E2E `e2e/board.spec.ts`: Überfällig-Badge + Filter. `tests/task-030/BoardListView.test.tsx`
um die `today`-Prop ergänzt. `testkonzept.md` mit manueller Checkliste + DoD-Abgleich.

### Akzeptanzkriterien
- [x] `dueDate` im Dialog setzbar/löschbar; persistiert
- [x] Datum auf Karte + Liste; Überfälligkeit dezent (Token-Farbe), nicht bei Done
- [x] Filter „überfällig" funktioniert (FilterBar, Reset/Empty-State)
- [x] `due.ts`-Helfer unit-getestet (überfällig/heute/zukünftig, Done-Ausnahme)
- [x] SSR-sicher; Lint/Typecheck/Test/Build grün; `tests/task-034/` mit `testkonzept.md`

### Erwartetes Ergebnis
Termine sind sichtbar und steuerbar; überfällige Arbeit fällt auf einen Blick auf.

---

## TASK-033: Quick-Add direkt in der Spalte

**Abgeschlossen:** 2026-06-16 · **Meilenstein:** 5+++ (Board- & Backlog-Tiefe) · **Branch:** `feat/task-033-column-quick-add`

### Ziel
Am Ende jeder Kanban-Spalte einen neuen Task per Inline-Eingabe anlegen können
(„+ Task hinzufügen"), ohne den vollen `TaskDialog` zu öffnen.

### Kontext
Tasks entstanden bisher über „In Board übernehmen" (Backlog) oder den `TaskDialog`.
`useBoardStore.addTask` legt einen Task am Spaltenende an (korrekte `order`).
`KanbanColumn` rendert Kopf + sortierbare Liste (TASK-027).

### Umsetzung
- **`src/components/board/QuickAddTask.tsx` (neu):** dumme Komponente analog
  `EditableTextCell`. „+ Task hinzufügen"-Trigger → Inline-`<Input>`; **Enter** ruft
  `onAdd(trimmedTitle)` und hält das Feld **offen/leer** für den nächsten Eintrag,
  **Esc/Blur** schließt, leere/whitespace-Titel werden ignoriert. Prop `disabled`
  rendert `disabledHint` statt des Triggers (testids
  `quick-add-trigger|input|disabled-<col>`).
- **`KanbanColumn`:** rendert `QuickAddTask` am Spaltenfuß und reicht
  `onQuickAdd(column, title)` / `quickAddEnabled` / `quickAddDisabledHint` durch –
  nur sichtbar, wenn `onQuickAdd` gesetzt ist.
- **`board/page.tsx`:** aktives Projekt aus dem Filter ableiten
  (`filter.projectId === ALL ? undefined : ideas.find(...)`); bei `ALL` deaktiviert
  mit Hinweis „Projekt wählen, um Tasks anzulegen" (Board-Task braucht zwingend
  `projectId`/`projectName`). `handleQuickAdd(column, title)` baut den Task via
  `useBoardStore.addTask` (richtige Spalte/`order` automatisch, Default-Priorität
  `"mittel"`, Projektbezug). Keine neue Dependency, keine Persist-Migration. Die
  `addTask`-Order-Semantik ist bereits in `tests/task-008` getestet (nicht dupliziert).

### Tests
`tests/task-033/QuickAddTask.test.tsx` (6 Tests) + E2E `e2e/board.spec.ts`
(Disabled-Zustand bei „Alle Projekte", Anlegen nach Projektwahl, Counter,
Persistenz nach Reload). `testkonzept.md` mit manueller Checkliste + DoD-Abgleich.

### Akzeptanzkriterien
- [x] „+ Task" am Spaltenfuß; Inline-Anlegen per Enter, Esc/Blur schließt
- [x] Neuer Task landet in der richtigen Spalte, persistiert, Counter stimmt
- [x] Projektbezug korrekt (aus aktivem Filter oder Default)
- [x] Lint/Typecheck/Test/Build grün; `tests/task-033/` mit `testkonzept.md`

### Erwartetes Ergebnis
Schnelles Erfassen neuer Tasks im Flow, ohne Kontextwechsel zum Dialog.

---

## TASK-030: Inline-Editing der Board-Listenansicht

**Abgeschlossen:** 2026-06-15 · **Meilenstein:** 5+++ (Board- & Backlog-Tiefe) · **Branch:** `feat/task-030-list-inline-edit`

### Ziel
In der Scrum-/Listenansicht des Boards Werte **direkt in der Zelle** ändern können –
Dropdown für Auswahlfelder, Inline-Textfeld für Freitext/Zahlen – statt für jede
Änderung den vollen `TaskDialog` zu öffnen.

### Kontext
`BoardListView` (TASK-023) rendert ein sortierbares TanStack-Grid; ein Zeilenklick
öffnete bisher den `TaskDialog`. Gespeichert wird über `useBoardStore.updateTask`;
Personen/Sprints kommen aus den jeweiligen Stores.

### Umsetzung
- **Wiederverwendbare Zellen** in `src/components/board/cells/`:
  - `EditableTextCell` – Wert als Button, beim Klick Inline-`<Input>`; Enter/Blur
    committen, Esc bricht ab. Der Caller trimmt/parst/validiert den Rohstring
    (dumme, für Text **und** Zahl nutzbare Zelle).
  - `EditableSelectCell` – randloser `<Select>`-Trigger mit aktueller Option,
    Dropdown zum Ändern; `disabled` rendert einen statischen Platzhalter. Optionen
    optional mit Rich-Node (StatusBadge). base-ui `onValueChange` liefert
    `string | null` → null wird abgefangen.
  - **Beide stoppen die Klick-Propagation**, sodass Inline-Edit nicht den
    Zeilen-`TaskDialog` öffnet.
- **`BoardListView`:** Spalten Titel/PT → `EditableTextCell` (PT validiert ≥ 0,
  leer ⇒ `estimate_pt: undefined`), Status/Priorität/Assignee → `EditableSelectCell`
  (`BOARD_COLUMNS`, `severityBadge`/`PRIORITIES`, `persons`). Sprint-Zelle:
  Story-Sprint-Zuordnung – nur bei Tasks **mit** `storyId` editierbar (sonst „–"),
  Optionen aus den Projekt-Sprints, Speichern über `useSprintStore.assignStory`
  (Story-Ebene, gilt für alle Tasks der Story). Handler + Lookup-Daten
  (`onUpdateTask`, `onAssignSprint`, `persons`, `sprints`) laufen über die
  TanStack-`meta` an die Zell-Renderer.
- **Dialog-Konflikt:** Zeile bleibt klickbar (`onRowClick` → `TaskDialog`);
  editierbare Zellen fangen den Klick ab → Zellklick editiert, ID/Projekt/Tags/
  Zeilenrand öffnen weiter den Dialog.
- **Persistenz:** über die bestehenden Store-Actions (`updateTask` reiht bei
  Spaltenwechsel neu ein + stempelt `doneAt`; `assignStory` löst die Story aus
  jedem anderen Sprint). Keine neue Dependency, keine Persist-Migration nötig.

### Tests
`tests/task-030/`: `EditableTextCell.test.tsx` (Commit/Cancel/Blur/Propagation),
`EditableSelectCell.test.tsx` (Anzeige/disabled/onChange/Propagation),
`BoardListView.test.tsx` (Titel-/PT-Inline-Edit inkl. Validierung, Status-/Sprint-
Dropdown, Sprint ohne Story deaktiviert, Dialog über nicht-editierbare Zelle).
E2E `e2e/board.spec.ts`: Titel inline bearbeiten überlebt einen Reload.
`testkonzept.md` mit manueller Klick-Checkliste + DoD-Abgleich.

### Akzeptanzkriterien
- [x] Status/Priorität/Assignee/Sprint je Zelle per Dropdown änderbar (persistiert)
- [x] Titel/PT je Zelle per Inline-Textfeld änderbar (Enter/Esc/Blur)
- [x] Zellklick editiert, Dialog nur über Zeile/ID/Detail – kein Konflikt
- [x] Änderungen überleben Reload (Store-Persist)
- [x] Lint/Typecheck/Test/Build grün; `tests/task-030/` mit `testkonzept.md`

---

## TASK-031: Tags/Labels für Backlog- & Board-Items

**Abgeschlossen:** 2026-06-15 · **Meilenstein:** 5+++ (Board- & Backlog-Tiefe) · **Branch:** `feat/task-031-tags-labels`

### Ziel
Backlog- und Board-Items mit **Tags** versehen können (z. B. „Frontend", „Bug",
„Tech-Debt"), inkl. Anzeige als Chips, Verwaltung und Filterung.

### Kontext
Tasks (`BoardTask`) hatten bisher Projekt, Priorität, Assignee, Sprint, aber keine
freien Labels. Filter laufen über `src/lib/board-filters.ts` + die generische
`FilterBar`. Status-/Farb-Quelle ist `<StatusBadge>` bzw. die Design-Tokens.

### Umsetzung
- **Modell:** `Tag { id, name, color }` + `BoardTask.tagIds?` (`src/types/index.ts`).
  Feste Token-Farbpalette (`primary | accent | info | success | warning | danger`)
  mit literalen Klassen in `src/lib/tags.ts` (`TAG_COLOR_STYLES`, `bg-<token>/10` +
  `text-<token>`) – keine Ad-hoc-Hex.
- **Store:** `useTagStore` (persist `pm-studio-tags`, CRUD). `removeTag` entkoppelt
  den Tag aus allen Board-Tasks über `useBoardStore.detachTag` (rein:
  `detachTaskTags`, leeres `tagIds` wird ganz entfernt). Board-Persist v4→v5
  (additiv).
- **Helfer:** `tagsForIds` (Store-Reihenfolge, unbekannte Ids ignoriert),
  `taskHasTag`, `detachTaskTags` in `src/lib/tags.ts`.
- **UI:** `TagChips` (Karte/Liste, `+N`-Überlauf), `TagManager`-Dialog auf dem Board
  (anlegen/umbenennen/umfärben/löschen mit Farb-Swatches), Tag-Toggle im
  `TaskDialog`, `board-rows` löst Tags für die Liste auf, Tag-Filter (einwertig)
  über `BoardFilter.tagId` + `FilterBar`. `TaskCard` leitet Tags per `useMemo` ab
  (Selektor gibt stabiles Array zurück – sonst zustand-Loop).

### Akzeptanzkriterien
- [x] Items lassen sich mehrere Tags zuweisen (im Dialog); persistiert
- [x] Tag-Chips erscheinen auf Karte und in der Liste (Token-Farben)
- [x] Tags anlegen/umbenennen/Farbe/löschen; Löschen entkoppelt überall
- [x] Board nach Tag filterbar (FilterBar), Reset/Empty-State funktionieren
- [x] Reine Tag-Helfer unit-getestet; Lint/Typecheck/Test/Build grün
- [x] `tests/task-031/` mit Tests **und** `testkonzept.md`

### Erwartetes Ergebnis
Items sind frei kategorisierbar und nach Tags filterbar – bessere Übersicht im
größer werdenden Backlog/Board.

---

## TASK-037: Story → Aufgaben (Scrum-Hierarchie)

**Abgeschlossen:** 2026-06-15 · **Meilenstein:** 5+++ (Board- & Backlog-Tiefe) · **Branch:** `feat/task-037-story-tasks`

### Ziel
Unter einer **User Story** eigene **Aufgaben** anlegen und verwalten können – die
Scrum-typische Zerlegung Story → Tasks, wie sie Entwickler:innen vornehmen. Diese
Hierarchie ist später die Andockstelle für Agenten (automatisch Tasks ableiten)
und Testautomationen (Tasks als ausführbare Einheiten).

### Designentscheidung
Dev-Aufgaben einer Story sind **Board-Tasks mit `storyId`** (kein neues
Entity-Modell) – so sind sie sofort im Board/Sprint/Filter/Velocity nutzbar und
bleiben „eine Quelle". TASK-037 ergänzt die Verwaltung von Story-Seite aus und die
hierarchische Darstellung.

### Umsetzung
- `src/lib/story-tasks.ts` (neu): reine Helfer `tasksForStory` (selektiert + sortiert
  nach Spalte→Position), `storyTaskRollup` (Anzahl/erledigt + PT-Summen, `storyDone`
  über `isStoryDone` → konsistent zu TASK-021), `detachStoryTasks` (entkoppelt den
  `storyId`-Link, ohne Tasks zu verwerfen).
- `src/store/useBoardStore.ts`: Action `detachStory(storyId)`.
- `src/store/useProjectStore.ts`: entkoppelt Story-Tasks, wenn Stories verschwinden –
  `removeIdea` (Projekt gelöscht) und `setArtifacts` (Backlog neu generiert, nur die
  weggefallenen Stories).
- `src/components/project/StoryTasks.tsx` (neu): je Story Roll-up + Task-Liste
  (Spalten-Status, Assignee, PT, Priorität) + Inline-Add-Form (Titel, Priorität,
  PT, optional Person) → `addTask` mit `storyId`, Spalte `todo`. Empty-State,
  Link „Im Board ansehen →".
- `src/components/project/BacklogView.tsx`: `StoryTasks` je Story eingehängt.
- Tests `tests/task-037/` (Helfer, Detach/Store-Wiring, Komponente) + `testkonzept.md`;
  bestehende `tests/task-007/BacklogView.test.tsx`-Assertion auf `getAllByText`
  gelockert (Priorität jetzt auch im Add-Form-Default sichtbar).

### Akzeptanzkriterien
- [x] Je Story Tasks sichtbar; neue Story-Tasks anlegbar (als `BoardTask` mit `storyId`)
- [x] Story-Roll-up (Anzahl, erledigt/gesamt, PT-Summe) korrekt + konsistent zu TASK-021
- [x] Story löschen entkoppelt ihre Tasks (kein Verwaisen)
- [x] Reine Helfer unit-getestet; bestehende Backlog-/Board-Tests grün
- [x] Lint/Typecheck/Test/Build grün; `tests/task-037/` mit `testkonzept.md`

---

## TASK-029: Einstellungen-Seite & Theme (Dark/Light/System)

**Abgeschlossen:** 2026-06-15 · **Meilenstein:** 5++ (Releases & Scrum-Tiefe) · **Branch:** `feat/task-029-settings-theme`

### Ziel
Eine **Einstellungen-Seite** (`/settings`) einführen mit einem **Theme-Umschalter
Dark/Light/System** (Dark bleibt Default) sowie weiteren sinnvollen Optionen.

### Kontext
Die App war **Dark-only**: `:root` und `.dark` trugen dieselben dunklen Tokens,
`<html className="dark">` war hartkodiert. Für einen echten Toggle brauchte es
eine **Light-Palette** und ein Anwenden des persistierten Themes ohne Flackern.

### Betroffene Dateien
- `src/app/globals.css` (Light-Tokens unter `:root`, Dark unter `.dark`)
- `src/app/layout.tsx` (hartkodiertes `dark` entfernt; No-Flash-Skript + `ThemeApplier`)
- `src/lib/theme.ts` (neu: `resolveTheme`/`applyThemeClass`/`themeInitScript`/Optionen)
- `src/store/useSettingsStore.ts` (neu, persist `pm-studio-settings`)
- `src/components/settings/` (`ThemeApplier`, `SettingsSegment`)
- `src/app/(dashboard)/settings/page.tsx` (neu)
- `src/store/useBoardStore.ts` (`viewExplicit`, Migration v3→v4)
- `src/app/(dashboard)/board/page.tsx` (Default-Ansicht via Settings)
- `src/lib/use-reduced-motion.ts` (Motion-Override)
- `src/lib/navigation.ts` (Gruppe „System" → „Einstellungen")
- `docs/design-system.md`, `tests/task-029/`

### Umsetzung (Kurz)
- Theme `"light" | "dark" | "system"` im `useSettingsStore` (persist). No-Flash via
  Inline-Skript in `layout.tsx` (liest `localStorage` vor dem ersten Paint, Default
  Dark); `ThemeApplier` hält die `.dark`-Klasse synchron und folgt `system` live via
  `matchMedia`. Kein `next-themes` (eigener Store, konsistent zum Persist-Muster).
  `<html suppressHydrationWarning>` wegen der vom Skript gesetzten Klasse.
- Vollständige Light-Palette (Tokens, Status-Töne kräftiger für Kontrast), single-sourced.
- Settings-Seite: Segmented Controls für Theme, Standard-Board-Ansicht und Animationen.
  Default-Board-Ansicht greift über `viewExplicit` (Board-Store, Migration v3→v4 setzt
  Bestand auf explizit). Reduced-Motion-Override über `motion` in `useReducedMotion`.

### Akzeptanzkriterien
- [x] Theme zwischen Dark/Light/System umschaltbar; Auswahl persistiert, kein FOUC
- [x] `system` folgt der OS-Einstellung (inkl. Live-Wechsel)
- [x] Light- und Dark-Ansicht lesbar; Statusfarben/Tokens in beiden korrekt
- [x] Weitere Einstellungen greifen (Default-Board-Ansicht + Reduced-Motion)
- [x] Lint/Typecheck/Test/Build grün; `tests/task-029/` mit Tests **und** `testkonzept.md`

### Erwartetes Ergebnis
Nutzer wählen Theme und Grundeinstellungen selbst; die App ist hell wie dunkel nutzbar.

### Dokumentation
`docs/design-system.md` (Light-Palette, Theme-Strategie),
`tests/task-029/testkonzept.md`, `task-index.md`.

---

## TASK-028: Sprint-Visualisierung (Fortschritt & Auslastung als Balken)

**Abgeschlossen:** 2026-06-15 · **Meilenstein:** 5++ (Releases & Scrum-Tiefe) · **Branch:** `feat/task-028-sprint-visuals`

### Ziel
Die aktuell rein textliche Anzeige von **Sprint-Fortschritt** („erledigt X /
geplant Y PT") und **Personen-Auslastung** („X / Y PT"-Badges) durch klare
**Balken-Visualisierungen** ersetzen.

### Kontext
Fortschritt (TASK-021) und Auslastung (TASK-020) werden heute als Text/Badges
gezeigt – schwer auf einen Blick erfassbar. Die reinen Berechnungen
(`sprintProgress`, `sprintWorkload`, `loadStatus`) bleiben unverändert.

### Betroffene Dateien
- `src/components/ui/ProgressBar.tsx` (neu, wiederverwendbar)
- `src/components/sprint/SprintColumn.tsx` (Fortschritts- & Kapazitätsbalken)
- `tests/task-028/`

### Technische Anforderungen
- `<ProgressBar value max status?>`: gefüllter Balken, Farbe ausschließlich über
  Design-Tokens/Status (success/warning/danger), barrierearm (`role="progressbar"`,
  `aria-valuenow/max`), clamped auf [0, max], `max=0` sauber behandelt.
- Sprint-Kopf: Fortschrittsbalken `donePt / plannedPt` mit knappem Label statt der
  bisherigen Textzeile.
- Auslastung: pro Person ein Kapazitätsbalken `assignedPt / capacityPt`; Überlast
  klar erkennbar (Farbe via `loadStatus`, Überlauf-Indikator > 100 %). Kompakt und
  lesbar, Name + Werte daneben.
- Keine Änderung an den Berechnungslogiken; nur Darstellung.

### Akzeptanzkriterien
- [x] Sprint-Fortschritt als Balken (erledigt/geplant) statt Text
- [x] Auslastung je Person als Kapazitätsbalken mit Über-/Unterlast-Farbe
- [x] Farben nur via Design-Tokens; barrierearm (`progressbar`-Semantik)
- [x] `ProgressBar` unit-getestet (Clamping, max=0, Statusfarbe)
- [x] Lint/Typecheck/Test/Build grün; `tests/task-028/` mit Tests **und** `testkonzept.md`

### Umsetzung (Ist)
Neue `src/components/ui/ProgressBar.tsx`: Füllfarbe single-sourced über
`STATUS_STYLES.dot` (StatusBadge-Tokens), Spur `bg-secondary`, Wert/`max` geklemmt
auf `[0, max]`, `max <= 0` ⇒ leer; `role="progressbar"` + `aria-valuenow/min/max`
+ `aria-label`, Breiten-Transition mit `motion-reduce`. `SprintColumn` zeigt den
Fortschritt (`donePt/plannedPt`) als grünen Balken und je Person einen
Kapazitätsbalken (`assignedPt/capacityPt`, Farbe via `loadStatus`); Überlast zeigt
zusätzlich eine rote Prozentangabe. Berechnungen unverändert. Tests in
`tests/task-028/ProgressBar.test.tsx` (Clamping, `max=0`/negativ, Rundung,
Statusfarben, `aria-label`).

---

## TASK-027: Board-UI-Überarbeitung

**Abgeschlossen:** 2026-06-15 · **Meilenstein:** 5++ (Releases & Scrum-Tiefe) · **Branch:** `feat/task-027-board-ui-polish`

### Ziel
Das Kanban-Board optisch aufwerten: klarerer **Spaltenkopf** (Anzahl + PT-Summe),
ein eigener **Scrollbereich** je Spalte mit dezenter Scrollbar, ruhigerer
Karten-Look und ein Status-Akzent je Phase.

### Kontext
Bislang ist der Spalten-Count eine schlichte Pille, Spalten haben keinen eigenen
Scrollbereich (die ganze Seite scrollt) und die Karten wirken unruhig. `ScrollArea`
(`src/components/ui/scroll-area.tsx`) ist vorhanden.

### Betroffene Dateien
- `src/components/board/KanbanColumn.tsx` (Kopf, ScrollArea, Status-Akzent)
- `src/components/board/TaskCard.tsx` (Feinschliff Layout/Typografie)
- `src/lib/board.ts` (`sumEstimatePt`, `isWipExceeded`, `BOARD_WIP_LIMITS`)
- `src/app/(dashboard)/board/page.tsx` (Spalten teilen sich die Breite)
- `tests/task-027/`

### Technische Anforderungen
- Spaltenkopf: Titel + Count („n") als ruhige Pille **und** PT-Summe der Spalte;
  optionaler WIP-Hinweis (dezente Warnfarbe ab `BOARD_WIP_LIMITS` – via
  `<StatusBadge>`-Tokens, keine Ad-hoc-Farben).
- Spaltenkörper in `<ScrollArea>` mit sinnvoller Maximalhöhe → lange Spalten
  scrollen intern; Drag & Drop bleibt voll funktionsfähig (Droppable-Ref,
  Keyboard-Support).
- Status-Akzent je Spalte aus `BOARD_COLUMN_STATUS` (eine Quelle), farbiger
  Kopfstreifen – ausschließlich über Design-Tokens.
- Karten: konsistente Abstände, Priorität/Assignee/PT klar gruppiert.
- Spalten teilen sich die Viewport-Breite (`flex-1`/Min-Breite), Horizontal-Scroll
  nur als Fallback auf sehr schmalen Screens.

### Umsetzung / Entscheidungen
- **Grau-auf-grau-Fix:** `--muted` und `--muted-foreground` sind identisch
  (`#8b8b96`). `bg-muted` + `text-muted-foreground` ergab unsichtbare Chips.
  Lösung: ruhige Chips/Avatare über `bg-secondary` + lesbarer Text (kein Eingriff
  in die globalen Tokens).
- **Schmalfester Kopf:** Spaltentitel kürzt mit „…" (`truncate`) statt umzubrechen;
  PT-Pille nur bei > 0 PT.
- Reine Logik (`sumEstimatePt`, `isWipExceeded`) liegt in `src/lib/board.ts`,
  nicht in der Komponente.

### Akzeptanzkriterien
- [x] Spaltenkopf zeigt Anzahl **und** PT-Summe; Look ruhiger/ansprechender
- [x] Lange Spalten scrollen intern (dezente Scrollbar); Drag & Drop weiter funktionsfähig
- [x] Status-Akzent je Phase nur über `BOARD_COLUMN_STATUS`/Design-Tokens
- [x] Bestehende Board-E2E (Counter, Drag&Drop, Filter, View-Toggle) bleiben grün
- [x] Lint/Typecheck/Test/Build grün; `tests/task-027/` mit `testkonzept.md`

---

## TASK-026: Echte Sprint-Burndown

**Abgeschlossen:** 2026-06-15 · **Meilenstein:** 5++ (Releases & Scrum-Tiefe) · **Branch:** `feat/task-026-real-burndown`

### Ziel
Die bisher als „Beispiel" markierte Burndown durch eine **echte, datenbasierte
Burndown** für einen gewählten/aktiven Sprint ersetzen: Ideallinie vs.
verbleibende Personentage.

### Kontext
Setzt Sprint-Timeboxes (TASK-024) und Done-Status/Velocity (TASK-021) voraus. Für
eine über die Zeit verlaufende Ist-Linie fehlte bislang der **Erledigt-Zeitpunkt**;
der wird hier am Board-Task ergänzt.

### Betroffene Dateien
- `src/types/index.ts` (`BoardTask.doneAt?` – ISO-Zeitstempel; `BurndownPoint` entfernt)
- `src/store/useBoardStore.ts` (`doneAt` setzen/zurücksetzen via `stampDone`, Persist v2 → v3)
- `src/lib/burndown.ts` (neu: reine Burndown-Ableitung `sprintBurndown`)
- `src/components/dashboard/charts/SprintBurndownChart.tsx` (echte Daten, `subtitle`/`action`)
- `src/app/(dashboard)/page.tsx` (aktiver Sprint als Default + Auswahl)
- `src/data/dashboard.ts` (Demo-`burndown` entfernt)
- `tests/task-026/`

### Umsetzung (Ergebnis)
- `doneAt` wird beim Wechsel nach `done` gesetzt und beim Verlassen entfernt
  (idempotenter `stampDone`-Helfer in add/move/update). Reorder innerhalb `done`
  behält den Zeitstempel. Additive Persist-Migration (v2 → v3); Altbestand ohne
  `doneAt` wird als „bei Sprintstart erledigt" gewertet.
- Reiner Helfer `sprintBurndown(sprint, stories, boardTasks, today)` →
  `{ day, ideal, remaining }[]`: pro Tag der Timebox die Ideallinie (linear von
  `plannedPt` auf 0) und die Ist-Restlast (geplante PT minus bis einschließlich
  Tag erledigter PT, früheste `doneAt`-Story zählt, keine Doppelzählung). Tage
  > heute ohne Ist-Wert (`null`); leere Timebox → `[]`.
- Chart nutzt den aktiven Sprint (Default) bzw. die Auswahl (Dropdown); Empty-State,
  wenn kein Sprint mit Zeitraum existiert. Untertitel: Projekt · Sprint · Zeitraum.

### Akzeptanzkriterien
- [x] Task nach `done` ziehen setzt `doneAt`; zurück entfernt ihn → Reload-fest
- [x] Burndown zeigt Ideal- und Ist-Linie für den Sprint-Zeitraum korrekt
- [x] Keine Doppelzählung; leere/zukünftige Tage sauber behandelt
- [x] `sprintBurndown` unit-getestet; „Beispiel"-Markierung entfällt für echte Daten
- [x] Lint/Typecheck/Test/Build grün; `tests/task-026/` mit Tests **und** `testkonzept.md`

---

## TASK-025: Releases & automatische Sprint-Generierung

**Abgeschlossen:** 2026-06-15 · **Meilenstein:** 5++ (Releases & Scrum-Tiefe) · **Branch:** `feat/task-025-releases-auto-sprints`

### Ziel
Eine **Release-Entität** pro Projekt einführen (Name, Zeitraum, Sprint-Dauer) und
daraus **datierte Sprints automatisch generieren**. Beispiel: Release „Q3" über
ein Quartal, 2-wöchige Sprints → die Sprints werden automatisch angelegt.

### Kontext
Setzt Sprint-Timeboxes (TASK-024) voraus. Heute werden Sprints einzeln von Hand
angelegt. Releases bündeln einen Lieferzeitraum und seine Sprints. Reines lokales
Mock-Modell (Zustand + persist).

### Betroffene Dateien
- `src/types/index.ts` (`Release`; `PlannedSprint.releaseId?`)
- `src/store/useReleaseStore.ts` (neu, persist `pm-studio-releases`, CRUD)
- `src/lib/release.ts` (neu: reine `generateSprints`/`sprintWindows`)
- `src/lib/release-meta.ts` (neu: UI-Labels, `formatReleaseRange`)
- `src/app/(dashboard)/releases/page.tsx` (neu) + `src/components/release/*`
  (ReleaseDialog, ReleaseCard)
- `src/store/useSprintStore.ts` (`setReleaseSprints` idempotent, `detachRelease`)
- `src/lib/navigation.ts` (Eintrag „Releases" unter Delivery)
- `tests/task-025/`

### Datenmodell
```ts
type Release = {
  id: string;
  projectId: string;
  name: string;
  startDate: string;     // ISO YYYY-MM-DD
  endDate: string;
  sprintLengthWeeks: 1 | 2 | 3 | 4;
};
```

### Technische Anforderungen
- Reiner Helfer `generateSprints(release)` → `PlannedSprint[]`: füllt den Zeitraum
  lückenlos mit Sprints der gewählten Dauer (Namen „Sprint 1…n", Start/Ende je
  Fenster, `status: "planned"`, `releaseId`, fortlaufende `order`). Der letzte
  Sprint endet spätestens am Release-Ende (Restfenster zulässig). Deterministisch,
  unit-testbar (`sprintWindows` als reine Fenster-Berechnung extrahiert).
- Release anlegen → zugehörige Sprints im Sprint-Store erzeugen. Erneutes
  Generieren ist **idempotent über `releaseId`** (bestehende Release-Sprints
  ersetzen, nicht duplizieren); manuell angelegte Sprints (ohne `releaseId`)
  bleiben unberührt.
- Release löschen: zugehörige Sprints **entkoppeln** (`releaseId → undefined`,
  Sprints bleiben erhalten) – kein stiller Datenverlust.
- Release-Seite: Liste der Releases je Projekt mit Zeitraum, Sprint-Dauer, Anzahl
  generierter Sprints; Formular mit Validierung (Ende ≥ Start), Empty-State + CTA,
  SSR-sicher (`useHydrated`).

### Akzeptanzkriterien
- [x] Release anlegen (Zeitraum + Dauer) → datierte Sprints werden automatisch erzeugt
- [x] Generierte Sprints erscheinen in der Sprintplanung mit korrekten Daten
- [x] Re-Generieren dupliziert nicht (idempotent über `releaseId`); manuelle Sprints bleiben
- [x] Release bearbeiten/löschen; gelöschtes Release entkoppelt seine Sprints
- [x] Reload-fest; `generateSprints` unit-getestet (Fenster, Restfenster, Namen, Daten)
- [x] Lint/Typecheck/Test/Build grün; `tests/task-025/` mit Tests **und** `testkonzept.md`

### Erwartetes Ergebnis
Releases sind verwaltbar und erzeugen ihre Sprints automatisch – realistische,
zeitlich geplante Lieferung ohne manuelles Sprint-Anlegen.

### Dokumentation
`docs/frontend-plan.md` (Release-Store, Route `/releases`),
`tests/task-025/testkonzept.md`, `task-index.md`.

---

## TASK-024: Sprint-Timeboxes & aktiver Sprint

**Abgeschlossen:** 2026-06-15 · **Meilenstein:** 5++ (Releases & Scrum-Tiefe) · **Branch:** `feat/task-024-sprint-timeboxes`

### Ziel
Sprints erhalten **Start- und Enddatum** (Timebox). Daraus wird der **aktive
Sprint** abgeleitet und angezeigt. Fundament für Releases/Auto-Sprints (TASK-025)
und eine echte Burndown (TASK-026).

### Umsetzung
- `PlannedSprint` um optionale `startDate`/`endDate` (ISO `YYYY-MM-DD`) erweitert;
  bestehende Sprints ohne Daten bleiben gültig (keine Migration nötig).
- `SprintDialog`: zwei native `<input type="date">` (Start/Ende) mit gegenseitigen
  `min`/`max`-Grenzen und Validierung „Ende ≥ Start" (Speichern sonst deaktiviert,
  Hinweistext). Werte fließen über das bestehende `...values`-Spread in
  `addSprint`/`updateSprint`.
- Reine Helfer in `src/lib/sprint.ts`: `isActiveSprint(sprint, today)`
  (start ≤ today ≤ end, lexikografischer ISO-Vergleich; ohne vollständige Timebox
  nie aktiv; unabhängig vom gesetzten Status) und `formatSprintRange(sprint)`
  (kompakt `DD.MM.–DD.MM.`, einseitig „ab …"/„bis …", sonst „").
- `SprintColumn` zeigt den Zeitraum und ein zusätzliches `<StatusBadge
  status="running" label="Aktiv">`, wenn der Sprint laut Timebox läuft.
- SSR-sicher: `today` wird in `/sprints` erst **nach** dem Hydration-Gate
  (`useHydrated`) via `toLocaleDateString("sv-SE")` bestimmt → kein Mismatch.

### Akzeptanzkriterien
- [x] Start/Ende anlegen/bearbeiten → Reload → erhalten; Ende ≥ Start validiert
- [x] Aktiver Sprint wird korrekt aus dem Datum abgeleitet und hervorgehoben
- [x] Zeitraum wird im Sprintkopf angezeigt; Sprints ohne Daten funktionieren weiter
- [x] Reine Helfer unit-getestet (`tests/task-024/`); SSR-sicher (kein Mismatch)
- [x] Lint/Typecheck/Test/Build grün; Testkonzept vorhanden

### Dokumentation
`docs/frontend-plan.md`, `tests/task-024/testkonzept.md`, `task-index.md`.

---

## TASK-023: Board-Ansichtswechsel – Kanban & Scrum-Liste

**Abgeschlossen:** 2026-06-15 · **Meilenstein:** 5+ (Team & Delivery-Tiefe) · **Branch:** `feat/task-023-board-view-toggle`

### Ziel
Auf dem Board zwischen dem bestehenden **Kanban-Board** und einer klassischen
**Scrum-Listenansicht** (Work-Item-Grid) umschaltbar machen. Design-Referenz:
**OpenText/Micro Focus ALM Octane** (Work-Item-Grid).

### Kontext
Setzt das Kanban-Board (TASK-008) voraus; ideal nach den Filtern (TASK-022) und
der Personen-Zuweisung (TASK-020), damit beide Ansichten dieselben Daten/Filter
nutzen.

### Betroffene Dateien
- `src/components/board/BoardListView.tsx` (neu: TanStack-Table-Grid)
- `src/components/board/BoardViewToggle.tsx` (neu: Kanban | Liste)
- `src/app/(dashboard)/board/page.tsx` (Ansicht umschalten, gemeinsamer Datenstand)
- `src/store/useBoardStore.ts` oder lokaler Persist für die gewählte Ansicht
- `tests/task-023/`

### Technische Anforderungen
- **Listenansicht (Octane-Stil):** sortierbare Tabelle (TanStack Table, wie
  IdeaTable/RiskTable) mit Spalten: ID/Kurz, Titel, Status/Spalte (`<StatusBadge>`),
  Priorität, Schätzung (PT), Assignee (Avatar/Name), Sprint, Projekt.
  Zeilenklick öffnet denselben `TaskDialog` wie das Board.
- **Umschalter** (Segmented Control „Kanban | Liste") in der Board-Kopfzeile; die
  gewählte Ansicht wird persistiert (reload-fest).
- Beide Ansichten teilen Projektfilter/Filter (TASK-022) und Datenquelle.
- Status-Reihenfolge/Labels aus `BOARD_COLUMNS` (eine Quelle).
- Empty-/Loading-States in beiden Ansichten; SSR-sicher.

### Akzeptanzkriterien
- [x] Umschalten Kanban ↔ Liste; Auswahl überlebt Reload
- [x] Listenansicht zeigt alle relevanten Spalten, ist sortierbar, Zeilenklick öffnet den TaskDialog
- [x] Statusfarben nur via `<StatusBadge>`; Spalten-/Statusquelle = `BOARD_COLUMNS`
- [x] Filter (sofern TASK-022 vorhanden) wirken in beiden Ansichten gleich
- [x] Empty-States in beiden Ansichten; SSR-sicher (kein Hydration-Mismatch)
- [x] Lint/Typecheck/Test/Build grün; `tests/task-023/` mit Tests **und** `testkonzept.md`

### Erwartetes Ergebnis
Nutzer wählen pro Bedarf zwischen visuellem Kanban und tabellarischer
Scrum-Liste – mit denselben Daten und Filtern.

### Dokumentation
`docs/frontend-plan.md`, `tests/task-023/testkonzept.md`, `task-index.md`.

---

## TASK-022: Filter für Board & Sprintansicht

**Abgeschlossen:** 2026-06-15 · **Meilenstein:** 5+ (Team & Delivery-Tiefe) · **Branch:** `feat/task-022-board-sprint-filters`

### Ziel
Board und Sprintansicht filterbar machen – u. a. nach **Sprint** und **Person** –
und sinnvolle weitere Filterkriterien ergänzen.

### Kontext
Setzt Personen-Zuweisung (TASK-020) und Sprints (TASK-017) voraus. Das Board hat
bislang nur einen Projektfilter (TASK-008).

### Betroffene Dateien
- `src/lib/board-filters.ts` (neu: reine Filterlogik)
- `src/components/common/FilterBar.tsx` (neu, wiederverwendbar)
- `src/app/(dashboard)/board/page.tsx`, `src/app/(dashboard)/sprints/page.tsx`
- `tests/task-022/`

### Filterkriterien
- **Board:** Projekt (vorhanden), **Sprint** (inkl. „ohne Sprint"), **Person**
  (Assignee, inkl. „nicht zugewiesen"), **Priorität**, **Status/Spalte**.
- **Sprintansicht:** **Person**, **Status** (Sprint planned/active/done),
  **Done/Offen** der Items.
- Mehrere Filter kombinierbar (UND-Verknüpfung); aktive Filter sichtbar,
  „Zurücksetzen"-Aktion.

### Technische Anforderungen
- Reine Filterfunktionen in `src/lib/board-filters.ts` (Input: Items + Filter-
  state → gefilterte Items), unit-testbar.
- `FilterBar` als generische, typsichere Leiste (Select/Toggle je Kriterium);
  Filterstate lokal (`useState`) je Seite.
- Sprint-Filter braucht die Story→Sprint-Zuordnung; Person-Filter den Assignee.
- Empty-State, wenn Filter alles ausblendet (mit „Filter zurücksetzen").
- Performance über `useMemo`.

### Akzeptanzkriterien
- [x] Board nach Sprint filtern → nur Tasks von Stories dieses Sprints sichtbar
- [x] Board nach Person filtern → nur deren Tasks; „nicht zugewiesen" funktioniert
- [x] Kombinierte Filter (z. B. Sprint + Priorität) wirken gemeinsam (UND)
- [x] Sprintansicht nach Person/Status/Done filterbar
- [x] „Zurücksetzen" stellt vollständige Ansicht wieder her; Empty-State bei leerem Ergebnis
- [x] Lint/Typecheck/Test/Build grün; `tests/task-022/` mit Tests **und** `testkonzept.md`

### Erwartetes Ergebnis
Board und Sprintansicht lassen sich gezielt nach den relevanten Delivery-Kriterien
einschränken.

### Dokumentation
`docs/frontend-plan.md`, `tests/task-022/testkonzept.md`, `task-index.md`.

---

## TASK-020: Personen-Zuweisung & Auslastung

**Abgeschlossen:** 2026-06-15 · **Meilenstein:** 5+ (Team & Delivery-Tiefe) · **Branch:** `feat/task-020-assignment-capacity`

### Ziel
Personen (aus TASK-019) im **Backlog**, auf dem **Board** und in der
**Sprintplanung** zuweisen und die **Auslastung** je Person sichtbar machen
(zugewiesene Personentage vs. Kapazität).

### Kontext
Setzt TASK-019 (Personen mit Kapazität) und TASK-017 (Sprintplanung) voraus. Der
bisherige `assignee`-String auf `BoardTask` wird durch eine echte Personen-Referenz
ersetzt.

### Betroffene Dateien
- `src/types/index.ts` (`BoardTask.assigneeId` statt `assignee`)
- `src/store/useBoardStore.ts` (Zuweisung setzen)
- `src/components/board/TaskCard.tsx` / `TaskDialog.tsx` (Assignee-Auswahl, Avatar)
- `src/components/sprint/*` + `src/app/(dashboard)/sprints/page.tsx`
  (Auslastungsanzeige je Person)
- `src/lib/capacity.ts` (neu: Auslastung berechnen)
- `tests/task-020/`

### Technische Anforderungen
- Assignee-Auswahl (Select über `usePeopleStore.persons`) im TaskDialog und als
  Avatar/Initialen auf der Karte; „Nicht zugewiesen" als Default.
- Story/Task-Schätzung (`estimate_pt`) fließt in die Auslastung der zugewiesenen
  Person ein.
- **Sprint-Auslastung:** pro Person die Summe der Personentage der ihr im Sprint
  zugewiesenen Items vs. ihrer `capacityPtPerSprint`; Anzeige als Balken/Badge mit
  Über-/Unterlast (Farbe via `<StatusBadge>`: success = im Rahmen, warning = nahe
  Grenze, danger = überlastet).
- Reine Berechnung in `src/lib/capacity.ts` (testbar).
- SSR-sicher, reload-fest.

### Akzeptanzkriterien
- [x] Person einem Board-Task/Story zuweisen → Avatar/Name sichtbar → Reload → erhalten
- [x] Sprintplanung zeigt je Person Auslastung (zugewiesene PT vs. Kapazität) mit Über-/Unterlast
- [x] Entfernen/Wechseln der Zuweisung aktualisiert die Auslastung korrekt
- [x] Migration: bestehende `assignee`-Strings brechen nicht (sauberer Default)
- [x] Lint/Typecheck/Test/Build grün; `tests/task-020/` mit Tests **und** `testkonzept.md`

### Erwartetes Ergebnis
Zuweisung und Auslastung sind in Backlog/Board/Sprint durchgängig sichtbar und
helfen bei realistischer Sprintplanung.

### Dokumentation
`docs/frontend-plan.md`, `tests/task-020/testkonzept.md`, `task-index.md`.

---

## TASK-021: Done-Status in der Sprintplanung & echte Velocity

**Abgeschlossen:** 2026-06-15 · **Meilenstein:** 5+ (Team & Delivery-Tiefe) · **Branch:** `feat/task-021-sprint-done-velocity`

### Ziel
In der Sprintplanung sichtbar machen, welche Backlog-Items **fertig** sind, und
die **Velocity** im Dashboard auf **tatsächlich erledigte** Personentage umstellen
(statt nur geplanter).

### Kontext
Eine Story ist „fertig", wenn ihr zugehöriger Board-Task in der Spalte `done`
liegt (`BoardTask.storyId` → `UserStory.id`). Diese Verknüpfung existiert bereits
(TASK-008). Bisher zählt `selectVelocity` (TASK-011) nur **geplante** Punkte.

### Betroffene Dateien
- `src/lib/sprint-progress.ts` (neu: Story-Done-Status, Sprint-Fortschritt)
- `src/components/sprint/*` (Done-Indikator je Story, Sprint-Fortschritt PT erledigt/geplant)
- `src/lib/dashboard-selectors.ts` (`selectVelocity` → erledigte Punkte; ggf.
  geplant vs. erledigt)
- `tests/task-021/`

### Technische Anforderungen
- Helfer `isStoryDone(storyId, boardTasks)` und `sprintProgress(sprint, stories,
  boardTasks)` → `{ donePt, plannedPt, doneCount, total }` (rein, testbar).
- Sprint-Spalte zeigt „erledigt X / geplant Y PT" und je Story einen Done-Haken/
  -Badge (`<StatusBadge status="success">`), wenn der Board-Task `done` ist.
- Dashboard-Velocity nutzt **erledigte** PT je Sprint; Chart-Titel/Empty bleiben
  konsistent. Optional zusätzlich geplante Linie – mindestens aber erledigt.
- Cross-Store-Ableitung (Sprint-, Project-/Backlog-, Board-Store) ohne Persist-
  Änderungen.

### Akzeptanzkriterien
- [x] Board-Task einer zugeordneten Story auf `done` ziehen → Story in der Sprintplanung als „fertig" markiert
- [x] Sprint zeigt erledigte vs. geplante Personentage korrekt
- [x] Dashboard-Velocity spiegelt erledigte PT je Sprint (verifizierbar in Tests)
- [x] Keine Story doppelt gezählt; leere Zustände korrekt (0 / Empty)
- [x] Lint/Typecheck/Test/Build grün; `tests/task-021/` mit Tests **und** `testkonzept.md`

### Erwartetes Ergebnis
Fertigstellung ist in der Sprintplanung sichtbar und die Dashboard-Velocity ist
aussagekräftig (erledigte Leistung).

### Dokumentation
`docs/frontend-plan.md`, `tests/task-021/testkonzept.md`, `task-index.md`.

---

## TASK-019: Team & Personen (Stammdaten)

**Abgeschlossen:** 2026-06-15 · **Meilenstein:** 5+ (Team & Delivery-Tiefe) · **Branch:** `feat/task-019-team-people`

### Ziel
Eine Team-Seite einführen, auf der **Personen** und **Teams** verwaltet werden.
Personen sind eigenständige Domänen-Entitäten mit **Kapazität** (Personentage je
Sprint) – die Grundlage für Zuweisung (TASK-020) und Auslastung in der
Sprintplanung.

### Kontext
Bisher gibt es nur einen `assignee`-Platzhalter (String) auf Board-Tasks.
Personen/Teams sollen first-class werden und in Backlog- und Sprint-Zuweisung
stark berücksichtigt werden. Reines lokales Mock-Modell (Zustand + persist), kein
Backend.

### Betroffene Dateien
- `src/types/index.ts` (`Person`, `Team`)
- `src/store/usePeopleStore.ts` (neu, persist `pm-studio-people`)
- `src/app/(dashboard)/team/page.tsx` (neu)
- `src/components/team/*` (PersonForm/-Dialog, PersonCard, TeamForm/-Dialog, TeamCard)
- `src/lib/navigation.ts` (Eintrag „Team")
- `tests/task-019/` (Store-Tests + `testkonzept.md`)

### Datenmodell
```ts
type Person = {
  id: string;
  name: string;
  role: string;            // z. B. „Frontend", „PO"
  email?: string;
  /** Kapazität in Personentagen pro Sprint. */
  capacityPtPerSprint: number;
  teamId?: string;
};
type Team = { id: string; name: string; description?: string };
```
Initialen werden aus `name` abgeleitet (Avatar-Platzhalter), kein Upload.

### Technische Anforderungen
- `usePeopleStore` (persist): `persons[]`, `teams[]` mit CRUD
  (`addPerson/updatePerson/removePerson`, `addTeam/updateTeam/removeTeam`).
  Löschen eines Teams setzt `teamId` betroffener Personen auf `undefined`.
- Team-Seite: zwei Bereiche „Personen" und „Teams"; Personen zeigen Rolle, Team,
  Kapazität (PT/Sprint), Initialen-Avatar.
- Formulare mit `react-hook-form` + `zod` (Pflichtfelder Name/Rolle, Kapazität
  ≥ 0), Empty-States mit CTA, SSR-sicher (`useHydrated`).
- Navigation: „Team" unter dem passenden Bereich (z. B. neben „Agents").

### Akzeptanzkriterien
- [x] Person anlegen/bearbeiten/löschen (Name, Rolle, Kapazität, Team) → Reload → erhalten
- [x] Team anlegen/bearbeiten/löschen; gelöschtes Team entkoppelt seine Personen
- [x] Kapazität validiert (Zahl ≥ 0); Pflichtfelder greifen
- [x] Empty-States mit CTA; SSR-sicher (kein Hydration-Mismatch)
- [x] Status/Farben nur über bestehende Tokens/Komponenten
- [x] Lint/Typecheck/Test/Build grün; `tests/task-019/` mit Tests **und** `testkonzept.md`

### Erwartetes Ergebnis
Personen/Teams sind als Stammdaten gepflegt und stehen für Zuweisung und
Auslastungsberechnung bereit.

### Dokumentation
`docs/frontend-plan.md` (People-Store, Route `/team`), `tests/task-019/testkonzept.md`,
`task-index.md`.

---

## TASK-017: Sprintübersicht & Sprint-Planung

**Abgeschlossen:** 2026-06-15 · **Meilenstein:** 5 (Nacharbeit) · **Branch:** `feat/task-017-sprint-planning`

### Ziel
Die `/sprints`-Seite vom Platzhalter zu einer echten Sprintübersicht mit
interaktiver Planung ausbauen: Sprints pro Projekt anlegen/umbenennen/Status
setzen und Backlog-User-Stories einem Sprint zuordnen. Alles lokal persistiert.

### Kontext
M5 (Roadmap) nennt explizit „Sprintübersicht" – bislang fehlte sie: `/sprints`
war ein Stub, Sprints existierten nur als read-only `sprint_suggestions` aus dem
Mock-Scrum-Agenten (Projektdetail → Backlog). Dieser Task schloss die Lücke und
baut auf dem dnd-kit-/Store-Pattern von TASK-008 (Board) auf.

### Abhängigkeit
TASK-007 (Backlog mit User Stories), TASK-008 (dnd-kit-Pattern, `useBoardStore`
als Vorlage).

### Betroffene Dateien
- `src/types/index.ts` (Typen `SprintStatus`, `PlannedSprint`; ungenutzten
  `Sprint`-Typ ersetzt)
- `src/store/useSprintStore.ts` (neu, persist)
- `src/lib/sprint.ts` (Status-Metadaten)
- `src/app/(dashboard)/sprints/page.tsx` (Übersicht + Planung)
- `src/components/sprint/*` (SprintColumn, SprintStoryCard, SprintDialog)
- `tests/task-017/`, `e2e/sprints.spec.ts`

### Technische Anforderungen
- `useSprintStore` (persist, `pm-studio-sprints`): `sprints: PlannedSprint[]`
  mit `addSprint`, `updateSprint`, `removeSprint`, `assignStory(storyId,
  sprintId | null)`, `importSuggestions`; eine Story ist höchstens einem Sprint
  zugeordnet.
- Projektfilter (Select) wie im Board; Planung bezieht sich auf das gewählte
  Projekt und dessen Backlog-Stories.
- Spalten: „Nicht zugeordnet" + je eine Spalte pro Sprint; Stories per Drag&Drop
  (dnd-kit, Tastatur-Support) verschieben → Zuordnung persistiert.
- Sprint anlegen (Name, Ziel), umbenennen, Status setzen (`planned` / `active` /
  `done`, Anzeige via `<StatusBadge>`), löschen (Stories fallen zurück in
  „Nicht zugeordnet").
- „Aus Vorschlägen übernehmen" – erzeugt Sprints aus den `sprint_suggestions`
  des Projekts (keine Duplikate).
- Pro Sprint: Summe der Story-Points anzeigen.
- SSR-sicher über `useHydrated`; Empty-States mit sinnvollem CTA.

### Akzeptanzkriterien (alle erfüllt)
- [x] Sprint anlegen → Story per Drag&Drop zuordnen → Reload → Zuordnung erhalten
- [x] Projektfilter wirkt; nur Stories/Sprints des gewählten Projekts sichtbar
- [x] Sprint umbenennen/Status/löschen funktioniert; gelöschter Sprint gibt
      Stories an „Nicht zugeordnet" zurück
- [x] Story ist nie in zwei Sprints gleichzeitig
- [x] Empty-States mit CTA; SSR-sicher (kein Hydration-Mismatch)
- [x] Status-Farben nur via `<StatusBadge>`; Lint/Typecheck/Test/Build grün;
      `tests/task-017/` mit Tests **und** `testkonzept.md`

### Erwartetes Ergebnis
`/sprints` ist eine nutzbare Planungsansicht; Sprints sind echte, persistierte
Entitäten (Basis für TASK-018 Retro/Review und genauere Dashboard-Metriken).

---

## TASK-011: Dashboard – Live-Daten

**Meilenstein:** nach M5 (M5+) · **Branch:** `feat/task-011-dashboard-live-data`

### Ziel
Das Dashboard von statischen Dummy-Daten (`src/data/dashboard.ts`) auf die echten lokalen Store-Daten umstellen: Metrik-Karten, Aktivitäts-Feed, Status-Grid, Projektfortschritt und Charts lesen aus `useProjectStore`/`useAgentStore` (Ideen, Pipeline-Läufe, Artefakte, später Board/Sprints).

### Kontext
Das M2-Dashboard war bewusst Dummy (nur „SaaS-Look"). Erst nach M5 existieren echte, zählbare Entitäten (Projekte, Backlog/Tasks, Sprints, Risiken) **und** ein UI-Trigger, der die Pipeline startet (TASK-007/M5) und damit `useAgentStore.runs` füllt. Dieser Task verdrahtet das **gesamte** Dashboard – inklusive **Aktivitäts-Feed** (`useAgentStore.runs`) – mit den echten lokalen Store-Daten und schließt die bewusst benannte Lücke „kein Task verdrahtet das Dashboard mit echten Daten".

> Wichtig: „Live-Daten" heißt hier **lokale Store-Daten** (auch aus der Mock-Pipeline), nicht „echte KI". Echte KI kommt mit M6 und tauscht nur die Implementierung hinter `getAgentService()` – ohne weitere Dashboard-Änderung.

### Abhängigkeit
Setzt M5 voraus (insb. den Pipeline-Trigger aus TASK-007 sowie Board/Sprints), damit echte Läufe, Aufgaben und Sprints existieren, die das Dashboard zählen/anzeigen kann.

### Betroffene Dateien
- `src/app/(dashboard)/page.tsx` (Datenquelle: Stores statt `src/data/dashboard.ts`)
- `src/lib/dashboard-selectors.ts` (neu: leitet Metriken/Serien aus den Stores ab)
- `src/components/dashboard/*` (Props bleiben gleich, Daten kommen aus Selektoren)
- `src/components/dashboard/LiveActivityFeed.tsx` (neu: Client-Wrapper, liest `useAgentStore.runs`)
- `src/store/useProjectStore.ts`, `src/store/useAgentStore.ts` (ggf. Selektoren ergänzen)
- `src/data/dashboard.ts` (nur noch Seed/Fallback oder entfernen)

### Technische Anforderungen
- Metriken aus Stores ableiten: aktive Projekte (Ideen-Count), offene Aufgaben (Backlog-Stories), offene Risiken (RiskRegister), laufende Sprints (M5-Sprints).
- Aktivitäts-Feed: `useAgentStore.runs` (real).
- Projektfortschritt/Charts: aus echten Artefakten/Backlog ableiten, wo sinnvoll; verbleibende Demo-Teile klar als „Beispiel" kennzeichnen.
- SSR-sicher über `useHydrated` (localStorage-Daten erst nach Hydration), kein Hydration-Mismatch.
- Reload-fest: persistierte Daten erscheinen nach Reload wieder.

### Akzeptanzkriterien
- [ ] Alle Dashboard-Bereiche lesen aus den Stores – keine hartkodierten Dummy-Arrays mehr im JSX
- [ ] **Empty-States für JEDEN Bereich**, wenn keine Daten vorhanden sind (keine Ideen/Läufe/Sprints …): aussagekräftiger Platzhalter mit sinnvollem CTA (z. B. „Erste Idee anlegen", „Pipeline starten")
- [ ] SSR-sicher (`useHydrated`), kein Hydration-Mismatch in der Konsole
- [ ] Reload-fest (persistierte Ideen/Artefakte erscheinen wieder)
- [ ] Keine Status-Farbe ohne `<StatusBadge>`; Chart-Farben nur aus Design-Tokens
- [ ] Lint/Typecheck/Test/Build grün; `tests/task-011/` mit Tests **und** `testkonzept.md`

### Testschritte
1. Frischer Zustand (localStorage leer) → Dashboard zeigt **überall Empty-States** mit CTAs.
2. Idee anlegen + Pipeline starten → Metriken/Feed/Charts füllen sich erkennbar.
3. Reload → Daten bleiben erhalten.
4. `npm run test`.

### Erwartetes Ergebnis
Das Dashboard spiegelt den tatsächlichen lokalen Projektzustand wider; der Wechsel auf echte KI (M6) erfordert keine weitere Dashboard-Änderung.

### Dokumentation
`docs/frontend-plan.md` (Datenfluss Stores → Dashboard), `tests/task-011/testkonzept.md`, `task-index.md`.

---

## TASK-009: Mock-Agenten-Outputs

**Meilenstein:** 3 · **Branch:** `feat/task-009-dummy-agent-output`

### Ziel
Deterministische Mock-Implementierung der Pipeline hinter einem `AgentService`-Interface: aus einer ProjectIdea entstehen Draft, Requirements, Backlog und Risiken als typisierte Objekte.

### Kontext
Schlüssel-Task für die Architektur: UI und Stores sprechen nur mit dem Interface. In M6 wird die Mock-Implementierung durch einen API-Client ersetzt – ohne UI-Änderung.

### Betroffene Dateien
- `src/lib/agent-service.ts` (Interface `AgentService`: `runDraft(idea)`, `runRequirements(draft)`, `runScrum(reqs)`, `runRisk(...)`, `runPipeline(idea)`)
- `src/lib/mock-agent-service.ts` (Implementierung)
- `src/data/mock-templates.ts` (Bausteine, leicht variiert je nach Idee-Feldern)
- `src/store/useAgentStore.ts` (Läufe registrieren), `useProjectStore.ts` (Artefakte ablegen)

### Technische Anforderungen
- Outputs entsprechen exakt den Schemas aus docs/agent-system.md
- Mocks reagieren erkennbar auf Input (Projektname/Features fließen in Draft und Stories ein)
- Künstliche Latenz (1–2 s) + Statusmeldungen, damit UI-Verhalten realistisch ist
- `runPipeline` führt Agenten sequenziell aus und legt je Schritt einen AgentRun an
- Unit-Tests: jeder Mock liefert schema-konforme Struktur (≥3 Epics, jede Story hat ≥2 AKs, ≥4 Risiken)

### Akzeptanzkriterien
- [ ] `runPipeline(idea)` erzeugt vollständige, typisierte Artefakte + Lauf-Historie
- [ ] Kein UI-Code importiert die Mock-Implementierung direkt (nur das Interface)
- [ ] Unit-Tests grün; alle Checks grün

### Testschritte
1. Idee anlegen → Pipeline (Simulation) → Artefakte im Store prüfen (DevTools)
2. `npm run test`
3. Zwei unterschiedliche Ideen → erkennbar unterschiedliche Outputs

### Erwartetes Ergebnis
Saubere Service-Schicht; der Wechsel auf echte KI ist ein reiner Implementierungstausch.

### Dokumentation
docs/agent-system.md: Hinweis auf Interface; task-index.md.

---

## TASK-008: Kanban-Board

**Meilenstein:** 5 · **Branch:** `feat/task-008-kanban-board`

### Ziel
Kanban-Board mit Spalten Backlog / To Do / In Progress / Review / Testing / Done, Drag&Drop und Persistenz; Tasks aus User Stories erzeugbar.

### Kontext
Vervollständigt den PM-Kern. Stories aus TASK-007 sollen per Aktion „In Board übernehmen" zu Tasks werden.

### Betroffene Dateien
- deps: `@dnd-kit/core`, `@dnd-kit/sortable`
- `src/store/useBoardStore.ts` (persist)
- `src/components/board/KanbanColumn.tsx`, `TaskCard.tsx`, `TaskDialog.tsx`
- `src/app/(dashboard)/board/page.tsx`
- `src/components/project/BacklogView.tsx` (Button „In Board übernehmen")

### Technische Anforderungen
- TaskCard: Titel, Projekt, Story-Referenz, Schätzung, Priorität-Badge, Assignee-Platzhalter
- Drag&Drop zwischen Spalten und Sortierung innerhalb (dnd-kit), Tastatur-Support von dnd-kit nutzen
- Projektfilter (Select) über dem Board
- TaskDialog: Details ansehen/bearbeiten (Titel, Beschreibung, Spalte, Priorität)
- Spalten-Zähler im Header

### Akzeptanzkriterien
- [x] Task per Drag&Drop verschieben → Reload → Position/Spalte erhalten
- [x] Story → „In Board übernehmen" erzeugt Task in Backlog (keine Duplikate)
- [x] Projektfilter wirkt auf alle Spalten
- [x] Playwright-Test für Drag&Drop-Persistenz; alle Checks grün

### Testschritte
1. Mehrere Tasks erzeugen und über alle Spalten ziehen
2. Reload → Zustand identisch
3. Filter setzen → nur gefilterte Tasks sichtbar

### Erwartetes Ergebnis
Vollwertiges Board; MVP (M1–M5) damit abgeschlossen → Tag `v0.5.0`.

### Dokumentation
task-index.md; README-Screenshot optional aktualisieren.

---

## TASK-007b: Projektdetailseite – Redesign

**Meilenstein:** 5 · **Branch:** `feat/task-007b-project-detail-redesign`

### Ziel
Visuelles Redesign der Projektdetailseite (TASK-007) konsequent nach `docs/design-system.md` – **ohne Änderung der Funktionslogik** (Pipeline, Stores, Artefakt-Schemas bleiben unverändert). Klarere Informationsarchitektur: kompakter Header, immer sichtbarer Pipeline-Stepper, horizontale Tabs mit neuem Übersicht- und Idee-Tab.

### Kontext
TASK-007 lieferte Funktion + erste UI. Dieser Task hebt die Seite auf SaaS-Niveau (Linear/Vercel-Reduktion, Jira-Informationsarchitektur). Datenquellen bleiben `useProjectStore` (Idee, Artefakte) und `useAgentStore` (Läufe). `runPipelineForIdea` und die Artefakt-Typen werden **nicht** geändert.

### Betroffene Dateien
- `src/components/project/ProjectDetail.tsx` (Layout/Header/Tabs neu)
- `src/components/project/PipelineStepper.tsx` (neu)
- `src/components/project/OverviewTab.tsx` (neu)
- `src/components/project/IdeaTab.tsx` (neu)
- `src/components/project/DraftView.tsx` (Phasen-Fix, Kartenhöhen/-paddings)
- ggf. `src/lib/` Helper für die Schritt-/Status-Ableitung (`pipeline-steps.ts`)
- `tests/task-007b/` (Tests + `testkonzept.md`)

### Technische Anforderungen

#### Header (kompakt)
- Breadcrumb „← Projekte" als dezenter **Ghost-Link** (klein, muted).
- **Eine Zeile:** links Projekttitel + Status-Badge („Idee") + Vorgehen-Badge; rechts „Pipeline ausführen"-Button.
- Darunter **Metadaten-Zeile** (muted, 13px): Zeitraum · Budget · Teamgröße · erstellt am (nur vorhandene Felder, mit „·" getrennt).
- **Beschreibung einklappbar:** erste Zeile sichtbar (line-clamp), Toggle „Mehr anzeigen"/„Weniger" (Client-State, **nicht persistiert**).

#### Pipeline-Stepper (immer sichtbar, unter dem Header)
- Horizontale Schritte: **Draft → Requirements → Scrum → PO → Risk → Review**.
- Status je Agent: **done** = success-Badge mit Check · **running** = primary mit Pulse · **ausstehend** = outline.
- Datenquelle: `useAgentStore`-Läufe des Projekts (Mapping Agentname → Schritt).
- Klick auf einen **done**-Schritt wechselt zum zugehörigen Tab (Draft→Entwurf, Requirements→Requirements, Scrum→Backlog, Risk→Risiken; PO/Review ohne eigenen Tab → Übersicht).
- Im **leeren Zustand** ersetzt der Stepper die bisherige Empty-State-Karte als primärer Ort der Pipeline-Info.

#### Tabs
- **Horizontal** direkt unter dem Stepper (shadcn Tabs), kein vertikales Layout, kein linker Leerraum.
- Reihenfolge: **Übersicht | Idee | Entwurf | Requirements | Backlog | Risiken**.
- Inhalt **max-width 1200px, zentriert**.

#### Übersicht-Tab (Default)
- Grid aus 4 Karten: **MVP-Kurzfassung** (aus Draft), **Top-3-Risiken** nach Priorität, **Backlog-Kennzahlen** (Epics/Stories/Σ PT), **letzte Agentenläufe** des Projekts.
- Jede Karte **verlinkt auf ihren Tab**.
- Ohne Artefakte: **ein** Empty State mit kurzer Erklärung, was die Pipeline erzeugt, + CTA (der Header-Button bleibt die einzige weitere Aktion).

#### Idee-Tab (Position 2, read-only)
- Alle Felder der eingegebenen Projektidee: Problem, Zielgruppe, gewünschter Nutzen als **Textkarten**; gewünschte Features als **Liste**; technische Einschränkungen als **Badges**; Vorgehen/Zeitraum/Budget/Teamgröße als **Metadaten-Block**.
- Datenquelle: `useProjectStore.ideas`.
- Hinweis: Dieser Tab ist der spätere Ort für „Idee bearbeiten + Pipeline erneut ausführen" – **noch nicht umsetzen**.

#### Fixes
- Entwurf-Tab: **Phasen** – Abstand zwischen Phasenname und Dauer, Dauer als **muted Badge rechtsbündig**.
- Einheitliche **Kartenhöhen/-paddings** im 2-Spalten-Grid der Tabs.

### Akzeptanzkriterien
- [ ] **Übersicht** ist der Default-Tab; Reihenfolge Übersicht | Idee | Entwurf | Requirements | Backlog | Risiken
- [ ] **Stepper** spiegelt die Läufe korrekt: leer (alle outline) / teilweise / komplett (alle done); running pulsiert
- [ ] Klick auf done-Schritt wechselt zum richtigen Tab
- [ ] Beschreibung klappt auf/zu (nicht persistiert)
- [ ] Idee-Tab zeigt alle Felder read-only aus `useProjectStore.ideas`
- [ ] Übersicht-Karten verlinken auf ihre Tabs; sinnvoller Empty State ohne Artefakte
- [ ] **Keine Funktionslogik-Änderung** (Pipeline/Stores/Schemas unverändert)
- [ ] Farben nur aus Design-Tokens; Status/Prioritäten nur über `<StatusBadge>`
- [ ] Responsive 1440 / 1024 / 768 ohne Overflow
- [ ] Lint/Typecheck/Test/Build grün; `tests/task-007b/` mit Tests **und** `testkonzept.md` (inkl. **Component-Test für den Stepper-Status-Mapping**)
- [ ] **Visuelle Abnahme durch den Nutzer vor dem Merge** (explizites Kriterium)

### Testschritte
1. Projekt ohne Läufe → Stepper alle ausstehend, Übersicht zeigt Empty State.
2. Pipeline ausführen → Stepper füllt sich (running→done), Tabs gefüllt, Übersicht-Karten zeigen Kennzahlen.
3. Klick auf done-Schritt → korrekter Tab. Beschreibung auf-/zuklappen. Idee-Tab prüfen.
4. Responsive 1440/1024/768. `npm run test`.

### Erwartetes Ergebnis
Eine aufgeräumte, informationsdichte Detailseite nach Design-System – gleiche Funktion, deutlich bessere UX.

### Dokumentation
`tests/task-007b/testkonzept.md`; `task-index.md`.

---

## TASK-007: Projektdetailseite

**Meilenstein:** 5 · **Branch:** `feat/task-007-project-detail-page`

### Ziel
Detailseite je Projekt mit Tabs: Entwurf, Requirements, Backlog (Epics/Stories), Risiken – gefüllt aus Mock-Agenten-Outputs (TASK-009).

### Kontext
Hier laufen alle Artefakte der Pipeline zusammen; die Struktur entspricht exakt den Output-Schemas aus docs/agent-system.md.

### Betroffene Dateien
- `src/app/(dashboard)/projects/[id]/page.tsx`
- `src/components/project/DraftView.tsx`, `RequirementsView.tsx`, `BacklogView.tsx`, `RiskTable.tsx`
- `src/types/index.ts` (ProjectDraft, Requirement, Epic, UserStory, Risk finalisieren)
- `src/store/useProjectStore.ts` (Artefakte je Projekt)

### Technische Anforderungen
- Header: Projektname, Status, Vorgehen, „Pipeline ausführen (Simulation)"-Button (nutzt TASK-009-Mocks)
- DraftView: Zielbild, Nutzen, MVP, Phasen, offene Fragen als Karten/Abschnitte
- BacklogView: Epics als Accordions, Stories mit AKs, Schätzung (PT), Priorität-Badge
- RiskTable: TanStack Table (Risiko, Wahrscheinlichkeit, Auswirkung, Maßnahme, Priorität) sortierbar
- Leere Zustände: „Noch kein Entwurf – Pipeline ausführen"

### Akzeptanzkriterien
- [ ] Projekt ohne Artefakte zeigt sinnvolle Empty-States
- [ ] Nach Simulation sind alle 4 Tabs gefüllt und persistiert
- [ ] Story-AKs vollständig dargestellt, Prioritäten farbcodiert
- [ ] Alle Checks grün; mind. 2 neue Component-Tests (RiskTable, BacklogView)

### Testschritte
1. Neues Projekt → Detailseite → Empty-States
2. Pipeline-Simulation → Tabs prüfen → Reload → Daten noch da
3. Risikotabelle sortieren

### Erwartetes Ergebnis
Das inhaltliche Herzstück des PM-Tools steht; M6 muss nur die Datenquelle tauschen.

### Dokumentation
task-index.md; docs/architecture.md Domänenmodell ggf. nachziehen.

---

## TASK-006: Workflow-Visualisierung

**Meilenstein:** 4 · **Branch:** `feat/task-006-workflow-builder`

### Ziel
React-Flow-Ansicht der Standard-Pipeline (Input → Draft → Requirements → Scrum → PO → Risk → Review → Output) mit Status je Knoten; Grundlage für den späteren Builder.

### Kontext
Zentrales Differenzierungs-Feature. In dieser Stufe read-only + simulierter Lauf; Drag&Drop-Builder kommt in M8.

### Betroffene Dateien
- deps: `@xyflow/react`
- `src/components/workflow/FlowCanvas.tsx`, `AgentNode.tsx`, `IONode.tsx`
- `src/data/workflows.ts` (Pipeline-Definition: nodes + edges, typisiert)
- `src/app/(dashboard)/workflows/page.tsx`
- Playwright-Setup (`e2e/`, `npm run test:e2e`) mit erstem Smoke-Test

### Technische Anforderungen
- Custom Node: Icon, Agentenname, StatusBadge; Input/Output als eigene Knotenform
- Horizontales Auto-Layout (feste Positionen aus Datenmodell reichen)
- Dark-Theme-Styling für Canvas, Edges animiert bei `running`
- Button „Pipeline simulieren": Knoten wechseln sequenziell idle → running (2 s) → success
- Klick auf Knoten → Side-Sheet mit Agenten-Kurzinfo + Link zur Detailseite

### Akzeptanzkriterien
- [ ] Pipeline vollständig und korrekt verbunden dargestellt
- [ ] Simulation läuft sichtbar von links nach rechts durch
- [ ] Canvas zoom-/pan-bar, Knoten nicht editierbar
- [ ] Playwright-Test: Seite lädt, alle Knoten-Labels vorhanden; alle Checks grün

### Testschritte
1. /workflows → Pipeline prüfen, Zoom/Pan testen
2. Simulation starten → sequenziellen Statuslauf beobachten
3. `npm run test:e2e`

### Erwartetes Ergebnis
Visuell überzeugende Workflow-Ansicht; Datenmodell trägt später echte Läufe und den Builder.

### Dokumentation
docs/agent-system.md: Verweis auf Workflow-Datenmodell; task-index.md.

---

## TASK-005: Agenten-Karten & Übersicht

**Meilenstein:** 4 · **Branch:** `feat/task-005-agent-cards`

### Ziel
Agenten-Übersichtsseite mit Karten je Agent (Rolle, Beschreibung, Status, letzter Lauf) und Detailseite mit Lauf-Historie und Outputs (Dummy).

### Kontext
Agentenrollen laut docs/agent-system.md. UI muss so gebaut sein, dass später nur die Datenquelle (Mock → API) getauscht wird.

### Betroffene Dateien
- `src/data/agents.ts` (10 Agenten + Dummy-Läufe/-Outputs)
- `src/store/useAgentStore.ts`
- `src/components/agents/AgentCard.tsx`, `AgentRunList.tsx`, `AgentOutputView.tsx`
- `src/app/(dashboard)/agents/page.tsx`, `agents/[id]/page.tsx`
- shadcn: tabs, dialog/sheet, scroll-area

### Technische Anforderungen
- AgentCard: Lucide-Icon je Rolle, Name, Kurzrolle, StatusBadge (idle/running/success/error), Zeit des letzten Laufs
- Grid 3-spaltig ≥1280px
- Detailseite: Tabs „Übersicht" (Rolle, Input/Output-Beschreibung) und „Läufe" (Liste; Klick → Output als formatiertes JSON im Sheet)
- Simulierter Statuswechsel: Button „Run (Simulation)" setzt Status 3 s auf `running`, dann `success` + neuer Dummy-Lauf

### Akzeptanzkriterien
- [ ] Alle 10 Agenten gerendert, Detailrouten funktionieren
- [ ] Simulation wechselt Status sichtbar (Pulse-Animation bei running)
- [ ] Output-JSON lesbar formatiert (Mono-Font)
- [ ] Build/Lint/Typecheck/Tests grün

### Testschritte
1. /agents → 10 Karten prüfen
2. Karte öffnen → Tabs durchklicken → Lauf öffnen
3. „Run (Simulation)" → Statusverlauf beobachten, neuer Lauf erscheint

### Erwartetes Ergebnis
Vollständige Agenten-UI, in die der echte Runner (M6/M7) ohne UI-Umbau einzieht.

### Dokumentation
task-index.md; ggf. Icon-Zuordnung in docs/design-system.md notieren.

---

## TASK-004: Projektideen-Formular

**Meilenstein:** 3 · **Branch:** `feat/task-004-project-idea-form`

### Ziel
Validiertes Formular zur Erfassung einer Projektidee; Speicherung im Zustand-Store mit localStorage-Persistenz; Weiterleitung zur Projektliste.

### Kontext
Startpunkt der Agenten-Pipeline. Felder laut docs/product-requirements.md.

### Betroffene Dateien
- `src/types/index.ts` (ProjectIdea erweitern)
- `src/store/useProjectStore.ts` (zustand + persist)
- `src/app/(dashboard)/ideas/new/page.tsx`
- `src/components/ideas/IdeaForm.tsx`
- `src/app/(dashboard)/projects/page.tsx` (Liste mit TanStack Table)
- shadcn ergänzen: input, textarea, select, form; deps: `zod`, `react-hook-form`, `@hookform/resolvers`, `@tanstack/react-table`

### Technische Anforderungen
- Felder: Projektname*, Beschreibung*, Zielgruppe, Problem*, Nutzen, Features (Tag-/Zeilen-Eingabe), Zeitraum, Budget, Teamgröße, technische Einschränkungen, Vorgehen (Select: agil/klassisch/hybrid)
- zod-Schema + react-hook-form, Inline-Fehlermeldungen
- Submit → Idee mit `id` (crypto.randomUUID) + `createdAt` in Store → Redirect `/projects`
- Projektliste: Tabelle (Name, Vorgehen, Status „Idee", Erstellt) mit Sortierung

### Akzeptanzkriterien
- [ ] Pflichtfelder validiert, Submit nur bei validem Formular
- [ ] Idee überlebt Seiten-Reload (persist)
- [ ] Neue Idee erscheint sofort in der Projektliste
- [ ] Build/Lint/Typecheck/Tests grün

### Testschritte
1. Leeres Formular absenden → Fehlermeldungen
2. Valide Idee anlegen → Redirect → Eintrag sichtbar
3. Reload → Eintrag weiterhin da

### Erwartetes Ergebnis
Funktionierender Eingang der Pipeline mit echter (lokaler) Persistenz.

### Dokumentation
docs/product-requirements.md ggf. Feldliste angleichen; task-index.md.

---

## TASK-003b: Dashboard-Charts

**Meilenstein:** 2 · **Branch:** `feat/task-003b-dashboard-charts`

### Ziel
Das Dashboard (TASK-003) um Datenvisualisierungen erweitern: Sparklines in den vier MetricCards, Sprint-Burndown (Area-Chart mit Ideallinie), Donut der Aufgaben nach Status, Velocity-Balkenchart und horizontale Balken für Agentenläufe – alles aus typisierten Dummy-Daten, Farben ausschließlich aus Design-Tokens, Animationen `prefers-reduced-motion`-konform.

### Kontext
Baut direkt auf TASK-003 auf (MetricCard, `src/data/dashboard.ts`, `src/types`, StatusBadge). Führt die Charting-Konvention ein: shadcn/ui-Chart-Wrapper (`ChartContainer`) mit Farben aus den Design-Tokens, keine Ad-hoc-Hex-Werte.

### Neue Dependency (Begründung, Goldene Regel 5)
- **recharts** – hinzugefügt über `npx shadcn add chart`. Recharts ist die von shadcn/ui offiziell integrierte Charting-Bibliothek: MIT-Lizenz, komponierbar (deklaratives React-API), SSR-tauglich und über CSS-Variablen themebar. Der shadcn-`ChartContainer` mappt unsere Design-Tokens auf `--chart-*`, sodass die „Farben nur aus Tokens"-Regel erhalten bleibt. Alternative „eigene SVG-Charts" wurde wegen Aufwand/Wartung verworfen. In diesem Task vorgesehen.

### Betroffene Dateien
- `src/components/ui/chart.tsx` (shadcn, neu)
- `src/types/index.ts` (ergänzen: `MetricSeriesPoint`, `BurndownPoint`, `TaskStatusSlice`, `VelocityPoint`, `AgentDurationBar`)
- `src/data/dashboard.ts` (ergänzen: Sparkline-Serien je Metrik, Burndown, Task-Verteilung, Velocity, Agentenlauf-Dauern)
- `src/components/dashboard/MetricCard.tsx` (Sparkline ergänzen)
- `src/components/dashboard/charts/Sparkline.tsx`
- `src/components/dashboard/charts/SprintBurndownChart.tsx`
- `src/components/dashboard/charts/TaskStatusDonut.tsx`
- `src/components/dashboard/charts/VelocityChart.tsx`
- `src/components/dashboard/charts/AgentRunsChart.tsx`
- `src/lib/use-reduced-motion.ts` (Hook → `isAnimationActive`)
- `src/app/(dashboard)/page.tsx` (Charts einhängen)
- `src/app/globals.css` (`--chart-*`-Mapping auf Design-Tokens, falls nötig)
- `tests/task-003b/` (Tests + `testkonzept.md`)

### Technische Anforderungen
- **Sparklines:** Mini-Area/Line je MetricCard aus einer Zeitreihe (`MetricSeriesPoint[]`), ohne Achsen/Tooltip, dezent (Höhe ~40px).
- **Sprint-Burndown:** Area-Chart „verbleibende Story Points" pro Tag plus **gestrichelte Ideallinie**; Tooltip über `ChartTooltip`.
- **Task-Donut:** Pie mit innerem Radius (Donut) der Aufgaben nach Status; Legende; Segmentfarben = Status-Tokens (success/warning/danger/info/idle/running).
- **Velocity:** vertikales Balkenchart (Story Points je Sprint), letzte ~6 Sprints.
- **Agentenläufe:** horizontales Balkenchart (Laufdauer je Agent) aus typisierter Datenquelle.
- **Farben:** ausschließlich aus Design-Tokens (`--color-primary`, `--color-accent`, Status-Tokens) via `--chart-*`/`ChartConfig`; keine Hex-Werte in Komponenten.
- **reduced-motion:** Recharts-Animationen aus, wenn `prefers-reduced-motion: reduce` (Hook → `isAnimationActive={false}`).
- Charts sind Client-Komponenten (`"use client"`); Daten typisiert aus `src/data`.
- Empty-States: leere Datenreihe → Platzhaltertext statt leerem Chart.

### Akzeptanzkriterien
- [ ] Alle 4 MetricCards zeigen eine Sparkline aus Dummy-Daten
- [ ] Burndown-Chart zeigt Ist-Verlauf **und** gestrichelte Ideallinie
- [ ] Task-Donut zeigt Verteilung nach Status; Segmentfarben aus Status-Tokens
- [ ] Velocity-Balkenchart und horizontales Agentenlauf-Chart gerendert
- [ ] Keine hartkodierten Werte/Farben in JSX; alle Farben aus Design-Tokens
- [ ] Charts respektieren `prefers-reduced-motion`
- [ ] `npm run test` grün (≥4 Tests); Lint/Typecheck/Build grün
- [ ] Responsive: Charts skalieren im 1/2/3-Spalten-Layout ohne Overflow
- [ ] `tests/task-003b/` enthält Tests **und** `testkonzept.md` (neue Konvention)

### Testschritte
1. Dashboard öffnen → alle fünf Chart-Typen sichtbar und gefüllt.
2. Dummy-Wert in `src/data/dashboard.ts` ändern (z. B. einen Burndown-Punkt) → Chart ändert sich.
3. OS „Reduce Motion" aktivieren, neu laden → keine Einblende-Animation der Charts.
4. Fenster auf 700 px verkleinern → Charts bleiben lesbar, kein horizontales Scrollen.
5. `npm run test`.

### Erwartetes Ergebnis
Dashboard wirkt wie ein datengetriebenes SaaS-Analytics-Tool. Die Charting-Konvention (Token-Farben + reduced-motion) steht für alle Folge-Tasks bereit.

### Dokumentation
`tests/task-003b/testkonzept.md` (automatisiert + manuell); `docs/task-index.md` (Eintrag TASK-003b); `docs/frontend-plan.md` (Recharts ergänzen), ggf. `docs/design-system.md` (Chart-Farb-Hinweis).

---

## TASK-003: Dashboard-UI

**Meilenstein:** 2 · **Branch:** `feat/task-003-dashboard-ui`

### Ziel
Dashboard mit Metrik-Karten, Agenten-Aktivitäts-Feed und Status-Grid auf Basis typisierter Dummy-Daten – Look einer modernen SaaS-Software.

### Kontext
Erste „echte" Seite; etabliert MetricCard, StatusBadge und die Dummy-Daten-Konvention (src/data + src/types).

### Betroffene Dateien
- `src/types/index.ts` (Project, Sprint, Task, Risk, Agent, AgentRun, StatusType)
- `src/data/dashboard.ts` (Dummy-Daten)
- `src/components/dashboard/MetricCard.tsx`, `ActivityFeed.tsx`, `StatusGrid.tsx`, `ProgressList.tsx`
- `src/components/agents/StatusBadge.tsx` (zentral!)
- `src/app/(dashboard)/page.tsx`
- Vitest + React Testing Library Setup (`vitest.config.ts`, `npm run test`)

### Technische Anforderungen
- Karten: aktive Projekte, laufende Sprints, offene Aufgaben, offene Risiken (Wert + Trend)
- ActivityFeed: letzte 8 Agentenläufe (Agent, Projekt, Status, relative Zeit)
- StatusGrid: Tests / CI/CD / Qualität / Reviews mit StatusBadge
- ProgressList: 3–4 Projekte mit Fortschrittsbalken
- 12-Spalten-Grid laut Design-System, `tabular-nums` für Zahlen
- Component-Tests: MetricCard (rendert Label/Wert), StatusBadge (Status→Farbe-Mapping)

### Akzeptanzkriterien
- [ ] Dashboard vollständig aus Dummy-Daten gerendert, keine hartkodierten Werte in JSX
- [ ] StatusBadge ist die einzige Status-Farbquelle
- [ ] `npm run test` grün (≥4 Tests); Build/Lint/Typecheck grün
- [ ] Responsive: 3 Spalten ≥1280px, 2 ≥768px, 1 darunter

### Testschritte
1. Dashboard visuell mit docs/design-system.md abgleichen
2. Dummy-Wert in `src/data/dashboard.ts` ändern → UI ändert sich
3. `npm run test`

### Erwartetes Ergebnis
Vorzeigbares Dashboard; Datenkonvention für alle Folge-Tasks steht.

### Dokumentation
docs/testing-strategy.md: Vitest-Setup als „aktiv" markieren; task-index.md.

---

## TASK-002: Grundlayout & Sidebar

**Meilenstein:** 1 · **Branch:** `feat/task-002-layout-sidebar`

### Ziel
App-Shell mit fester Sidebar (240px), oberer Command-Bar und Content-Bereich; Navigation zu allen geplanten Seiten (Stubs).

### Kontext
Alle Seiten leben in der Layout-Gruppe `(dashboard)`. Navigation laut docs/frontend-plan.md.

### Betroffene Dateien
- `src/app/(dashboard)/layout.tsx`
- `src/components/layout/Sidebar.tsx`, `CommandBar.tsx`, `PageHeader.tsx`
- Seiten-Stubs: `page.tsx` (Dashboard), `projects/page.tsx`, `ideas/new/page.tsx`, `agents/page.tsx`, `workflows/page.tsx`, `board/page.tsx`, `sprints/page.tsx`
- shadcn ergänzen: `sheet`, `command`, `tooltip`, `separator`

### Technische Anforderungen
- Sidebar-Gruppen: Overview (Dashboard) / Projects (Projects, New Idea) / Agents (Agents, Workflows) / Delivery (Board, Sprints)
- Aktiver Link: `usePathname()`, Indikator in `primary`
- Command-Bar: ⌘K öffnet shadcn-Command mit Navigationseinträgen
- < 768px: Sidebar als Sheet (Burger-Button)
- Jeder Stub: `PageHeader` mit Titel + Platzhaltertext

### Akzeptanzkriterien
- [ ] Alle 7 Routen erreichbar, aktiver Zustand korrekt
- [ ] ⌘K-Navigation funktioniert
- [ ] Mobile: Sidebar als Sheet
- [ ] Kein Layout-Shift beim Seitenwechsel; Build/Lint/Typecheck grün

### Testschritte
1. Durch alle Navigationspunkte klicken, aktiven Indikator prüfen
2. ⌘K → „Board" → Enter → Route wechselt
3. Fenster auf 700px → Burger → Sheet öffnet/schließt

### Erwartetes Ergebnis
Professionelle App-Shell, in die alle Module nur noch „eingehängt" werden.

### Dokumentation
Screenshot in docs/frontend-plan.md optional; task-index.md aktualisieren.

---

## TASK-001: Projekt-Setup

**Meilenstein:** 1 · **Branch:** `feat/task-001-project-setup`

### Ziel
Lauffähiges Next.js-Projekt mit TypeScript (strict), Tailwind, shadcn/ui, Dark Theme als Default und sauberer Basisstruktur.

### Kontext
Fundament für alle weiteren Tasks. Hier werden Tooling, Design-Tokens und Ordnerstruktur festgelegt (siehe docs/architecture.md, docs/design-system.md).

### Betroffene Dateien
- Neues Next.js-Projekt im Repo-Root (`src/`-Verzeichnis aktivieren, App Router)
- `tailwind.config.ts`, `src/app/globals.css` (Design-Tokens)
- `src/lib/utils.ts`, `components.json` (shadcn)
- `.gitignore`, `README.md` (Setup-Abschnitt prüfen)
- Leere Ordner mit `.gitkeep`: `src/components/{layout,dashboard,agents,board,workflow}`, `src/store`, `src/types`, `src/data`

### Technische Anforderungen
- `npx create-next-app@latest` mit TypeScript, Tailwind, ESLint, App Router, src-dir, Import-Alias `@/*`
- `tsconfig.json`: `"strict": true`
- shadcn/ui initialisieren (`npx shadcn@latest init`), Basis-Komponenten: button, card, badge
- Farb-Tokens aus docs/design-system.md als CSS-Variablen + Tailwind-Theme
- Fonts via `next/font`: Inter + JetBrains Mono
- `class="dark"` fest am `<html>` (kein Theme-Toggle im MVP)

### Akzeptanzkriterien
- [ ] `npm run dev` startet ohne Fehler, Startseite zeigt dunklen Hintergrund mit Token-Farben
- [ ] `npx tsc --noEmit`, `npm run lint`, `npm run build` fehlerfrei
- [ ] shadcn-Button rendert auf der Startseite (Smoke-Test)
- [ ] Ordnerstruktur entspricht docs/architecture.md

### Testschritte
1. `npm run dev` → http://localhost:3000 öffnen
2. Hintergrund `#0a0a0f`, Text hell, Inter geladen (DevTools → Computed)
3. Build + Lint + Typecheck ausführen

### Erwartetes Ergebnis
Leere, aber korrekt konfigurierte App im Ziel-Design, bereit für das Layout.

### Dokumentation
README-Setup verifizieren; task-index.md auf „done" setzen.
