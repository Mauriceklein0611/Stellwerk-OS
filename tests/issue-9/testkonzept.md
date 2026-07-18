# Testkonzept – Issue #9: Security-Basis (Dependabot, CodeQL, Trivy, SECURITY.md)

Infrastruktur-Issue: Verifikation überwiegend als Checkliste auf GitHub. Der
Trivy-Mechanismus wird zusätzlich **lokal** belegt.

## Lokale Verifikation (belegt in diesem PR)
```bash
# Workflows linten:
docker run --rm -v "$PWD:/repo" -w /repo rhysd/actionlint:latest \
  .github/workflows/ci.yml .github/workflows/codeql.yml
# -> Exit 0

# Trivy gegen das aktuelle Kern-Image (muss SAUBER sein):
docker build -t stellwerk-core:ci services/core
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy:latest \
  image --severity HIGH,CRITICAL --ignore-unfixed --exit-code 1 --scanners vuln \
  stellwerk-core:ci
# -> Exit 0 (keine behebbaren HIGH/CRITICAL)

# Gate beißt nachweislich bei einem veralteten Image:
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy:latest \
  image --severity HIGH,CRITICAL --ignore-unfixed --exit-code 1 --scanners vuln \
  python:3.9-slim-bullseye
# -> Exit 1 (viele HIGH/CRITICAL)
```
Ergebnis: actionlint Exit 0; Kern-Image Exit 0; veraltetes Image Exit 1.

## CI-/GitHub-Checkliste (AK1 – alle vier laufen nachweislich)
- [ ] **Dependabot** – Tab *Insights → Dependency graph → Dependabot* listet die
      vier Ökosysteme (npm, pip, github-actions, docker); erster wöchentlicher
      Lauf bzw. „Check for updates" erzeugt gruppierte PRs.
- [ ] **CodeQL** – Workflow `codeql` läuft auf diesem PR (Sprache python) grün;
      Findings erscheinen im Tab *Security → Code scanning*.
- [ ] **Trivy** – läuft im `ci`-Workflow, sobald ein PR `services/core/**` oder
      Dockerfiles ändert, sowie auf `main`/Tags (hier lokal belegt).
- [ ] **Lizenz-Report** – Job `licenses` schreibt npm-/pip-Lizenzen in die
      Job-Summary (nicht blockierend).

## AK2 – verwundbares Test-Image schlägt fehl
- [x] Lokal belegt (python:3.9-slim-bullseye → Trivy Exit 1).
- [ ] Optional in CI: kurzer Wegwerf-PR, der die Kern-`Dockerfile`-Basis auf ein
      veraltetes Image setzt → `trivy`-Job rot; danach zurücksetzen.

## SECURITY.md
- [ ] Meldeweg (Private Vulnerability Reporting) und Support-Zeitraum vorhanden.

## Definition of Done
- [ ] Dependabot, CodeQL, Trivy, Lizenz-Report konfiguriert und lauffähig
- [ ] Trivy blockt HIGH/CRITICAL (lokal belegt), `.trivyignore` dokumentiert
- [ ] SECURITY.md mit Meldeweg + Support-Zeitraum
- [ ] `ci`-Gate (`ci-ok`) grün
