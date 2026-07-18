# CLAUDE.md – Arbeitsregeln für Beiträge

Verbindliche Regeln für die Arbeit in diesem Monorepo (Menschen **und** Agenten).
Bei Widerspruch zwischen Nutzeranweisung und diesem Dokument: nachfragen.
Ergänzt das [Arbeitssystem](docs/platform/arbeitssystem.md) und die
[Build-Spec](docs/platform/build-spec.md).

## Projektkontext

**Stellwerk** – modulare Open-Source-Plattform für Enterprise AI. Ein schlanker
Kern (`services/core`, FastAPI) stellt geteilte Dienste bereit (Identity, Model
Gateway, Telemetrie, Audit, Eval, Runtime); darauf laufen gleichrangige
Fachmodule (`apps/*`, z. B. PM Studio). Aus dem Kern generierte Verträge liegen
in `packages/*`.

```
services/core/     FastAPI-Kern (Python, uv)          → docs/core/
apps/pm-studio/    Next.js-App (@stellwerk/pm-studio)  → docs/pm-studio/
packages/contracts/ OpenAPI→TS-Typen (@stellwerk/contracts)
docs/platform · docs/runbooks   plattformweite Doku & Runbooks
```

## Goldene Regeln

1. **Genau ein Issue pro Feature-Branch/PR** (`Closes #N`). Kein Scope-Creep;
   Angrenzendes als eigenes Issue vorschlagen, nicht nebenbei umsetzen.
2. **Nie direkt auf `main` oder `dev` committen/pushen.** Alles über
   Feature-Branch + PR nach `dev`.
3. **Kleine, nachvollziehbare Commits** (Conventional Commits) mit kurzer
   Begründung des Ansatzes im PR.
4. **Keine Secrets committen** (`.env`, Keys, Tokens) – auch nicht „nur lokal".
5. **Keine neuen Dependencies ohne Begründung** (im PR/ADR).

## Branch-Modell

```
main   ← stabile, versionierte Releases (nur per PR von dev)
dev    ← Integrationsbranch, immer lauffähig (nur per PR von Feature-Branches)
feat/N-kurzname · fix/… · chore/… · docs/…   (N = Issue-Nummer)
```

## Workflow pro Issue

1. `git checkout dev && git pull` → `git checkout -b feat/N-kurzname`
2. Issue lesen (Ziel, Anforderungen, Akzeptanzkriterien).
3. Umsetzen in kleinen Commits; **Qualitäts-Gate lokal grün** (s. u.).
4. Testkonzept unter `tests/issue-N/testkonzept.md` (manuelle Checkliste +
   automatisierte Abdeckung).
5. Push; **PR nach `dev`** (`gh pr create --base dev`) mit Akzeptanzkriterien-
   Checkliste.
6. CI abwarten – **`ci-ok`** ist der required Check. Rot → Ursache beheben.
7. Grün → mergen (`gh pr merge --merge --delete-branch`), `dev` pullen.

## Qualitäts-Gates (je Workspace)

- **Kern** (`services/core`): `uv run ruff check . && uv run mypy app && uv run pytest`
  (DB-Tests laufen mit gesetztem `STW_TEST_DATABASE_URL`).
- **PM Studio** (`apps/pm-studio`): `npm run lint`, `npx tsc --noEmit -p apps/pm-studio`,
  `npm run test`, `npm run build` (jeweils `-w @stellwerk/pm-studio`).
- **Contracts**: `make contracts` muss driftfrei sein (`git diff --exit-code packages/contracts`).

## CI

Pfadgefilterte Pipeline (`.github/workflows/ci.yml`): `changes` bestimmt, was
läuft (`core`/`pms`/`contracts`/`docker`/`trivy`); **`ci-ok`** fasst alles
zusammen und ist der einzige required Status Check. `main`/Tags pushen
versionierte Images nach GHCR. Details: [docs/runbooks/ci.md](docs/runbooks/ci.md).

## Konventionen

- **Commits:** Conventional Commits, imperativ, englisch, ein Thema pro Commit
  (`feat(core): …`, `fix(pms): …`, `chore(platform): …`).
- **Issue-Labels:** `module:{core|platform|pms|…}` + `type:{feat|fix|chore|docs|…}`.
- **ADRs:** tragende Entscheidungen im PR begründen (Kandidat-ADR benennen).
- **LLM-Zugriff nur über den Model Gateway** (`/api/v1/gateway/chat`, ADR-006);
  in Tests `STW_GATEWAY_PROVIDER=stub`.
- **Doku als Code je Modul** mit YAML-Frontmatter (`status: current|frozen`).

## Was NICHT erlaubt ist

- ❌ Direkt auf `main`/`dev` pushen oder force-pushen.
- ❌ Mehrere Issues in einem Branch mischen.
- ❌ Akzeptanzkriterien eigenmächtig „erfüllbar" umschreiben.
- ❌ Tests löschen/skippen, damit das Gate grün wird.
