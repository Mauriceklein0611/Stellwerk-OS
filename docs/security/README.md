---
module: platform
type: reference
status: current
updated: 2026-07-21
owner: Maurice
source_of_truth_for: Sicherheits-Ist-Zustand und nachweisbare Schutzgrenzen
related_issues: [63]
related_adrs: [ADR-006, ADR-013, ADR-015, ADR-025, ADR-026]
---

# Security – Überblick

> **Ehrliche Schutzgrenzen statt Marketing.** Keine unbelegten Aussagen wie „vollständig
> compliant", „manipulationssicher" oder „revisionssicher". Meldeweg für Lücken:
> [SECURITY.md](../../SECURITY.md).

## Trust-Grenzen (Ist)

1. **Browser → BFF:** Browser untrusted; keine Secrets/Provider-Keys im Bundle
   (`NEXT_PUBLIC_*` nie vertraulich). *(Eigene BFF-Schicht ist `proposed`, ADR-013.)*
2. **BFF → Core:** `service` und `user` getrennt; heute nur DevAuth (schwach).
3. **Core → Provider:** nur der Gateway spricht Provider (ADR-006).

## Automatisierte Sicherheitsbasis (Ist)

- **Dependabot** (npm/pip/Actions/Docker), **CodeQL** (JS/TS + Python), **Trivy**
  (Kern-Image, blockiert bei behebbaren HIGH/CRITICAL), Lizenz-Report. Details:
  [SECURITY.md](../../SECURITY.md), [../runbooks/ci.md](../runbooks/ci.md).

## Identität & Zugriff (Ist)

DevAuth (statischer Nutzer, Rolle per Env). **Kein** RBAC-Enforcement, **kein** OIDC.
Grenzen und Zielbild: [../services/identity.md](../services/identity.md).

## Datenklassifizierung & Aufbewahrung

**Zielentscheidung** [ADR-015](../platform/adrs/ADR-015-run-data-classification-retention.md):
Metadaten von Inhalten trennen, Redaction, Retention, effektive Höchst-Datenklasse.
Heute gibt es noch keine Run-Payloads; Demo/CI nutzen ausschließlich synthetische Daten.
**Keine** DSGVO-Konformitätszusage ohne konkreten Betriebskontext.

## Agent-/Tool-Sicherheit

**Zielprinzip** ADR-025 (Kandidat): Modell-/Nutzer-/OCR-/Retrieval-Inhalte sind
untrusted; der v0.2-Slice erzeugt nur schema-validierte Daten **ohne Tools/Außenwirkung**.
Provider-Policy je Datenklasse (default-deny) ist `proposed` (ADR-026, v0.5).

## Supply-Chain (geplant, #59)

Externe GitHub Actions per Commit-SHA pinnen; minimale Workflow-Rechte. Bis dahin
sichtbares Restrisiko (Risikoregister R13).

## Nachweisbare Schutzgrenze – Sprachregel

Vor v0.4 ist die Ereignishistorie **kein** Compliance-Audit; Schutz durch eine
App-DB-Rolle ist **nicht** DBA-manipulationssicher. Siehe
[goals-and-non-goals.md](../platform/goals-and-non-goals.md).
