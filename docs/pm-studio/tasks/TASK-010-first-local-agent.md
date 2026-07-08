---
module: pm-studio
type: doc
status: frozen
imported: 2026-07-08
source: projectmind-os
---

# TASK-010: Erster lokaler Agent (Ollama)

**Meilenstein:** 6 · **Branch:** `feat/task-010-first-local-agent`

## Ziel
Echter Projektentwurfs-Agent: FastAPI-Backend ruft Ollama (qwen2.5:7b-instruct) auf, validiert den JSON-Output gegen Pydantic, speichert in SQLite; Frontend nutzt den neuen `ApiAgentService`.

## Kontext
Erster Schritt von Simulation zu echter KI. Nur EIN Agent – Orchestrierung folgt in M7.

## Betroffene Dateien
- `backend/app/main.py`, `app/models.py` (Pydantic: ProjectIdea, ProjectDraft), `app/db.py` (SQLModel, SQLite), `app/agents/draft_agent.py`, `app/prompts/draft.md`
- `backend/requirements.txt`, `backend/tests/test_draft_agent.py`
- `src/lib/api-agent-service.ts` (implementiert `AgentService`, vorerst nur `runDraft`)
- `.env.example` (OLLAMA_URL, MODEL)

## Technische Anforderungen
- Voraussetzung lokal: `ollama pull qwen2.5:7b-instruct`
- Endpoint `POST /api/agents/draft/run` (Body: ProjectIdea) → ProjectDraft + run_id
- Ollama-Call mit `format` = JSON-Schema des ProjectDraft, `temperature` 0.4, `num_ctx` 8192, Timeout 120 s
- Validierung mit Pydantic; bei Fehler 1 Repair-Retry (Fehlermeldung in den Prompt)
- AgentRun in SQLite: input_json, output_json, status, duration_ms, model, prompt_version
- CORS für http://localhost:3000
- Frontend: Feature-Flag/Env entscheidet Mock vs. API; Fehler-Toast bei Backend offline
- Pytest: Schema-Test mit fixem Beispiel-Input (markiert `@pytest.mark.llm`, da modellabhängig) + reiner Validierungs-Unit-Test ohne LLM

## Akzeptanzkriterien
- [ ] Echte Idee → valider, gespeicherter Entwurf, sichtbar in der Projektdetailseite
- [ ] Ungültiges LLM-JSON führt zu Retry, danach sauberem Fehler im UI
- [ ] Lauf inkl. Dauer und Modell in DB und Agenten-Detailseite sichtbar
- [ ] Pytest (ohne llm-Marker) und alle Frontend-Checks grün

## Testschritte
1. Ollama starten, Backend starten, Frontend mit API-Flag starten
2. Idee anlegen → Draft-Agent ausführen → Entwurf prüfen (inhaltlich plausibel?)
3. Backend stoppen → erneut ausführen → verständliche Fehlermeldung
4. `pytest backend/tests -m "not llm"`

## Erwartetes Ergebnis
Erster End-to-End-Beweis: lokale KI erzeugt nutzbare, validierte Projektartefakte.

## Dokumentation
docs/backend-plan.md und docs/agent-system.md auf Ist-Stand bringen; README um Backend-Setup erweitern; task-index.md.
