---
module: core
type: reference
status: current
updated: 2026-07-21
owner: Maurice
source_of_truth_for: erklärt den Identity-Dienst (Ist = DevAuth)
related_issues: [63]
related_adrs: [ADR-007, ADR-013, ADR-019]
---

# Dienst · Identity

## Verantwortung

Stellt den Aufrufer-Kontext für Kern-Endpunkte bereit. **Ist-Zustand: DevAuth**
(ADR-007) – ein statischer Nutzer, dessen Rolle per Env/Header umschaltbar ist
(`app/auth/`). Es gibt ein `AuthProvider`-Interface als Erweiterungspunkt.

## Ist-Verhalten

- Aktiver Provider: DevAuth (`STW_DEV_ROLE`, Default `admin`).
- Genutzt vom Gateway-Endpunkt und (künftig) weiteren geschützten Routen.
- **Keine** starke Identität, **kein** RBAC-Enforcement, **kein** OIDC.

## Bekannte Grenzen (ehrlich)

DevAuth ist ein Entwicklungs-Stub. `STW_ENV=prod` sollte DevAuth **fail-fast**
verweigern – das ist `proposed` (#56). Rollen sind heute Deko, nicht erzwungen.

## Geplant (`proposed`, v0.4)

Providerneutrales OIDC (JWT via JWKS), `principal_type: human|service`, erzwungene
Rollen `user/auditor/admin`; BFF hält Service-Credential server-only und verwirft
Browser-Identitätsheader.
[ADR-013](../platform/adrs/ADR-013-bff-boundary-identity.md), ADR-019 (Kandidat,
Roadmap).
