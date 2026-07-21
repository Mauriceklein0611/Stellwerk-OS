---
module: platform
type: reference
status: current
updated: 2026-07-21
owner: Maurice
source_of_truth_for: nachvollziehbare Kette Ziel→Release→Issue→ADR→Test→Doku
related_issues: [63]
---

# Traceability

Die entscheidungsrelevante Kette muss vollständig rekonstruierbar sein (nicht jedes
Gespräch, aber jede tragende Entscheidung). Verlinken statt kopieren.

```
Vision → strategisches Ziel → Roadmap-Meilenstein → Release Charter
  → PRD (bei großen Features) → GitHub Issue → ADR (bei tragender Entscheidung)
  → Pull Request → Code/Migration/Vertrag → Testnachweis
  → Betriebs-/Benutzerdoku → CHANGELOG + Release-Evidenz
```

## Einstiegspunkte je Glied

| Glied | Wo |
|---|---|
| Vision / Ziele | [vision.md](../platform/vision.md) · [goals-and-non-goals.md](../platform/goals-and-non-goals.md) · [outcomes.md](../platform/outcomes.md) |
| Roadmap / Reihenfolge | [roadmap.md](../platform/roadmap.md) |
| Aktiver Release | [release-charters/v0.2.md](../platform/release-charters/v0.2.md) |
| Arbeitsauftrag | GitHub Issues |
| Tragende Entscheidung | [ADR-Index](../platform/adrs/README.md) |
| Änderung/Diskussion | Pull Requests |
| Implementierte API/Schema | OpenAPI/`packages/contracts` · Alembic-Migrationen |
| Testnachweis | Testcode + `ci-ok` · [../testing/strategy.md](../testing/strategy.md) |
| Betrieb | [../operations/README.md](../operations/README.md) |
| Release-Evidenz | `CHANGELOG.md` + GitHub Release |

## Beispiel: v0.2-Kette (in Arbeit)

Ziel **O1** ([outcomes.md](../platform/outcomes.md)) → Meilenstein v0.2
([roadmap.md](../platform/roadmap.md)) → [Release Charter v0.2](../platform/release-charters/v0.2.md)
→ Issue **#44** → [ADR-011/012/014/015](../platform/adrs/README.md) → PR → Code/Migration
→ Tests (`ci-ok` + Playwright-Smoke) → [Telemetrie-Doku](../services/telemetry-costs.md)
→ CHANGELOG/Release.

> Vollständige Wahrheitszuordnung: [documentation-policy.md §2](../platform/documentation-policy.md)
> und [roadmap.md §8.3](../platform/roadmap.md).
