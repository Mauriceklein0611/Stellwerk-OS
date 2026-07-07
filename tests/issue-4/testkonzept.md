# Testkonzept – Issue #4: Postgres + SQLAlchemy 2 + Alembic + Seed

Workspace: `services/core`.

## Entscheidungen (CORE-ADR-001, Begründung im PR)
- **Synchrones** SQLAlchemy 2 (typed) – einfacher, für Telemetrie-Writes
  ausreichend; async bei Bedarf später.
- **DB-Tests env-gegated** über `STW_TEST_DATABASE_URL` (statt Testcontainers):
  die schnelle Unit-Suite bleibt Docker-frei; CI liefert Postgres als
  Service-Container und setzt die Variable.

## Unit-Tests (ohne DB, immer aktiv)
| Datei | Deckt ab |
|---|---|
| `test_health.py` | `/healthz` 200, `/docs`+`/openapi.json`, **`/readyz` → 503** bei nicht erreichbarer DB |
| `test_request_id.py`, `test_auth.py` | unverändert aus #3 |

## DB-Tests (`test_db.py`, nur mit `STW_TEST_DATABASE_URL`)
| Test | Deckt ab |
|---|---|
| `test_migration_creates_and_drops_schema` | `alembic upgrade head` legt `platform_info` an; `downgrade base` entfernt sie |
| `test_readyz_ok_with_db` | `/readyz` → 200 bei erreichbarer DB |
| `test_seed_is_idempotent` | erster `seed()` füllt, zweiter ändert nichts (Zeilenzahl stabil) |

## Lokal ausführen
```bash
# Postgres starten:
docker run -d --name stw-pg -e POSTGRES_USER=stw -e POSTGRES_PASSWORD=stw \
  -e POSTGRES_DB=stellwerk -p 5432:5432 postgres:16

cd services/core
export STW_DATABASE_URL=postgresql+psycopg://stw:stw@localhost:5432/stellwerk
uv run alembic upgrade head          # Schema anlegen
uv run python scripts/seed.py        # füllt platform_info (idempotent)
uv run python scripts/seed.py        # zweiter Lauf: 0 neue Zeilen

# Gate inkl. DB-Tests:
export STW_TEST_DATABASE_URL=$STW_DATABASE_URL
uv run ruff check . && uv run mypy app && uv run pytest
```

## Definition of Done
- [ ] `alembic upgrade head` erzeugt Schema auf leerer DB; `downgrade base` läuft
- [ ] `/readyz` → 200 nur bei erreichbarer DB (sonst 503)
- [ ] `uv run python scripts/seed.py` idempotent
- [ ] DB-Tests laufen lokal und (ab #8) in CI reproduzierbar
- [ ] `ruff`/`mypy`/`pytest` grün
