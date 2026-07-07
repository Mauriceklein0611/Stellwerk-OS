---
module: pm-studio
type: doc
status: frozen
imported: 2026-07-08
source: projectmind-os
---

# AGENTS.md – Arbeitsregeln für Codex

Dieses Dokument ist verbindlich. Lies es vor jeder Aufgabe. Bei Widerspruch zwischen Nutzeranweisung und diesem Dokument: nachfragen.

## Projektkontext

Agentic PM Studio – lokale Projektmanagement-Plattform mit KI-Agenten.
Stack: Next.js (App Router), TypeScript strict, Tailwind, shadcn/ui, Zustand, React Flow. Backend später: FastAPI + Ollama + LangGraph.
Vollständige Doku in `/docs`, umsetzbare Aufgaben in `/tasks`.

## Goldene Regeln

1. **Immer genau EINEN Task aus `/tasks` umsetzen.** Keine Änderungen außerhalb des Task-Scopes. Wenn etwas Angrenzendes auffällt: als Notiz vorschlagen, nicht umsetzen.
2. **Nie direkt auf `main` oder `dev` committen.** Jede Änderung läuft über einen Feature-Branch + Pull Request.
3. **Kleine Schritte.** Lieber 5 kleine, nachvollziehbare Commits als ein großer.
4. **Erkläre, was du tust.** Der Nutzer will lernen: Bei jeder Umsetzung kurz begründen, warum dieser Ansatz gewählt wurde (Architektur, Pattern, Alternative).
5. **Keine neuen Dependencies ohne Begründung** und ohne dass sie in der Task-Datei oder `/docs` vorgesehen sind.
6. **Keine Secrets committen** (.env, API-Keys, Tokens) – auch nicht „nur lokal".

## Branch-Modell

```
main   ← stabile, versionierte Releases (nur per PR von dev, nur bei Meilenstein)
dev    ← Integrationsbranch, immer lauffähig (nur per PR von Feature-Branches)
feat/* ← ein Branch pro Task
```

Branch-Namen:
- `feat/task-003-dashboard-ui` (Features, immer mit Task-ID)
- `fix/board-drag-persistence` (Bugfixes)
- `docs/update-agent-system` (reine Doku)
- `chore/…`, `refactor/…`, `test/…`

## Workflow pro Task (Schritt für Schritt)

1. `git checkout dev && git pull`
2. `git checkout -b feat/task-00X-kurzname`
3. Task-Datei aus `/tasks` vollständig lesen (Ziel, Anforderungen, Akzeptanzkriterien)
4. Umsetzung in kleinen Commits (Conventional Commits, siehe unten)
5. Qualitäts-Gate lokal ausführen – ALLE müssen grün sein:
   ```bash
   npm run lint
   npx tsc --noEmit
   npm run test        # sobald vorhanden
   npm run build
   ```
6. Akzeptanzkriterien der Task-Datei einzeln abhaken
7. Doku aktualisieren: `docs/task-index.md` (Status), betroffene Docs, ggf. README
8. **Eigene Tests vor dem Push:** Qualitäts-Gate (Schritt 5) muss grün sein; bei UI-/Workflow-Tasks zusätzlich vorhandene E2E-Tests (Playwright) ausführen. Für Linux-Parität optional Docker/WSL nutzen. `tests/<task-id>/testkonzept.md` wird trotzdem erstellt/aktualisiert – sie bleibt die Referenz für (spätere) manuelle Tests des Nutzers, blockiert den Push aber nicht mehr.
9. Push: `git push -u origin feat/task-00X-kurzname`
10. **PR nach `dev` erstellen** (per `gh pr create --base dev`), PR-Beschreibung enthält:
   - Task-ID + Link zur Task-Datei
   - Was wurde umgesetzt (kurz)
   - Checkliste der Akzeptanzkriterien (abgehakt)
   - Hinweise für Review/Testen
11. **GitHub-CI abwarten** (`gh pr checks --watch`). Rot → Ursache beheben, neuer Commit, push, erneut abwarten.
12. **Grün → automatisch mergen** (`gh pr merge --merge --delete-branch`), danach `dev` pullen, lokalen Branch löschen, nächster Task.
13. **Meilenstein-Check:** Ist mit diesem Merge laut `docs/development-roadmap.md` ein Meilenstein abgeschlossen, direkt den Release-Flow (siehe „Releases: dev → main") anschließen.

> **Ausnahme:** Wenn der Nutzer explizit ankündigt, vor dem Push selbst zu testen („warte, ich teste erst"), gilt für diesen Task wieder die manuelle Freigabe: auf dem Branch anhalten, Testkonzept-Checkliste geben, erst nach seinem OK weiter (push/PR/merge).

## Releases: dev → main

Nur am Ende eines Meilensteins (siehe `docs/development-roadmap.md`) – läuft als Fortsetzung von Workflow-Schritt 13 automatisch:

1. Prüfen: `dev` ist grün (Lint, Typecheck, Tests, Build) und Meilenstein-Kriterien erfüllt
2. PR von `dev` nach `main` mit Titel `release: v0.X.0 – <Meilenstein-Name>`, CI abwarten, dann mergen (`gh pr merge --merge --delete-branch`)
3. Nach Merge auf `main` taggen:
   ```bash
   git checkout main && git pull
   git tag -a v0.X.0 -m "Meilenstein X: <Name>"
   git push origin v0.X.0
   ```
4. `CHANGELOG.md` aktualisieren (Abschnitt je Version: Added/Changed/Fixed)
5. GitHub Release veröffentlichen (Release Notes aus der Historie):
   ```bash
   gh release create v0.X.0 --title "v0.X.0 – <Meilenstein-Name>" --generate-notes
   ```
   Optional die Notes um den passenden `CHANGELOG.md`-Abschnitt ergänzen, z. B.
   `--notes-file <abschnitt.md>` statt/zusätzlich zu `--generate-notes`.

Versionsschema: `v0.1.0` = M1 … `v0.5.0` = MVP (M5), `v0.6.0` = erster echter Agent, `v1.0.0` = M8 abgeschlossen. Patch-Releases (`v0.3.1`) nur für Bugfixes auf main.

## Token-effizienter Workflow (TODO.md & Kontext-Reset) – STRIKT

Ziel: minimaler Token-Verbrauch, schnelle Antworten und hohe Denkqualität über
Chatfenster hinweg. Verbindliche „Dokumentieren & Bereinigen"-Routine:

1. **Nach Abschluss & Verifikation einer Aufgabe** (Task gemergt, Qualitäts-Gate
   grün): Aktualisiere – noch **vor** dem Ende der Konversation – selbstständig
   `TODO.md` im Projekt-Hauptverzeichnis (anlegen, falls nicht vorhanden).
2. **Zustands-Synchronisation (State Sync):** Halte in `TODO.md` präzise fest:
   - **Erledigt** (mit Datum, knapp – die ausführliche Historie bleibt in
     `docs/task-index.md` + `docs/tasks-archive.md`; nicht duplizieren).
   - **Exakte nächste technische Schritte:** konkrete Dateinamen, Funktionen und
     der genaue Kontext (so, dass ein frischer Chat sofort weiterarbeiten kann).
   - **Architektur-Entscheidungen** und noch offene **Edge Cases**.
3. **Reset-Aufforderung:** Direkt nach dem Speichern von `TODO.md` gibst du
   folgende Meldung **unverändert als letzte Nachricht** aus:
   > 🚨 **Aufgabe abgeschlossen & TODO.md aktualisiert!** Bitte führe jetzt
   > `/clear` aus, um den Token-Kontext zurückzusetzen, und starte im neuen Chat
   > mit dem nächsten Schritt aus der TODO.md.

Einordnung:
- `TODO.md` ist der schlanke **Hand-off zwischen Chatfenstern**, nicht die
  Status-Quelle – maßgeblich bleiben `docs/task-index.md` und `docs/tasks-archive.md`.
- Keine Secrets, keine vollständigen Diffs in `TODO.md`.
- Die Routine ersetzt **nicht** den PR-Flow: Code- und Doku-Änderungen weiterhin
  nur über Feature-Branch + PR (auch `TODO.md`/`AGENTS.md` selbst).
- Verlangt der Nutzer ausdrücklich mehrere Aufgaben am Stück, führe sie aus und
  wende die Routine **am Ende des Laufs** an (nicht nach jeder Teilaufgabe).

## Commit-Konvention (Conventional Commits)

```
feat(dashboard): add metric cards with dummy data
fix(board): persist column order after reload
docs(tasks): mark TASK-003 as done
test(store): add unit tests for project store
refactor(agents): extract StatusBadge component
chore(deps): add @tanstack/react-table
```

Regeln: Imperativ, englisch, klein geschrieben, ein Thema pro Commit, Task-ID im Body wenn nicht im Branch-Namen.

## Code-Standards

- TypeScript strict, kein `any` (Ausnahme nur mit `// eslint-disable` + Begründung)
- Server Components als Default, `"use client"` nur bei Interaktivität
- Keine Business-Logik in Komponenten → `src/lib/` oder Stores
- Alle Domänen-Typen zentral in `src/types/`, Dummy-Daten nur in `src/data/`
- UI-Daten nie hartkodiert in JSX – immer aus typisierten Datenquellen
- Status-Farben ausschließlich über `<StatusBadge>` (eine Quelle)
- Design-Tokens aus `docs/design-system.md` verwenden, keine Ad-hoc-Farben
- Loading-/Empty-/Error-States für jede Liste mitliefern

## Tests & Definition of Done

Ein Task ist erst fertig, wenn alle 8 Punkte der Definition of Done aus `docs/testing-strategy.md` erfüllt sind. Im Zweifel: Task NICHT als done markieren und offen benennen, was fehlt.

### Test-Ordner & Testkonzept (verbindlich pro Task)

Sobald ein Task etwas Testbares enthält (UI, Logik, später API/Agenten), gilt **immer**:

1. **Test-Ordner:** Die automatisierten Tests liegen in `tests/<task-id>/` (z. B. `tests/task-003/`), nicht verstreut im Code. Vitest/Playwright lesen aus `tests/`.
2. **Testkonzept:** Im selben Ordner liegt eine `testkonzept.md`. Sie beschreibt:
   - **Automatisiert:** welche Tests existieren und was sie abdecken (Tabelle Datei → Prüfung).
   - **Manuell:** eine Schritt-für-Schritt-Checkliste, *was der Nutzer selbst testen kann und soll*, inkl. erwartetem Ergebnis (klickbare Akzeptanz).
   - **DoD-Abgleich:** kurze Checkliste gegen `docs/testing-strategy.md`.
3. **Im Task erstellt:** Test-Ordner und Testkonzept entstehen und werden **im selben Task/PR** angelegt bzw. aktualisiert – nie nachgelagert.

Ziel: Der Nutzer hat pro Task eine klare, manuelle Testanleitung an einem festen Ort und muss nicht im Code suchen.

## Was Codex NICHT tun darf

- ❌ Direkt auf `main`/`dev` pushen oder force-pushen
- ❌ Mehrere Tasks in einem Branch mischen
- ❌ Task-Dateien oder Akzeptanzkriterien eigenmächtig ändern, um sie „erfüllbar" zu machen
- ❌ Tests löschen oder skippen, damit das Gate grün wird
- ❌ Große Refactorings „nebenbei"
- ❌ Dateien in `/docs` löschen
