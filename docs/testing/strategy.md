---
module: platform
type: test-strategy
status: current
updated: 2026-07-21
owner: Maurice
source_of_truth_for: Teststrategie und Gate-Regeln (Wahrheit = Testcode + CI-YAML)
related_issues: [63]
related_adrs: [ADR-006]
---

# Teststrategie

> **Wahrheit sind der Testcode** (`services/core/tests/`, `apps/pm-studio/**/*.spec.ts`,
> Vitest) **und die CI** (`.github/workflows/ci.yml`). Diese Seite erklärt Pyramide,
> Gates und Netz-/LLM-Regeln. Zuordnung: [test-matrix.md](test-matrix.md).

## Grundregeln

- **Determinismus (ADR-006):** Kein Pflicht-Gate ruft Internet oder ein reales LLM auf.
  Provider-Tests laufen gegen den **Stub** bzw. (Ziel) MockTransport.
- **Kern-DB-Tests** laufen mit gesetztem `STW_TEST_DATABASE_URL`.
- **Keine Test-Skips**, um `ci-ok` grün zu bekommen.

## Ebenen

| Ebene | Ist-Zustand |
|---|---|
| Unit (Kern) | `pytest` (ruff + mypy vorgeschaltet) |
| Unit (PMS) | `vitest` |
| Contract | `make contracts` + Drift-Check (`git diff --exit-code packages/contracts`) |
| Container-Smoke | **`proposed`** — beide Images bauen+starten (#55) |
| Browser-E2E | Playwright-Suite vorhanden (`apps/pm-studio/e2e/`), aber **noch nicht** Pflicht-Gate; kritischer Smoke wird required (#59) |

## Pflicht-Gate (`ci-ok`)

`ci-ok` fasst `changes/core/contracts/pms/docker/trivy` zusammen und ist der **einzige
required Status Check**. Details: [../runbooks/ci.md](../runbooks/ci.md).

## Geplant (`proposed`)

- kritischer Playwright-Smoke als Pflicht-Gate; volle Browser-Suite **nightly** mit
  Promotions-/Rückstufungsregel (roadmap §Teil 6 Nr. 2).
- Coverage-Basislinie je Workspace als CI-Artefakt (Trend, kein früher Schwellwert).
- Injection-/untrusted-content-Evalfälle getrennt von deterministischen Sperrtests
  (E10.5); Eval-Harness v0.6.
