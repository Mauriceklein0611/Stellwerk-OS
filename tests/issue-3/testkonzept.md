# Testkonzept – Issue #3: FastAPI-Skeleton

Workspace: `services/core`. Alle automatisierten Tests laufen dort via
`uv run pytest`.

## Automatisierte Tests (`services/core/tests/`)

| Datei | Deckt ab |
|---|---|
| `test_health.py` | `/healthz` → 200 `{"status":"ok"}`, `/readyz` → 200, `/docs` + `/openapi.json` erreichbar |
| `test_request_id.py` | Middleware erzeugt `X-Request-Id`, wenn keiner mitkommt; reicht vorhandenen Header unverändert durch |
| `test_auth.py` | DevAuth über `get_current_user`: `/api/v1/me` → Nutzer `dev`/`admin`; Rolle per `STW_DEV_ROLE` umschaltbar (→ `auditor`) |

## Qualitäts-Gate (im Ordner `services/core`)

```bash
uv run ruff check .
uv run mypy app
uv run pytest
```

## Manuelle Smoke-Prüfung

```bash
cd services/core
uv run uvicorn app.main:create_app --factory --port 8000
# In zweitem Terminal:
curl -i localhost:8000/healthz        # 200 + Header X-Request-Id
curl localhost:8000/api/v1/me         # {"username":"dev","role":"admin"}
# Logs erscheinen als JSON-Zeilen mit "request_id".
open http://localhost:8000/docs       # Swagger-UI
```

## Definition of Done

- [ ] `uv run uvicorn app.main:create_app --factory` startet; `/healthz` → 200; `/docs` erreichbar
- [ ] Logs sind JSON mit `request_id`; `ruff` und `mypy` fehlerfrei
- [ ] DevAuth liefert Nutzer+Rolle über Dependency; per Env umschaltbar
- [ ] `uv run pytest` grün
