---
module: platform
type: test-evidence
status: current
updated: YYYY-MM-DD
related_issues: []
---

# Testkonzept · Issue #N

> Kein Prosa-Duplikat des Testcodes. Diese Datei bildet **Akzeptanzkriterium →
> Nachweis** ab und dient als Abnahmenachweis. Konkrete Testfälle leben im Code.

## Abdeckungstabelle

| Akzeptanzkriterium | Automatisierter/manueller Nachweis | Datei | Befehl |
|---|---|---|---|
| <AK 1> | automatisiert (unit) | `path/to/test_x.py::test_...` | `uv run pytest -k ...` |
| <AK 2> | automatisiert (e2e) | `apps/pm-studio/e2e/x.spec.ts` | `npm run test:e2e -w @stellwerk/pm-studio` |
| <AK 3> | manuell | – | dokumentierte Schritte unten |

## Manuelle Schritte (falls nötig)

1. …

## Qualitäts-Gate

- [ ] Lint/Types/Tests/Build der betroffenen Workspaces grün
- [ ] `make contracts` driftfrei (falls API berührt)
- [ ] CI `ci-ok` grün
