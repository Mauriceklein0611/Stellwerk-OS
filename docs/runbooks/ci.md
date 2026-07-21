---
module: platform
type: runbook
status: current
updated: 2026-07-07
---

# Runbook: Monorepo-CI & Branch-Protection

Betrifft `.github/workflows/ci.yml` (Issue #8). Die Pipeline prüft jeden PR nach
`dev`/`main` – aber pfadgefiltert nur das Geänderte – und pusht auf `main`/Tags
versionierte Images nach GHCR.

## Jobs

| Job | Wann | Inhalt |
|---|---|---|
| `changes` | immer | `dorny/paths-filter` → Outputs `core`, `pms`, `contracts`, `docker`, `docs` |
| `core` | `core`-Pfade geändert | uv-Sync, ruff, mypy, `alembic upgrade head`, pytest gegen Postgres-Service-Container (DB-Tests via `STW_TEST_DATABASE_URL`) |
| `pms` | `apps/pm-studio/**` geändert | npm ci, lint, `tsc --noEmit`, vitest, build (aktiv ab #10) |
| `docker` | `docker`-Pfade **oder** push auf `main`/Tags | buildx-Build der Kern-Dockerfile; **Push nur** bei push-Events |
| `docs` | `docs/**` oder `scripts/docs-check.sh` geändert | Doku-Gate: `bash scripts/docs-check.sh` prüft Frontmatter-Pflichtfelder + interne Links (zero-dependency, offline) |
| `ci-ok` | immer (`if: always()`) | Sammel-Gate: schlägt fehl, wenn ein Job `failure`/`cancelled` ist |

**Doku-Gate lokal ausführen:** `bash scripts/docs-check.sh` (prüft alle
`docs/**/*.md` auf Frontmatter `module/type/status/updated`, erlaubten `status`-Wert
und tote **interne** Links; externe Links/Anker werden nicht geprüft).

Concurrency pro Ref (`ci-${{ github.ref }}`) cancelt veraltete Läufe. uv- und
npm-Caches beschleunigen wiederholte Läufe.

## Branch-Protection (für `dev` und `main`)

GitHub blockiert das Mergen, wenn ein **required** Check nur „skipped" ist. Da
`core`/`pms`/`docker` pfadabhängig übersprungen werden, ist als **einziger
Required Status Check** `ci-ok` zu setzen – er fasst alle Jobs zusammen und ist
grün, wenn kein Job fehlgeschlagen ist (übersprungene zählen als ok).

Empfohlene Einstellungen (Settings → Branches → Rule für `dev`/`main`):

- ✅ Require a pull request before merging
- ✅ Require status checks to pass → **`ci-ok`**
- ✅ Require branches to be up to date before merging
- ✅ Require conversation resolution
- (`main`) ✅ zusätzlich: keine Force-Pushes, keine Löschung

## GHCR-Images

- push auf `main` → `ghcr.io/<owner>/<repo>/core:sha-<kurz-sha>`
- Tag `vX.Y.Z` → zusätzlich `…/core:X.Y.Z` (semver) und `…/core:vX.Y.Z` (ref)

Der `GITHUB_TOKEN` bekommt `packages: write` **nur** im `docker`-Job; global
läuft die Pipeline mit `contents: read`.

## Absichtlicher Rot-Test (AK #8)

Zum Nachweis, dass die Gates greifen, in einem Wegwerf-PR einen Fehler einbauen
(z. B. Ruff-Verstoß in `services/core/app`), CI rot beobachten, dann fixen. Für
das Docker-/GHCR-Verhalten einen Test-Tag `v0.0.1-test` pushen, die erzeugten
Images prüfen und Tag + Package-Version anschließend löschen.
