---
module: platform
type: reference
status: current
updated: 2026-07-19
owner: Maurice
related_issues: [61]
---

# Stellwerk – Dokumentation

Einstieg in die Docs-as-Code-Dokumentation von **Stellwerk**, einer modularen
Open-Source-Plattform für Enterprise AI: ein schlanker Kern (`services/core`,
FastAPI) mit geteilten Diensten, darauf gleichrangige Fachmodule (`apps/*`).

> **Ist-Zustand vs. Zielbild:** Was heute implementiert ist, steht in den
> `current`-Dokumenten, im Code, in den Migrationen und im generierten OpenAPI.
> Die **Zukunft** steht in der [roadmap.md](platform/roadmap.md) (`proposed`).
> Wie beides ausgezeichnet wird, regelt die
> [documentation-policy.md](platform/documentation-policy.md).

## Navigation

### Plattform & Strategie
- [Vision](platform/vision.md) – warum Stellwerk existiert, dauerhafte Prinzipien
- [Roadmap (Masterplan, `proposed`)](platform/roadmap.md) – Releases, Zielarchitektur, Nicht-Ziele
- [Build-Spec (v0.1, historische Baseline)](platform/build-spec.md)
- [Arbeitssystem](platform/arbeitssystem.md) – Tickets, Branches, Doku-System
- [Dokumentations-Policy](platform/documentation-policy.md) – Frontmatter, Wahrheitshierarchie, Pflegeprozess
- [ADR-Index](platform/adrs/README.md) – tragende Architekturentscheidungen (ADR-011–015 accepted)
- [Glossar](platform/glossar.md)

### Produkt & Management
- [Product Brief](platform/product-brief.md) – Problem, Zielgruppen, Nutzenversprechen
- [Ziele & Nicht-Ziele](platform/goals-and-non-goals.md) – Reifegrenze, Portfolio-Cut
- [Outcomes](platform/outcomes.md) – messbare Produktziele & Erfolgsnachweise
- [Stakeholder & Personas](platform/stakeholders-and-personas.md)
- [Release Charter v0.2](platform/release-charters/v0.2.md) – aktiver Meilenstein
- [Risikoregister](platform/risk-register.md)
- [Product Decision Records](platform/decisions/README.md) · [PRDs](platform/prds/README.md)

### Architektur (Ist-Zustand)
- [Architektur-Überblick (arc42-lite)](architecture/README.md)
- [Laufzeit- & Datenflüsse](architecture/runtime-and-dataflows.md)
- [Deployment & Topologie](architecture/deployment.md)
- [Datenmodell & Ownership](architecture/data-model.md)

### Dienste (Service-Handbücher)
- [Dienste-Index](services/README.md) – implementiert vs. `proposed`
- [Model Gateway](services/model-gateway.md) · [Telemetrie/Kosten](services/telemetry-costs.md) · [Identity](services/identity.md)
- Kern-Detailarchitektur: [core/architecture.md](core/architecture.md)

### API
- [Kern-API-Überblick](api/README.md) *(Wahrheit: generiertes OpenAPI / `packages/contracts`)*
- [Contract-Pipeline](core/api.md)

### Betrieb, Test & Security
- [Production Handbook (Index)](operations/README.md) · [CI-Runbook](runbooks/ci.md) · [Monitoring](runbooks/monitoring.md)
- [Teststrategie](testing/strategy.md) · [Testmatrix](testing/test-matrix.md)
- [Security-Überblick](security/README.md) · [Traceability](governance/traceability.md)

### PM Studio (`apps/pm-studio`)
- [PM-Studio-Doku](pm-studio/README.md)

### Vorlagen
- [docs/templates/](templates/) – ADR, PRD, Release-Charter, Service-Doc, Runbook, Test-Evidence

> Doku-Qualitäts-Gate in CI (Frontmatter/Links/Markdown) folgt mit #64. Doku-Verzeichnisse
> für künftige Module (idp/leitstand/rag/flow) entstehen erst mit deren realem
> Implementierungsschnitt — keine leeren Zukunftsordner.

## Onboarding-Routen

| Rolle | Startpunkt |
|---|---|
| **Neue:r Entwickler:in** | [README (Repo-Root)](../README.md) → [arbeitssystem.md](platform/arbeitssystem.md) → [core/architecture.md](core/architecture.md) → [CLAUDE.md](../CLAUDE.md) |
| **Architekt:in** | [vision.md](platform/vision.md) → [roadmap.md](platform/roadmap.md) → ADRs (`platform/adrs/`) → [documentation-policy.md](platform/documentation-policy.md) |
| **Operations** | [runbooks/](runbooks/) → [README-Quickstart](../README.md#quickstart) → `compose.prod.yml` |
| **Auditor:in** | [roadmap.md §Teil 6/7](platform/roadmap.md) → [SECURITY.md](../SECURITY.md) → Run-/Audit-Doku (ab v0.2/v0.4) |
| **Product Owner** | [vision.md](platform/vision.md) → [roadmap.md](platform/roadmap.md) → aktives Release Charter (ab #62) → Issue #44 |

## Wahrheitshierarchie in einem Satz

OpenAPI, `packages/contracts`, Alembic-Migrationen, Settings und Testcode sind
die **maschinelle Wahrheit**; Markdown erklärt und verlinkt sie, dupliziert sie
aber nicht. Details: [documentation-policy.md](platform/documentation-policy.md).
