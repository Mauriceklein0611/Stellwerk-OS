---
module: core
type: architecture
status: current
updated: 2026-07-07
---

# Stellwerk Kern – Architektur

Lebendige Architekturdoku des Kerns (`services/core`). Wächst mit den Issues;
dieser Stand deckt den **Model Gateway v1** (Issue #6, ADR-006) ab.

## Model Gateway (ADR-006)

Ein einziger Weg für **alle** LLM-Aufrufe der Plattform:
`POST /api/v1/gateway/chat`. Module rufen nie einen Anbieter direkt – sie gehen
über den Gateway. Das hält Authentifizierung, Modell-Allowlist und (ab #7)
Telemetrie an einer Stelle.

### Bausteine

| Baustein | Datei | Aufgabe |
|---|---|---|
| Vertrag | `app/gateway/base.py` | `ChatMessage`, `Usage`, `ChatResult`, `ChatRequest`, `Provider`-Protocol |
| Stub-Provider | `app/gateway/stub.py` | deterministisch, kein Netzwerk – Grundlage **aller** Tests |
| Ollama-Provider | `app/gateway/ollama.py` | HTTP gegen `STW_OLLAMA_URL/api/chat`, Timeout/Retry/Backoff |
| Registry | `app/gateway/registry.py` | wählt den Provider **allein aus den Settings** |
| Fehler | `app/gateway/errors.py` | `GatewayError`-Hierarchie mit HTTP-Status |
| Endpunkt | `app/api/gateway.py` | authentifiziert (DevAuth), prüft Allowlist |

### Provider-Auswahl (nur per Env)

`STW_GATEWAY_PROVIDER=stub|ollama` schaltet den aktiven Provider **ohne
Codeänderung**. `STW_GATEWAY_MODELS` ist die Modell-Allowlist (CSV). Der
Ollama-Provider liest `STW_OLLAMA_URL` sowie `STW_GATEWAY_TIMEOUT_S`,
`STW_GATEWAY_RETRIES`, `STW_GATEWAY_BACKOFF_S`.

### Antwort trägt `usage`

`ChatResult` enthält bereits `usage{prompt_tokens, completion_tokens}`,
`latency_ms`, `provider`, `model`. Das ist die **Naht für die Telemetrie**
(Issue #7): dort werden Gateway-Calls zu tokens/costs/latency in der DB und
unter `/metrics`.

### Fehlerbilder

| Situation | Status | `error` |
|---|---|---|
| Modell nicht auf der Allowlist | `400` | `unknown_model` |
| Provider-Fehler (5xx/Netz) | `502` | `provider_error` |
| Provider-Timeout | `504` | `provider_timeout` |
| Fehlkonfigurierter Provider-Name | `500` | `gateway_misconfigured` |
| Ungültiger Request-Body | `422` | (FastAPI-Validierung) |

Ein zentraler Exception-Handler (`app/main.py`) übersetzt `GatewayError` in das
jeweilige HTTP-Bild.

## Nicht-Ziele (v1)

- **Kein Streaming.** v1 antwortet ausschließlich als Ganzes (`stream=False`).
  Streaming ist ein späteres Thema und bewusst ausgeklammert.

## Erweiterungspunkt: Azure-Provider (nur Doku)

Ein `AzureOpenAIProvider` implementiert dasselbe `Provider`-Protocol
(`chat(messages, model, params) -> ChatResult`) und wird in `build_provider`
unter `STW_GATEWAY_PROVIDER=azure` registriert – Endpunkt, Fehlerbilder und
Telemetrie-Naht bleiben unverändert. Kein Konsument merkt den Wechsel.
