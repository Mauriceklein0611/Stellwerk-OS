# Testkonzept – Issue #5: Compose-Profile + Multi-Stage-Dockerfiles + Makefile

Ziel: das Enterprise-Installationsversprechen *„frischer Klon → ein Befehl →
grüne Plattform“* manuell und reproduzierbar nachweisen. Es gibt hier keine
automatisierte Suite (Infrastruktur/Compose); stattdessen die folgende
**Install-Checkliste**.

## Entscheidung (CORE-ADR-001, Begründung im PR)
- **Separater `migrate`-Service** statt Entrypoint-Hook: `alembic upgrade head`
  läuft als kurzlebiger Job genau einmal, der Kern startet via
  `depends_on: condition: service_completed_successfully`. Migration einmalig
  (nicht pro Replica), schlanker Kern-Start, isoliertes Migrations-Log.

## Voraussetzungen
- Docker mit Compose v2 (`docker compose version`).
- Für `make lint` / `make test`: lokales `uv` (die Container-Ziele brauchen es nicht).

## A) Ein-Befehl-Installation (Kern-Akzeptanz)
```bash
cp .env.example .env
make up            # = docker compose --profile core up -d --build
```
- [ ] Build läuft ohne Handarbeit durch; `migrate` beendet sich mit Code 0.
- [ ] `docker compose --profile core ps` → `postgres` und `core` sind `healthy`.
- [ ] `curl -fsS localhost:8000/healthz` → `{"status":"ok"}` (200).
- [ ] `curl -fsS localhost:8000/readyz` → `{"status":"ready"}` (200, DB erreichbar).
- [ ] `curl -fsS localhost:8000/openapi.json` liefert das Schema; `/docs` lädt.

## B) Seed idempotent
```bash
make seed          # erster Lauf: füllt platform_info
make seed          # zweiter Lauf: 0 neue Zeilen
```
- [ ] Erster Lauf meldet neu eingefügte Zeilen, zweiter Lauf `0 neue Zeile(n)`.

## C) Non-root & Prod-Overlay
```bash
docker compose --profile core exec core id      # erwartet: uid≠0 (Benutzer app)
docker compose -f docker-compose.yml -f compose.prod.yml --profile core config
```
- [ ] `id` im Kern-Container zeigt **nicht** uid=0 (non-root).
- [ ] `... config` gegen das Prod-Overlay ist valide (kein Fehler) und zeigt
      `restart: unless-stopped`, Ressourcen-Limits und `logging`-Rotation.

## D) LLM-Profil (Ollama erreichbar vom Kern)
```bash
docker compose --profile llm up -d
docker compose --profile llm exec core \
  python -c "import urllib.request; print(urllib.request.urlopen('http://ollama:11434/api/tags', timeout=5).status)"
```
- [ ] `ollama` startet zusätzlich und wird `healthy`.
- [ ] Aufruf aus dem Kern-Container gegen `http://ollama:11434` liefert `200`
      (Netzwerk-Erreichbarkeit; der Gateway-Consumer kommt in #6).

## E) Aufräumen
```bash
make down                                   # Container weg, Volumes bleiben
docker compose --profile llm down -v        # inkl. Volumes (pgdata, ollama-models)
```

## Definition of Done
- [ ] A–D vollständig grün auf einem frischen Klon.
- [ ] Container laufen non-root; `config` gegen prod-Overlay valide.
- [ ] README-Quickstart entspricht dem tatsächlichen Verhalten.
- [ ] Lokales Gate weiter grün: `cd services/core && uv run ruff check . && uv run mypy app && uv run pytest`.
