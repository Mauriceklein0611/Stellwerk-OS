---
module: platform
type: adr
status: accepted
updated: 2026-07-21
owner: Maurice
related_issues: [53, 60]
related_adrs: [ADR-012, ADR-026]
superseded_by: null
---

# ADR-014 · Kosten- und Preisprovenienz

- **Status:** accepted
- **Datum:** 2026-07-21
- **Betrifft:** Telemetrie (`gateway_calls`), Model Gateway, Leitstand (später)

## Kontext

Heute berechnet [pricing.py](../../../services/core/app/telemetry/pricing.py) bei
unbekanntem Preis `0.0` und [models.py](../../../services/core/app/db/models.py)
speichert `cost_estimate` als **nicht-nullable** Zahl. Damit ist „Preis unbekannt"
nicht von „kostet 0" unterscheidbar, und es fehlt die Herkunft (real/simuliert/
unbekannt) sowie die Trennung von Service und Nutzer. Der Leitstand (v0.6) und die
Run-Kostenanzeige (#44) würden Demo-, lokale und Cloud-Kosten vermischen.

## Betrachtete Optionen

1. **Weiter `0` bei Unbekannt:** einfach, aber fachlich falsch — verworfen.
2. **Kosten nur als Zahl ohne Provenienz:** unzureichend für FinOps-Unterscheidung.
3. **Provenienzfelder + NULL-Semantik (gewählt).**

## Entscheidung

`gateway_calls` erhält: `currency`, `pricing_status ∈ {real, simulated, unknown}`,
`price_version`, `service`, `user_context` und optional `run_id`.

- **Unbekannter Preis** ⇒ `cost_estimate = NULL` **und** `pricing_status = unknown`;
  **niemals 0**.
- Echte Periodenpreise ⇒ `real` + `price_version`; Stub/Demo ⇒ `simulated`.
- Ein **Run aggregiert** Kosten über verlinkte Gateway-Calls, **ohne** sie als zweite
  Wahrheit zu duplizieren.
- Summary und UI zeigen Provider, Modell und **Provenienz**; simulierte Werte sind
  **sichtbar markiert**.
- Preisperioden werden auf **Überlappungen** geprüft (Überlappung = Startfehler);
  **Lücken** sind zulässig, führen aber zu `unknown`. Jede externe Preisquelle trägt
  `last_verified`.

## Nicht-Ziele

- Keine Budget-/Guardrail-Durchsetzung (→ v0.5, ADR-020).
- Kein Provider-Policy-Routing (→ ADR-026).
- Keine zweite Kostenwahrheit auf Run-Ebene.

## Konsequenzen

- **Positiv:** Cloud-, lokale und Demo-Kosten bleiben **fachlich unterscheidbar**,
  bevor der Leitstand darauf aufbaut; ehrliche NULL-Semantik.
- **Kosten:** additive, nullbar-sichere Alembic-Migration; `record_call` nimmt
  `service`/`user_context` getrennt entgegen; Contracts neu generieren (driftfrei).
- **Folgeänderungen:** umgesetzt in **#60 (E3.1)**; #44 verlinkt Gateway-Calls an den
  Run und zeigt Provenienz am Draft.
