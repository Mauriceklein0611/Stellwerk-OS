---
module: platform
type: test-strategy
status: current
updated: 2026-07-21
owner: Maurice
source_of_truth_for: Zuordnung Workspace × Testart × CI-Job
related_issues: [63]
---

# Testmatrix

Stand der CI (`.github/workflows/ci.yml`). `proposed`-Zeilen sind noch nicht verdrahtet.

| Workspace | Testart | Werkzeug | CI-Job | Pflicht (`ci-ok`) |
|---|---|---|---|---|
| `services/core` | Lint | ruff | `core` | ✅ |
| `services/core` | Typen | mypy | `core` | ✅ |
| `services/core` | Unit + DB | pytest (`STW_TEST_DATABASE_URL`) | `core` | ✅ |
| `packages/contracts` | Contract-Drift | `make contracts` + `git diff` | `contracts` | ✅ |
| `apps/pm-studio` | Lint | eslint | `pms` | ✅ |
| `apps/pm-studio` | Typen | `tsc --noEmit` | `pms` | ✅ |
| `apps/pm-studio` | Unit | vitest | `pms` | ✅ |
| `apps/pm-studio` | Build | `next build` | `pms` | ✅ |
| Kern-Image | Security-Scan | Trivy (HIGH/CRITICAL) | `trivy` | ✅ |
| Repo | SAST | CodeQL (JS/TS + Python) | `codeql.yml` | separat |
| Kern + PMS | Container-Smoke (bauen+starten) | Compose/HTTP | `proposed` (#55) | — |
| `apps/pm-studio` | Browser-E2E (kritischer Smoke) | Playwright | `proposed` (#59) | — |
| Doku | Frontmatter + interne Links | `scripts/docs-check.sh` (zero-dep) | `docs` | ✅ |

Lizenz-Report (`licenses`) läuft, ist aber **nicht** blockierend.
