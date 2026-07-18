---
module: pm-studio
type: doc
status: current
imported: 2026-07-08
source: projectmind-os
---

# Backend-Plan (ab Meilenstein 6)

## Stack

- **FastAPI** (Python 3.11+), Pydantic v2
- **SQLite** über SQLModel/SQLAlchemy für den Start, Migrationspfad zu PostgreSQL (gleiche ORM-Schicht)
- **Uvicorn** als lokaler Server (`http://localhost:8000`)
- Später: SSE (Server-Sent Events) für Agenten-Fortschritt – einfacher als WebSockets und für unidirektionale Statusupdates ausreichend

## Warum FastAPI statt NestJS

Das gesamte KI-Tooling (LangGraph, Ollama-Python, ChromaDB) ist Python-nativ. Ein TS-Backend würde eine zweite Brücke zur KI-Schicht erfordern. Vorhandene Python-Erfahrung beschleunigt zusätzlich.

## API-Design (v1)

```
POST   /api/ideas                  # Idee anlegen
POST   /api/agents/{id}/run        # Einzelnen Agenten starten
POST   /api/workflows/run          # Pipeline starten (Liste von Agenten)
GET    /api/runs/{run_id}          # Status + Output eines Laufs
GET    /api/runs/{run_id}/stream   # SSE-Fortschritt
GET    /api/projects / [id] ...    # CRUD für Projektdaten
```

Alle Schemas spiegeln die TypeScript-Typen aus `src/types/` (Single Source of Truth: ein `docs/agent-system.md`-Schemaabschnitt, beide Seiten halten sich daran).

## Persistenzmodell

Tabellen: projects, ideas, drafts, requirements, epics, stories, sprints, tasks, risks, agent_runs (mit `input_json`, `output_json`, `status`, `duration_ms`, `model`), retrospectives, reviews.

## Lokale Ausführung

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
