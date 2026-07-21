---
module: platform
type: reference
status: current
updated: 2026-07-21
owner: Maurice
related_issues: [53]
---

# ADR-Index (plattformweit)

Architecture Decision Records für **plattformweite Grenzentscheidungen**. Format
und Regeln: [documentation-policy.md §5](../documentation-policy.md). Vorlage:
[templates/adr-template.md](../../templates/adr-template.md).

## Nummernkreise (ADR-003)

- **`ADR-###`** – globale, plattformweite Serie (dieses Verzeichnis).
- **`CORE-ADR-###`, `PMS-ADR-###`, …** – rein modulinterne Entscheidungen behalten
  gemäß ADR-003 ihre **eigenen** Nummernkreise und liegen bei ihrem Modul
  (`docs/<modul>/adrs/`), sobald sie entstehen. Eine modulinterne Entscheidung
  wird nicht in die globale Serie gehoben, nur weil sie zuerst hier auffällt.

## Status-Werte

`proposed` → `accepted` → ggf. `superseded` / `rejected`. Angenommene ADRs werden
nicht rückwirkend inhaltlich umgeschrieben; Änderungen erzeugen ein neues ADR mit
`supersedes` / `superseded_by`.

## ADR-001 – ADR-010

Die Grundentscheidungen der v0.1-Foundation sind als Tabelle in der eingefrorenen
[build-spec.md §ADR](../build-spec.md) dokumentiert (Name, Ticketsystem, ID-System,
Versionierung, Gateway-Stub/ADR-006, DevAuth/ADR-007, Python-Stack, Monorepo-Tooling,
Docs-as-Code). Sie werden hier nicht dupliziert.

## ADR-011 – ADR-015 (v0.2, `accepted`)

| ADR | Titel | Status |
|---|---|---|
| [ADR-011](ADR-011-runtime-and-definitions-ownership.md) | Runtime- und Definitions-Ownership | accepted |
| [ADR-012](ADR-012-lifecycles-idempotency-execution.md) | Getrennte Lebenszyklen, Idempotenz, Ausführung (v0.2) | accepted |
| [ADR-013](ADR-013-bff-boundary-identity.md) | BFF-Grenze und Identitäts-Propagation | accepted |
| [ADR-014](ADR-014-cost-pricing-provenance.md) | Kosten- und Preisprovenienz | accepted |
| [ADR-015](ADR-015-run-data-classification-retention.md) | Run-Daten, Klassifizierung und Aufbewahrung | accepted |

## ADR-016 – ADR-027 (Kandidaten, `proposed`)

Spätere tragende Entscheidungen bleiben bewusst **Kandidaten** und liegen als
Volltext in der [roadmap.md §Teil 2](../roadmap.md). Sie werden **erst mit
Aktivierung ihres Meilensteins** als angenommene ADR-Dateien hierher ausgearbeitet
— nicht vorsorglich eingecheckt: ADR-016/017 (v0.3), ADR-018/019/021 (v0.4),
ADR-020/026 (v0.5), ADR-022/024 (v0.6), ADR-023 (ab IDP/RAG), ADR-025 (gestuft ab
v0.2), ADR-027 (vor dem zweiten API-Konsumenten).
