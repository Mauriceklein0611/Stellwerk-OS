# Testkonzept – Issue #6: Model Gateway v1 (Provider-Interface, Ollama + Stub)

Workspace: `services/core`. Alle automatisierten Tests laufen gegen den
**Stub-Provider** (deterministisch, kein Netzwerk, ADR-006). Der Ollama-Pfad
wird lokal manuell geprüft.

## Entscheidungen
- **Ein Endpunkt für alle LLM-Aufrufe:** `POST /api/v1/gateway/chat`,
  authentifiziert via DevAuth-Dependency.
- **Stub als Test-Fundament:** kein Test spricht Ollama direkt an
  (grep-Beweis, siehe unten). Fehlerpfade werden über einen injizierten Stub
  (`error=…`) bzw. eine verweigerte Verbindung simuliert.
- **Kein Streaming in v1** (Nicht-Ziel, dokumentiert in
  `docs/core/architecture.md`).

## Unit-Tests (`tests/test_gateway.py`, ohne DB/Netzwerk)
| Test | Deckt ab |
|---|---|
| `test_stub_chat_is_deterministic_with_usage` | Stub liefert reproduzierbar inkl. `usage` |
| `test_unknown_model_returns_400` | Modell nicht auf Allowlist → **400** `unknown_model` |
| `test_provider_error_maps_to_502` | injizierter Provider-Fehler → **502** |
| `test_provider_timeout_maps_to_504` | injizierter Timeout → **504** |
| `test_scripted_stub_returns_sequence` | injizierbares Antwort-Skript |
| `test_empty_messages_is_422` | Body-Validierung (min. 1 Nachricht) |
| `test_provider_switch_via_env_only` | Provider-Wechsel nur per Settings, unbekannt → Fehler |
| `test_ollama_connection_failure_maps_to_provider_error` | Ollama-Fehlerpfad ohne Server → `ProviderError` |
| `test_stub_result_shape_matches_contract` | `ChatResult`/`usage.total_tokens` |

## Beweis: kein Direkt-Aufruf von Ollama außerhalb des Providers
```bash
cd services/core
# Nur app/gateway/ollama.py darf httpx/Ollama sprechen:
grep -rn "httpx\|/api/chat\|11434" app tests | grep -v "app/gateway/ollama.py"
# erwartete Ausgabe: (leer)
```

## Ollama manuell (lokal, optional)
```bash
# Ollama bereitstellen (oder: docker compose --profile llm up -d) und Modell ziehen:
ollama pull llama3.2

cd services/core
export STW_GATEWAY_PROVIDER=ollama
export STW_OLLAMA_URL=http://localhost:11434
export STW_GATEWAY_MODELS=llama3.2
uv run uvicorn app.main:create_app --factory --port 8000 &

curl -s localhost:8000/api/v1/gateway/chat \
  -H 'content-type: application/json' \
  -d '{"model":"llama3.2","messages":[{"role":"user","content":"Sag Hallo"}]}'
# → echte Antwort inkl. usage/latency_ms/provider="ollama"
```

## Lokal ausführen (Gate)
```bash
cd services/core
uv run ruff check . && uv run mypy app && uv run pytest
```

## Definition of Done
- [ ] Stub-Chat deterministisch inkl. `usage`; Ollama (manuell) liefert echte Antwort
- [ ] Provider-Wechsel nur per Env (`STW_GATEWAY_PROVIDER`), ohne Codeänderung
- [ ] Fehlerbilder 400/502/504 getestet
- [ ] grep-Beweis: kein Modul-/Testcode ruft Ollama direkt
- [ ] `ruff`/`mypy`/`pytest` grün
