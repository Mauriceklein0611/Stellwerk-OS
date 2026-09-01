# syntax=docker/dockerfile:1
#
# Multi-Stage-Build des Stellwerk-Kerns.
#   Stage 1 (builder): uv löst die gelockten Abhängigkeiten in ein .venv auf.
#   Stage 2 (runtime):  schlankes python-slim-Image, non-root, nur .venv + Code.
# psycopg[binary] bringt libpq mit, daher braucht das Runtime-Image keine
# System-Postgres-Bibliotheken.

# ---------- Builder ----------
FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim AS builder

# Bytecode vorkompilieren (schnellerer Kaltstart), Pakete kopieren statt linken
# (Layer-Cache über Bind-Mount hinweg stabil).
ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=never

WORKDIR /app

# 1) Nur Lock + Projektmetadaten: Abhängigkeits-Layer bleibt gecacht, solange
#    sich uv.lock/pyproject.toml nicht ändern.
COPY pyproject.toml uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-install-project --no-dev

# 2) Quellcode dazu und das Projekt selbst installieren.
COPY . .
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev

# ---------- Runtime ----------
FROM python:3.14-slim-bookworm AS runtime

# Non-root-Benutzer (Akzeptanzkriterium: Container laufen non-root).
RUN groupadd --system app \
    && useradd --system --gid app --home-dir /app --shell /usr/sbin/nologin app

WORKDIR /app

# Fertiges Venv + Anwendung aus dem Builder übernehmen (inkl. alembic/, scripts/).
COPY --from=builder --chown=app:app /app /app

# Das .venv nach vorne in den PATH, damit uvicorn/alembic direkt aufrufbar sind.
ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

USER app

EXPOSE 8000

# Liveness/Readiness ohne curl (nicht im slim-Image): reines Python-urllib gegen
# /readyz – grün nur bei erreichbarer, migrierter DB.
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=6 \
    CMD ["python", "-c", "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/readyz', timeout=4).status==200 else 1)"]

# App-Factory (siehe app/main.py: create_app()).
CMD ["uvicorn", "app.main:create_app", "--factory", "--host", "0.0.0.0", "--port", "8000"]
