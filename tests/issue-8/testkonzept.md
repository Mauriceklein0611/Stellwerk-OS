# Testkonzept – Issue #8: Monorepo-CI (Pfadfilter, TS+PY-Gates, Docker, GHCR)

Infrastruktur-Issue: die Verifikation ist überwiegend eine **CI-Checkliste** auf
GitHub (kein lokaler Testlauf). Lokal wird nur die Workflow-Datei validiert.

## Lokale Validierung (vorab)
```bash
# YAML + GitHub-Actions-Lint (inkl. Shellcheck der run-Skripte):
docker run --rm -v "$PWD:/repo" -w /repo rhysd/actionlint:latest .github/workflows/ci.yml
# erwartet: keine Ausgabe, Exit 0
```
Ergebnis dieses PRs: `actionlint` Exit 0, keine Beanstandungen.

## CI-Checkliste (auf GitHub)

### AK1 – Pfadfilter belegt (nur Geändertes läuft)
- [ ] Dieser PR ändert nur `.github/`, `docs/`, `tests/` → Jobs `core`, `pms`,
      `docker` werden **übersprungen**, nur `changes` + `ci-ok` laufen.
- [ ] Ein PR, der `services/core/**` ändert, startet den `core`-Job.
- [ ] Ein PR, der nur `docs/**` ändert, startet **keine** Build-Jobs.

### AK2 – Gates werden rot bei Fehler (demonstrieren, dann fixen)
- [ ] Wegwerf-Commit mit Ruff-/mypy-Verstoß in `services/core/app` → `core` rot.
- [ ] Fehler entfernt → `core` wieder grün.
      (PMS analog ab #10, sobald `apps/pm-studio` existiert.)

### AK3 – GHCR-Push auf main/Tags
- [ ] Merge nach `main` pusht `ghcr.io/<owner>/<repo>/core:sha-<kurz-sha>`.
- [ ] Test-Tag `v0.0.1-test` erzeugt zusätzlich `…/core:0.0.1-test` (semver/ref).
- [ ] Danach Test-Tag **und** erzeugte Package-Version wieder löschen.

### AK4 – required Check
- [ ] Branch-Protection für `dev`/`main` hat **`ci-ok`** als einzigen required
      Status Check (übersprungene Jobs blockieren das Mergen nicht).
      Siehe docs/runbooks/ci.md.

## Reproduzierbarkeit der Kern-Gates in CI
Der `core`-Job startet einen `postgres:16`-Service-Container und setzt
`STW_DATABASE_URL` **und** `STW_TEST_DATABASE_URL` darauf – damit laufen die
env-gegateten DB-Tests (`test_db`, `test_telemetry_db`) in CI genauso wie lokal.
`STW_GATEWAY_PROVIDER=stub` stellt sicher, dass CI nie echte LLMs ruft (ADR-006).

## Definition of Done
- [ ] `actionlint` grün (lokal belegt)
- [ ] Pfadfilter nachgewiesen (AK1)
- [ ] Gates rot bei Fehler, dann gefixt (AK2)
- [ ] GHCR-Push + versioniertes Image bei Tag (AK3), Testartefakte gelöscht
- [ ] `ci-ok` als required Check gesetzt (AK4)
