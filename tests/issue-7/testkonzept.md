# Testkonzept – Issue #7: Telemetrie (Gateway-Calls → Tokens/Kosten/Latenz + /metrics)

Workspace: `services/core`. Schreibpfad zuerst – der Verbraucher (Leitstand)
kommt später. Unit-Tests bleiben Docker-frei; der reale DB-Schreibpfad und die
Aggregation laufen env-gegated (`STW_TEST_DATABASE_URL`).

## Entscheidungen
- **Schreibpfad darf den Request nie scheitern lassen:** Fehler beim Erfassen →
  Log-Warnung, Chat-Call läuft weiter (`recorder.record_call`). Metriken
  (in-memory) und DB-Persistenz sind getrennt gekapselt.
- **Preisperioden:** `app/telemetry/prices.json` mit `valid_from/valid_to`
  (Muster azure_openai_prices.json). Lokale Modelle tragen `simulated: true`.
- **Unit-Suite Docker-frei:** `get_session` wird in Unit-Tests auf einen No-op
  gestellt (`tests/_dbstub.py`), damit der Telemetrie-Commit keine echte DB
  braucht. Der reale Schreibpfad ist in `test_telemetry_db.py` abgedeckt.
- **Engine-`connect_timeout=5`s:** eine nicht erreichbare DB scheitert schnell,
  statt den Request in den OS-Timeout laufen zu lassen.

## Unit-Tests (`test_telemetry_unit.py`, immer aktiv)
| Test | Deckt ab |
|---|---|
| `test_price_period_selects_by_timestamp` | richtige Periode je ts (gpt-4o Preissenkung 2025) |
| `test_estimate_cost_uses_period_price` | Kostenformel gegen Periodenpreis |
| `test_estimate_cost_unknown_model_is_zero` | unbekanntes Modell → 0.0 |
| `test_metrics_endpoint_exposes_counters` | `/metrics` liefert die Serien |
| `test_chat_increments_call_counter` | Chat erhöht `stw_gateway_calls_total` |
| `test_telemetry_failure_does_not_break_chat` | simulierter Persist-Fehler → Chat bleibt 200 |

## DB-Tests (`test_telemetry_db.py`, nur mit `STW_TEST_DATABASE_URL`)
| Test | Deckt ab |
|---|---|
| `test_stub_chat_creates_one_record_with_cost` | **genau ein** gateway_calls-Datensatz, Kosten aus der zum ts gültigen Periode |
| `test_summary_matches_seed` | Summary-Summen == direkte DB-Aggregation; Seed idempotent (50 → 0) |
| `test_summary_window_excludes_old_calls` | `days`-Fenster filtert korrekt |

## Lokal ausführen
```bash
# Test-Postgres:
docker run -d --name stw-pg -e POSTGRES_USER=stw -e POSTGRES_PASSWORD=stw \
  -e POSTGRES_DB=stellwerk_test -p 5544:5432 postgres:16-alpine

cd services/core
export STW_DATABASE_URL=postgresql+psycopg://stw:stw@localhost:5544/stellwerk_test
uv run alembic upgrade head
uv run python scripts/seed.py            # platform_info 3, gateway_calls 50
uv run python scripts/seed.py            # zweiter Lauf: 0 / 0 (idempotent)

# Gate inkl. DB-Tests:
export STW_TEST_DATABASE_URL=$STW_DATABASE_URL
uv run ruff check . && uv run mypy app && uv run pytest
```

## Live-Smoke (manuell)
```bash
uv run uvicorn app.main:create_app --factory --port 8078 &
curl -s localhost:8078/api/v1/gateway/chat -H 'content-type: application/json' \
  -d '{"model":"stub-echo","messages":[{"role":"user","content":"Hallo"}]}'
# gateway_calls +1; /metrics zeigt stw_gateway_tokens_total{...}
curl -s 'localhost:8078/api/v1/telemetry/summary?days=30'
```

## Definition of Done
- [ ] Stub-Chat erzeugt genau einen gateway_calls-Datensatz mit plausibler Kostenberechnung
- [ ] `/metrics` liefert die Zähler; simulierter Telemetrie-Ausfall bricht den Chat nicht
- [ ] Summary-Endpoint korrekt gegen Seed-Daten
- [ ] `ruff`/`mypy`/`pytest` grün
