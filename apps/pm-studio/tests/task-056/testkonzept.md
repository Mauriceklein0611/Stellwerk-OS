# Testkonzept – TASK-056: Backlog-Entities (Epic & Story als Store-Entitäten)

Epics und User Stories sind seit TASK-056 eigene, persistierte Store-Entitäten
(`useBacklogStore`) statt nur Felder im Agenten-Artefakt. Sie existieren ohne
Pipeline, sind CRUD-bar und überleben einen erneuten Agentenlauf.

## Automatisiert

| Datei | Prüfung |
|---|---|
| `tests/task-056/backlog.test.ts` | Reine Helfer: `epicsForProject`/`storiesForProject`/`storiesForEpic` (Projekt-/Epic-Filter + Rang-Sortierung), `epicRollup` (Anzahl/PT, unbekanntes Epic ⇒ 0/0), `moveRanked` (Verschieben + fortlaufende Ränge, Clamp, unbekannte Id), `flattenBacklog` (Artefakt→flache Entitäten, Story-Ids 1:1 erhalten, Rang pro Epic, Default-Provenance „agent"). |
| `tests/task-056/useBacklogStore.test.ts` | Store: add/update Epic+Story; **Provenance-Bump** (agent→human_edited beim Edit, expliziter Wert gewinnt); `removeStory` detacht Board-Tasks; `removeEpic` Kaskade (Stories weg + Tasks detacht); `reorderEpic`/`reorderStory` (Ränge im Scope); `removeProjectItems` (nur Projekt-Entitäten + Tasks detacht); `restore` (Undo); **`importBacklog`** additiv & idempotent (Re-Run fügt nichts hinzu, überschreibt Edits nicht; neue Items werden angehängt + korrekt gerankt); **`migrateFromArtifacts`** genau einmal (Flag), No-op danach. |
| `tests/task-037/detach-stories.test.ts` (angepasst) | Neue Kaskade: `removeIdea` räumt über den Backlog-Store auf (Entitäten weg + Tasks detacht); **`setArtifacts` detacht NICHT mehr** (Re-Run additiv). |
| `tests/task-009/pipeline-store.test.ts` (angepasst) | `runPipelineForIdea` promotet den Backlog des Laufs in den Store (`importBacklog`), Stories tragen `projectId`. |
| `tests/task-011/dashboard-selectors.test.ts` (angepasst) | `selectMetrics`/`selectVelocity` lesen Story-Anzahl/PT aus dem Store (neuer `stories`-Parameter). |
| `tests/task-042/search.test.ts` (angepasst) | `searchEntities` liest Stories aus `sources.stories` (Store) statt aus Artefakten. |
| `tests/task-007,008,052/BacklogView.test.tsx`, `tests/task-053/SprintDetail.test.tsx` (angepasst) | Konsumenten lesen Epics/Stories aus `useBacklogStore` (Seed im Store statt Artefakt). |

## Manuell (Klick-Akzeptanz)

> Voraussetzung: mindestens eine Projektidee. Persistenz ist lokal
> (`localStorage`, Key `pm-studio-backlog`).

1. **Migration (Bestand):** Wenn du **vor** diesem Update schon ein Backlog per
   Pipeline erzeugt hattest, öffne die App neu. → Erwartung: Backlog-Tab, Sprints,
   Releases und Dashboard-Zahlen zeigen die **gleichen** Stories wie vorher
   (einmalige, verlustfreie Übernahme). Board-Tasks bleiben ihren Stories
   zugeordnet.
2. **Pipeline erneut ausführen:** Projekt öffnen → „Pipeline ausführen". → Der
   Backlog verdoppelt sich **nicht**; bestehende Stories bleiben erhalten,
   zugeordnete Board-Tasks behalten ihre Story-Verknüpfung (kein „In Board"-Reset).
3. **Sprint-Planung:** `/sprints` → Projekt wählen. Stories erscheinen in „Nicht
   zugeordnet". Zuordnen per Drag & Drop bleibt nach Reload erhalten.
4. **Projekt löschen:** Projekt öffnen → „Löschen" → bestätigen. → Epics/Stories
   des Projekts verschwinden aus Backlog/Sprints/Suche; zugehörige Board-Tasks
   bleiben auf dem Board (ohne Story-Verknüpfung). **Undo** im Toast stellt
   Projekt **und** Backlog wieder her.
5. **Suche (⌘K/Strg+K):** Nach einem Story-Titel suchen → Treffer „Story" mit
   Projektname als Sublabel, führt zur Projektseite.

## DoD-Abgleich (`docs/testing-strategy.md`)

- [x] Reine Logik in `src/lib/` (backlog.ts) + Store in `src/store/`, testbar isoliert.
- [x] Unit-Tests decken Helfer, Store-CRUD, Kaskaden, Idempotenz und Migration ab.
- [x] Bestehende Tests **angepasst statt gelöscht** (Verhaltensänderung dokumentiert).
- [x] Keine neue Dependency; keine Persist-Migration in Board-/Sprint-Store (Story-Ids stabil).
- [x] Statusfarben unverändert nur über `<StatusBadge>`; Loading/Empty-States erhalten.
- [x] Qualitäts-Gate grün: `npm run lint`, `npx tsc --noEmit`, `npm run test`, `npm run build`.
