---
module: platform
type: adr
status: accepted
updated: 2026-07-21
owner: Maurice
related_issues: [53, 44]
related_adrs: [ADR-011, ADR-019]
superseded_by: null
---

# ADR-013 · BFF-Grenze und Identitäts-Propagation

- **Status:** accepted
- **Datum:** 2026-07-21
- **Betrifft:** Modul-BFF (Next.js Server Routes), Core-Identity, Telemetrie

## Kontext

Der Browser ist untrusted (Trust-Grenze 1). Trotzdem muss der Core je Run **zwei**
Kontexte kennen: welches **Modul** (Service) den Aufruf macht und welcher **Mensch**
ihn ausgelöst hat. In v0.2 gibt es noch kein OIDC; die menschliche Identität ist
schwach. Es muss verhindert werden, dass der Browser Identität fälscht oder Secrets
sieht.

## Betrachtete Optionen

1. **API-Key im Browser-Bundle / `NEXT_PUBLIC_*`:** einfach, aber Secret-Leak,
   Provider-Zugriff am Gateway vorbei denkbar — verworfen.
2. **Ungeprüfte On-behalf-of-Header vom Browser:** flexibel, aber fälschbar —
   verworfen.
3. **BFF hält Service-Credential server-only, verwirft Browser-Identität, setzt
   Kontext selbst (gewählt).**

## Entscheidung

Browser-Code ruft **ausschließlich eigene Next-Server-Routen** (BFF) auf. Die BFF
hält **Core-URL und Service-Credential server-only**. Sie **verwirft** vom Browser
gesendete `X-Stw-*`-Identitätsheader und setzt selbst **zwei getrennte Kontexte**:

- `service` = authentifiziertes Modul (z. B. `pms`),
- `user` = menschlicher Nutzer aus der **serverseitigen** Session.

In v0.2 wird der Nutzer als **`unverified_dev`** markiert; weder Core noch Telemetrie
behandeln ihn als starke Identität. `user` und `service` sind **getrennte Felder** —
nie vermischt. Der spätere OIDC-Fluss (ADR-019) darf diese Feldsemantik **nicht
brechen**.

## Nicht-Ziele

- Kein OIDC/JWT/RBAC in v0.2 (→ v0.4, ADR-019).
- Keine starke Authentisierung des Menschen; `unverified_dev` ist bewusst schwach.
- Keine Autorisierungsentscheidungen anhand des `user`-Feldes in v0.2.

## Konsequenzen

- **Positiv:** keine Secrets/Provider-Keys im Browser; fälschungsresistente
  Herkunft; stabile Feldsemantik, auf der v0.4 aufbaut.
- **Kosten:** jedes Modul braucht eine BFF-Schicht mit server-only Konfiguration;
  ein Test muss belegen, dass `X-Stw-*` verworfen wird und `NEXT_PUBLIC_*` frei von
  Geheimnissen ist.
- **Folgeänderungen:** #44 baut die PMS-BFF entsprechend; `service`/`user_context`
  fließen in Telemetrie (ADR-014) und Run-Events (ADR-012).
