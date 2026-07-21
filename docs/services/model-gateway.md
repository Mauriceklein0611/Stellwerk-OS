---
module: core
type: reference
status: current
updated: 2026-07-21
owner: Maurice
source_of_truth_for: erklärt den Model-Gateway-Dienst (Wahrheit = OpenAPI + Code)
related_issues: [63]
related_adrs: [ADR-006]
---

# Dienst · Model Gateway

> Schnittstellen-Wahrheit: generiertes OpenAPI + [`packages/contracts`](../core/api.md).
> Detaillierte Kern-Architektur: [../core/architecture.md](../core/architecture.md).

## Verantwortung

**Ein einziger Weg für alle LLM-Aufrufe** der Plattform (ADR-006). Hält
Authentifizierung, Modell-Allowlist und die Telemetrie-Naht an einer Stelle. Kein Modul
spricht einen Provider direkt; ein Provider-SDK außerhalb des Gateways ist verboten.

## Konsumenten

Fachmodul-BFFs (künftig) und interner Code. Heute authentifiziert via **DevAuth**.

## API (Ist)

- `POST /api/v1/gateway/chat` → `ChatResult{content, usage{prompt,completion}, latency_ms, provider, model}`.
- Kein Streaming (v1 bewusstes Nicht-Ziel; SSE ist `proposed`).

## Provider-Auswahl (nur per Env)

`STW_GATEWAY_PROVIDER=stub|ollama` schaltet ohne Codeänderung; `STW_GATEWAY_MODELS`
ist die CSV-Allowlist. Bausteine: `app/gateway/{base,stub,ollama,registry,errors}.py`.
Der **Stub** ist deterministisch und Grundlage **aller** Tests (ADR-006, kein Live-LLM
im Pflicht-Gate).

## Fehlersemantik

| Situation | Status | `error` |
|---|---|---|
| Modell nicht auf Allowlist | 400 | `unknown_model` |
| Provider-Fehler (5xx/Netz) | 502 | `provider_error` |
| Provider-Timeout | 504 | `provider_timeout` |
| Fehlkonfigurierter Provider | 500 | `gateway_misconfigured` |
| Ungültiger Body | 422 | (FastAPI) |

## Degradation

Fällt der Provider aus, endet der Aufruf mit definiertem `502`/`504`; Telemetrie wird
dennoch erfasst. Der Ollama-Provider hat Timeout/Retry/Backoff.

## Geplant (`proposed`)

Hermetischer Ollama-Provider (MockTransport, robuste Shape-Prüfung) #58; Cloud-Provider
(Azure/OpenAI) v0.5/v0.7; Provider-Policy je Datenklasse (ADR-026); Budget-/Rate-Guardrails
(ADR-020).
