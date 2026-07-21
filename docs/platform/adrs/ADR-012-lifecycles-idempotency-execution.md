---
module: platform
type: adr
status: accepted
updated: 2026-07-21
owner: Maurice
related_issues: [53, 44]
related_adrs: [ADR-011, ADR-015]
superseded_by: null
---

# ADR-012 · Getrennte Lebenszyklen, Idempotenz und Ausführung (v0.2)

- **Status:** accepted
- **Datum:** 2026-07-21
- **Betrifft:** Agent Runtime, Run-/Workflow-/Gate-Aggregate, `POST /api/v1/agent-runs`

## Kontext

Ein Agent-Run, ein Workflow, ein Step und ein Review-Gate haben **unterschiedliche**
Lebenszyklen. Werden sie in ein Statusfeld gemischt, entstehen unklare Übergänge und
nicht abbildbare Zustände. Zusätzlich muss die Run-Erstellung gegen Transport-Retries
und Doppelklicks abgesichert sein, ohne Doppelläufe (und Doppelkosten) zu erzeugen.

## Betrachtete Optionen

1. **Ein gemeinsames Statusfeld + freie PATCHes:** einfach, aber unklare Invarianten,
   Race Conditions, keine Konfliktsicherheit.
2. **Getrennte Aggregate + Commands + Idempotenz-Schlüssel (gewählt).**
3. **Sofort asynchrone Ausführung mit Worker/Broker:** mächtiger, aber unbelegter
   Betriebsaufwand für einen Einzelschritt.

## Entscheidung

**Getrennte Aggregate mit je eigenen Kernzuständen:**

| Aggregat | Erlaubte Kernzustände |
|---|---|
| `agent_run` (v0.2) | `pending → running → completed\|failed`; ab async zusätzlich `cancel_requested → cancelled` |
| `workflow_run` (v0.3) | `pending → running → awaiting_review → completed\|failed`; Abbruch `cancel_requested → cancelled` |
| `step_run` (v0.3) | `pending → running → completed\|failed`; Rerun = neuer Versuch |
| `review_gate` (v0.3) | `open → approved\|rejected\|superseded` |

**Idempotenz:** `POST /agent-runs` verlangt einen für die logische Aktion stabilen
`Idempotency-Key`. Der Core speichert Request-Hash und Ergebnis unter
`(service_principal, idempotency_key)`: gleicher Key + gleicher Payload → **derselbe
Run**; gleicher Key + anderer Payload → **409**. UI/BFF behalten den Key über reine
Transport-Retries hinweg. Review-Aktionen sind **Commands** (`approve`, `reject`,
`edit_and_approve`, `rerun_with_feedback`) mit Actor, erwarteter Aggregatversion und
eigenem Idempotency-Key; **freie Status-PATCHes sind verboten**. Jeder Übergang
schreibt ein `run_event`.

**Abbruch** ist ein idempotenter Command: aus `pending` direkt `cancelled`, aus
`running` zunächst `cancel_requested`. Das Stoppen eines bereits übertragenen
Provider-Calls ist **best effort** — der Provider kann trotzdem verarbeiten und
abrechnen. Späte Provider-Ergebnisse dürfen einen abgebrochenen Run **nicht** wieder
auf `completed` setzen; Usage/Kosten werden dennoch korreliert. Für den synchronen
v0.2-Slice ist ein Cancel-Endpunkt **noch nicht Pflicht**; Timeout und Reconciler
sind die Übergangslösung.

**Ausführung v0.2:** Einzelschritt **synchron** im Request, aber Zustand wird **vor
und nach** jedem Gateway-Aufruf persistiert. Ein Startup-**Reconciler** markiert nur
ausreichend alte `running`-Runs als `failed(interrupted)`; die **Single-Instance**-Grenze
wird dokumentiert. Ein Repair-Retry ist ein **eigener, kostenpflichtiger, verlinkter**
Gateway-Call. Ab v0.3 liefert der Start-Endpunkt `202 Accepted` + Polling.

## Nicht-Ziele

- Kein Worker/Broker in v0.2 (folgt erst bei belegter Parallelitäts-/Laufzeitgrenze,
  neues ADR).
- Keine Multi-Instance-Koordination (In-Memory/Single-Instance bleibt sichtbar).
- Kein Pflicht-Cancel-Endpunkt im synchronen Slice.

## Konsequenzen

- **Positiv:** klare Invarianten je Aggregat; sichere Retries; ehrliche
  Zombie-Run-Behandlung; konfliktsichere Reviews ab v0.3.
- **Kosten:** Eindeutigkeitsbedingung + Request-Hash-Persistenz; Reconciler-Logik;
  Command-Modell statt PATCH.
- **Folgeänderungen:** #44 implementiert `agent_run` + Idempotenz + Reconciler; v0.3
  ergänzt Workflow/Step/Gate (ADR-016/017).
