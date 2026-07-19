---
module: platform
type: roadmap
status: proposed
updated: 2026-07-19
owner: Maurice
related_adrs: [ADR-011, ADR-012, ADR-013, ADR-014, ADR-015]
related_issues: [44, 53, 54, 55, 56, 57, 58, 59, 60]
supersedes: docs/pm-studio/backend-plan.md
---

# Stellwerk-OS – Masterplan: Zielarchitektur, Komponenten-Entscheidungen, Feature-Katalog & Meilensteine

> **Statushinweis (Docs-as-Code):** Dieses Dokument ist die **Roadmap / das Zielbild** von
> Stellwerk. Es ist **`proposed`** und beschreibt **teilweise die Zukunft**. Inhalte hieraus
> dürfen **nicht** als bereits implementierte Ist-Architektur gelesen werden — der Ist-Zustand
> steht ausschließlich in den `current`-Architekturdokumenten, im Code, in den Migrationen und
> im generierten OpenAPI/`packages/contracts`. Die Roadmap wird auf `status: current` gehoben,
> sobald ADR-011–015 und der v0.2-Schnitt angenommen sind. Die v0.1-Build-Spec
> ([build-spec.md](build-spec.md)) bleibt als historische Baseline erhalten und wird nicht
> still durch dieses Dokument überschrieben.

**Basis:** dev-Stand `3157431` (2026-07-18), konsolidiertes Review (Claude + GPT-Gegenreview als Master), Roadmap gemäß [vision.md](vision.md) und [build-spec.md](build-spec.md) §6.
Offene Issues #44–49 werden **aktualisiert, nie dupliziert**: #44 bleibt im v0.2-Schnitt; #45–49 werden in den v0.3-Meilenstein verschoben.

**Revision:** 2026-07-19 – nach technischer Tiefenprüfung überarbeitet: engerer v0.2-Schnitt, getrennte Zustandsaggregate, modulverantwortete Definitionen, gestufte Audit-Reife, stabile Idempotenz, Datenminimierung und realistische Backlog-Grenzen.

**Status dieses Dokuments:** `proposed / RFC`. Es ist Zielbild und Priorisierungsrahmen, aber **kein Auftrag, alle enthaltenen Stories sofort als Issues anzulegen**. Nur der jeweils aktive Meilenstein wird atomar in Issues geschnitten. Entscheidungen werden erst nach einzeln nachvollziehbarer ADR-Annahme verbindlich; spätere Meilensteine bleiben bewusst gröber und dürfen sich durch Umsetzungserkenntnisse ändern.

**Leitprinzip (unverändert aus der Vision):** Ein schlanker Kern mit sechs geteilten Plattformfähigkeiten; Fachmodule erfüllen den Modul-Vertrag (kein eigenes Login, LLM nur via Gateway, Audit-Pflicht ab dem dafür ausgewiesenen Reifegrad, einzeln startbar, würdevolle Degradation). Jede Entscheidung unten wird gegen diesen Vertrag geprüft.

**Begriffsregel:** „Dienst" bezeichnet zunächst eine **logische Domänenkomponente innerhalb von `services/core`**, keinen eigenen deploybaren Microservice. Eine spätere Aufteilung braucht ein eigenes ADR und einen nachgewiesenen Betriebsgrund.

---

## Teil 1 – Ziel-Gesamtarchitektur

### 1.1 Komponentenlandkarte (Zielbild v1.0)

```
Browser (untrusted)
  PM Studio UI · Leitstand UI · IDP UI · RAG UI · Flow Canvas (Next.js / React Flow)
      │  nur eigene BFF-Routen, nie Core direkt, nie Secrets im Bundle
      ▼
BFF-Schicht (Next.js Server Routes, je Modul)
  Service-Credential (server-only) · User-Delegation · Schema-Validierung
      │  HTTP + @stellwerk/contracts (generierte Typen, Drift-Check)
      ▼
services/core  – ein Deployment, sechs logische Fähigkeiten
  1 Identity (DevAuth→OIDC)      2 Model Gateway (Stub/Ollama/Cloud)   3 Telemetrie/Kosten
  4 Event/Audit                  5 Agent Runtime                        6 Eval Harness
    (v0.2 Run-Historie;            (Registry · Run Engine ·               (Golden Sets,
     v0.4 gehärtetes Audit)         Workflow/Gates · Artifact Store)       Regression; nie
                                                                           Live-LLM im Pflicht-Gate)
      │                               │
      ▼                               ▼
  PostgreSQL                     Provider-Welt
  (eine DB, klare Schema-        (Ollama lokal · Azure OpenAI · OpenAI · später Bedrock —
   Ownership je Dienst)           NUR aus dem Gateway erreichbar)
```

**Die drei Trust-Grenzen** (Grundlage aller Entscheidungen unten):

1. **Browser → BFF:** Der Browser ist untrusted. Er kennt keine Core-URL-Credentials, keine Provider-Secrets, keine API-Keys. `NEXT_PUBLIC_*` enthält niemals Vertrauliches.
2. **BFF → Core:** Jedes Modul authentifiziert sich als **Service Principal**; die menschliche Identität wird getrennt als Delegationskontext mitgeführt. In v0.2 leitet die BFF den Nutzer ausschließlich serverseitig aus ihrer Dev-Session ab, verwirft gleichnamige Browser-Header und markiert die Identität als `unverified_dev`. Ab v0.4 ersetzt ein angenommener OIDC-Fluss diese Herkunft. `user` und `service` sind getrennte Felder – nie vermischt.
3. **Core → Provider:** Ausschließlich der Gateway spricht LLM-Provider. Ein automatisierter Architekturtest verbietet Provider-SDK-Imports außerhalb des Gateways; ADR-006 bleibt bestehen.

### 1.2 Der zentrale Datenfluss: ein Agent-Run end-to-end

Das ist die Sequenz, die jedes Feature unten wiederverwendet – sie muss ein einziges Mal richtig gebaut werden (v0.2, Issue #44):

```
PM Studio UI → PMS-BFF (POST /bff/draft, Idempotency-Key)
  → Core: Agent Runtime (POST /api/v1/agent-runs {definition_key: pms.draft, version: 1.0.0, input})
      · Definition laden · Input validieren · Prompt v# rendern
      → Gateway: chat(model) → record_call (tokens, cost, provenienz) → Telemetrie/Run-Historie
      · Output gegen Schema validieren (max. 1 Repair-Retry)
      · Run abschließen + run_event (run.completed, service, user, request_id)
  ← 201 {run_id, output} → Draft anzeigen
```

Jeder Kasten rechts von der BFF-Linie ist **generisch**: Die Runtime kennt keine PM-Semantik – sie kennt Definitionen, Schemas, Prompts und Ausführungszustände. `pms.draft@1.0.0` ist die erste registrierte Definition. Das beweist in v0.2 einen echten vertikalen Plattform-Slice; die behauptete **Wiederverwendbarkeit** gilt erst als praktisch bewiesen, wenn spätestens mit einem dünnen `idp.extract`-Slice ein zweites Fachmodul ohne Core-Sonderlogik läuft.

### 1.3 Datenmodell-Zielbild (Kern-Tabellen, Ownership je Dienst)

| Tabelle | Dienst (Owner) | Zweck | Meilenstein |
|---|---|---|---|
| `platform_info`, `gateway_calls` | Telemetrie | vorhanden; `gateway_calls` wird um `currency`, `pricing_status`, `price_version`, `service`, `user_context` und optional `run_id` erweitert | v0.2 |
| `agent_definitions` | Agent Runtime/Registry | `definition_key` (z. B. `pms.draft`) + separate SemVer (`1.0.0`); Core validiert und speichert, das Modul besitzt Manifest/Prompt/Schema | v0.2 |
| `prompt_versions` | Agent Runtime/Registry | Prompt-Text + Hash, unveränderlich; Run referenziert die exakte Version | v0.2 |
| `agent_runs` | Agent Runtime | `pending/running/completed/failed`, Erstell-Idempotenz + Request-Hash, `definition_key@semver`, Prompt-Hash, Modellparameter, request_id und Links zu Gateway-Calls | v0.2 |
| `run_payloads` | Agent Runtime | klassifizierte Input-/Output-Inhalte mit Retention; separat löschbar, während Metadaten/Hash/Tombstone erhalten bleiben (ADR-015) | v0.2 |
| `run_events` | Agent Runtime | append-only technische Zustandsübergänge; **kein** gehärtetes Compliance-Audit | v0.2 |
| `artifacts`, `artifact_versions` | Agent Runtime/Artifact Store | append-only Versionen mit Provenienz `agent→human→human_edited`, Verweis auf erzeugenden Run/Step; ab Einführung ist das Artefakt die Output-Wahrheit | v0.3 |
| `workflow_definitions`, `workflow_runs`, `step_runs` | Agent Runtime/Workflow | getrennte Mehrschritt-Orchestrierung und Step-Versuche | v0.3 |
| `review_gates`, `gate_commands` | Agent Runtime/Gate | offene Review-Gates und idempotente Entscheidungen; kein Status-PATCH | v0.3 |
| `audit_events` | Event/Audit | domänenübergreifend, redigiert und gegen Änderungen durch die App-Rolle geschützt; ersetzt `run_events` nicht | v0.4 |
| `principal_mappings`, `service_clients` | Identity | providerneutrale Human-/Service-Trennung; konkrete Tabellen erst nach OIDC-Spike festlegen | v0.4 |
| `budgets`, `budget_reservations`, `quota_windows` | Telemetrie/Guardrails | atomare Reservierung und Ist-Verrechnung je Principal/Modul | v0.5 |
| `eval_cases`, `eval_runs`, `eval_results` | Eval Harness | Golden Sets je Definition@SemVer, Ergebnisse mit Commit-SHA und Prompt-Hash | v0.6 |
| `documents`, `chunks`, `ingest_runs` | RAG-Modulschema | eigenes PostgreSQL-Schema/eigene Rolle `rag`, konsumiert Kern-Dienste | v0.8 |

Eine Postgres-Instanz, aber **echte Schema-/Migrations-Ownership**: Kern-Tabellen migriert nur der Kern. Fachmodule mit eigener Persistenz erhalten eigene PostgreSQL-Schemas, Alembic-Bäume und Datenbankrollen mit per Grant erzwungenen Grenzen – nicht bloß Tabellenpräfixe. Zugriff auf Kern-Daten erfolgt ausschließlich über Kern-APIs, nie durch Cross-Schema-SQL.

---

## Teil 2 – Architekturentscheidungen je Komponente (ADR-Kandidaten)

Die Nummerierung schließt an ADR-010 an. **Für v0.2 werden nur ADR-011 bis ADR-015 entschieden.** Alle späteren Kandidaten bleiben bis zu ihrem Meilenstein offen; sie werden nicht vorsorglich als „angenommen" eingecheckt. Das verhindert Architekturentscheidungen ohne Umsetzungserfahrung.

### ADR-011 · Runtime- und Definitions-Ownership
**Kontext:** #45/#47 planen Agent-Zustand im PMS-Store; `backend-plan.md` will ein separates PMS-FastAPI/SQLite; die Vision legt Ausführung und Run-Wahrheit in den Kern.
**Entscheidung:** Der Kern besitzt generische Ausführung und Persistenz. Ein Modul besitzt ein versioniertes Manifest mit `definition_key` (`pms.draft`), separater SemVer (`1.0.0`), Prompt, Input-/Output-Schema, Default-Modell und Limits. Ein expliziter, idempotenter und vom Modul verantworteter Deployment-Schritt registriert das Manifest über die Core-API; der Core validiert und speichert es, enthält aber **keinen PMS-Seed in seiner eigenen Migration**. Eine veröffentlichte Definition ist unveränderlich; Änderungen erzeugen eine neue Version. Runs sind auf Definition, Prompt-Hash, Modellparameter und Gateway-Calls rückführbar. Das ist Nachvollziehbarkeit – nicht die Behauptung einer deterministischen LLM-Reproduzierbarkeit.
**Verworfen:** separates PMS-Backend, Run-Wahrheit in localStorage, Core-Migrationen mit Fachmodul-Semantik.
**Konsequenz:** `backend-plan.md` wird `status: superseded`; #44–47 werden an dieser Grenze ausgerichtet. localStorage bleibt nur für lokale PM-Daten ohne agentische Herkunft.

### ADR-012 · Getrennte Lebenszyklen, Idempotenz und Ausführung in v0.2
**Entscheidung:** Zustände werden nicht zwischen Run, Workflow, Step und Review-Gate vermischt:

| Aggregat | Erlaubte Kernzustände |
|---|---|
| `agent_run` (v0.2) | `pending → running → completed\|failed` |
| `workflow_run` (v0.3) | `pending → running → awaiting_review → completed\|failed\|cancelled` |
| `step_run` (v0.3) | `pending → running → completed\|failed`; ein Rerun erzeugt einen neuen Versuch |
| `review_gate` (v0.3) | `open → approved\|rejected\|superseded` |

`POST /agent-runs` verlangt einen für die logische Aktion stabilen Idempotency-Key. Der Core speichert Request-Hash und Ergebnis unter einer Eindeutigkeitsbedingung `(service_principal, idempotency_key)`: gleicher Key + gleicher Payload liefert denselben Run; gleicher Key + anderer Payload liefert 409. UI/BFF behalten den Key über reine Transport-Retries hinweg. Review-Aktionen sind Commands (`approve`, `reject`, `edit_and_approve`, `rerun_with_feedback`) mit Actor, erwarteter Aggregatversion und eigenem Idempotency-Key; freie Status-PATCHes sind verboten. Jeder Übergang schreibt ein `run_event`.

v0.2 führt den Einzelschritt synchron im Request aus, persistiert aber Zustand vor und nach jedem Gateway-Aufruf. Ein Startup-Reconciler markiert nur ausreichend alte `running`-Runs als `failed(interrupted)`; die Single-Instance-Grenze wird dokumentiert. Ein Repair-Retry ist ein eigener, kostenpflichtiger und verlinkter Gateway-Call. Ab v0.3 liefert der Start-Endpunkt `202 Accepted` + Polling. Ein Worker/Broker folgt erst bei nachgewiesener Parallelitäts- oder Laufzeitgrenze in einem neuen ADR.

### ADR-013 · BFF-Grenze und Identitäts-Propagation
**Entscheidung:** Browser-Code ruft ausschließlich eigene Next-Server-Routen auf. Die BFF hält Core-URL und Service-Credential server-only. Sie **verwirft** vom Browser gesendete `X-Stw-*`-Identitätsheader und setzt selbst zwei getrennte Kontexte: authentifizierter Service `pms` und menschlicher Nutzer aus der serverseitigen Session. In v0.2 wird der Nutzer als `unverified_dev` markiert; weder Core noch Telemetrie behandeln ihn als starke Identität. Der spätere OIDC-Fluss darf die Feldsemantik nicht brechen.
**Verworfen:** API-Key in `NEXT_PUBLIC_*`, ungeprüfte On-behalf-of-Header, Modul-Key als menschlicher Actor.

### ADR-014 · Kosten- und Preisprovenienz
**Entscheidung:** `gateway_calls` erhält `currency`, `pricing_status ∈ {real, simulated, unknown}`, `price_version`, `service`, `user_context` und optional `run_id`. Unbekannter Preis bedeutet `cost_estimate = NULL`, niemals 0. Ein Run aggregiert Kosten über verlinkte Gateway-Calls, ohne sie als zweite Wahrheit zu duplizieren. Summary und UI zeigen Provider, Modell und Provenienz; simulierte Werte sind sichtbar markiert. Preisperioden werden auf Überlappungen geprüft; Lücken sind zulässig, führen aber zu `unknown`. Jede externe Preisquelle trägt `last_verified`.
**Konsequenz:** Cloud-, lokale und Demo-Kosten bleiben fachlich unterscheidbar, bevor der Leitstand darauf aufbaut.

### ADR-015 · Run-Daten, Klassifizierung und Aufbewahrung
**Entscheidung:** Run-Metadaten und Inhalte werden getrennt behandelt. Metadaten (Definition, Version, Modellparameter, Request-ID, Call-Links, Status, Hashes) sind standardmäßig persistierbar. Vollständige Inputs/Outputs werden nur nach dokumentierter Datenklasse in getrennt löschbaren Payload-Datensätzen gespeichert; Secrets sind verboten, sensible Felder werden vor Persistenz redigiert, und die Aufbewahrungsdauer ist konfigurierbar. Ein Retention-/Löschlauf darf Inhalte entfernen, hinterlässt aber Metadaten, Hash und Tombstone. Audit-Events enthalten nie Prompt oder Dokumentinhalt. Bis v0.3 darf der v0.2-Einzelschritt einen klassifizierten JSON-Output im Run-Payload halten; mit Einführung des Artifact Store wird das Artefakt die einzige Output-Wahrheit und der Run hält Referenz + Hash. Demo und CI verwenden ausschließlich synthetische Daten.
**Konsequenz:** Traceability wird nicht durch unkontrollierte Kopien personenbezogener oder vertraulicher Inhalte erkauft.

### Spätere ADR-Kandidaten (bleiben `proposed`, nicht als Dateien eingecheckt)

- **ADR-016 · Workflow-Ausführung und Framework-Grenze (v0.3):** Kleinste persistierte Workflow-/Step-Zustandsmaschine zuerst; LangGraph nur bei nachgewiesenem Nutzen und nur als Interpreter über Stellwerk-Definitionen. Entscheidungspunkt nach Spike (Gate, Rerun, Prozessneustart).
- **ADR-017 · Append-only Artefakt-Versionierung (v0.3):** Kopf-Datensatz + append-only `artifact_versions` mit Provenienz; „Bearbeiten & bestätigen" und „Wiederherstellen" erzeugen neue Versionen; Chat-Iteration (#48) schreibt nur über diesen Mechanismus, daher #49 vor #48.
- **ADR-018 · Audit-Härtung und ehrliche Schutzbehauptung (v0.4):** Taxonomie `<domäne>.<objekt>.<verb>`, Redaction, Korrelation; App-DB-Rolle mit INSERT/SELECT, ohne UPDATE/DELETE (Test mit genau dieser Rolle). Schützt vor App-Änderungen, nicht vor privilegierten DBAs. Bis v0.4 heißt `run_events` „Run-Historie", nicht Compliance-Audit.
- **ADR-019 · Providerneutrales OIDC-Zielbild (v0.4):** Standard-JWTs, `principal_type: human|service`, Rollen `user/auditor/admin`; Keycloak als bevorzugter lokaler Demonstrator, kein fachlicher Vertrag. `STW_ENV=prod` verweigert DevAuth fail-fast.
- **ADR-020 · Gateway-Guardrails: Limits und atomare Budgetreservierung (v0.5):** `max_tokens` je Definition ab v0.2; Kostenbudget je Service/Principal; Rate-Limit. Vor dem Provider-Call atomar reservieren, danach gegen Ist verrechnen. `budget_exceeded` (403/429 semantisch) vs. `rate_limited`.
- **ADR-021 · Ereignisbasiertes Fortschritts-Streaming (v0.4):** `GET /api/v1/agent-runs/{id}/events` per SSE; Zustands-Streaming vor Token-Streaming; v0.3-Panel pollt denselben Ereignisvertrag.
- **ADR-022 · Eval-Strategie je Definition@SemVer (v0.6):** Versionierte Golden Sets; Ergebnisse mit Commit-SHA/Prompt-Hash/Modellparametern; deterministische Stub-Smokes automatisiert, Live-LLM nie im Pflicht-Gate.
- **ADR-023 · Erzwungene Modul-Persistenzgrenzen (ab IDP/RAG):** eigenes Schema, eigener Alembic-Baum, DB-Rolle ohne Schreibrecht auf Core-Schemas; Cross-Domain nur über HTTP-APIs; RAG startet mit pgvector.
- **ADR-024 · Ehrlicher, deterministischer Demo-Modus (v0.6):** `STW_DEMO=true` seedet ein vollständig synthetisches Szenario; jede Oberfläche kennzeichnet Simulation sichtbar; `make demo` in höchstens zwei Minuten.

> Die Volltexte der ADR-Kandidaten 016–024 bleiben bewusst in dieser Roadmap und werden **erst
> mit Aktivierung ihres Meilensteins** als angenommene ADR-Dateien unter `docs/platform/adrs/`
> ausgearbeitet.

---

## Teil 3 – Wie die Komponenten interagieren: die vier Schlüssel-Sequenzen

Neben dem Agent-Run (1.2) definieren diese Abläufe die Verträge zwischen den Diensten:

**S2 · HITL-Review (v0.3):** Ein `workflow_run` erreicht einen Schritt mit `review_required` – der zugehörige `step_run` wird erfolgreich beendet, ein `review_gate` öffnet sich und der Workflow wechselt auf `awaiting_review`. Runtime schreibt `run_events`; ein gehärtetes `audit_event` kommt erst ab v0.4 zusätzlich hinzu. Das PMS-Panel lädt Gate und Artefakt via BFF. `edit_and_approve` erzeugt eine `human_edited`-Artefaktversion und schließt das Gate; `rerun_with_feedback` erzeugt einen **neuen Step-Versuch**, statt den alten Zustand zurückzudrehen. Ein konkurrierender Command mit veralteter Version erhält 409 (ADR-012/017).

**S3 · Budget-Durchsetzung (v0.5):** Das Gateway berechnet vor dem Provider-Call eine maximale Kostenschätzung, reserviert sie atomar je Principal/Periode und verrechnet danach die Ist-Kosten. Bei unbekanntem Preis greift nur das Tokenlimit. Überschreitung liefert ein strukturiertes `budget_exceeded`, schreibt Telemetrie und ab v0.4 Audit, und beendet den Run verständlich als `failed`. Kein Budgetversprechen basiert allein auf einem gecachten Summary-Wert (ADR-020).

**S4 · Eval-Regression (v0.6):** `workflow_dispatch` → Runner lädt Golden Sets für zwei konkrete `definition_key@semver`-Versionen → deterministische Stub-Smokes bzw. explizit gestartete Ollama-/Cloud-Evals → `eval_results` mit Commit-SHA, Prompt-Hash und Modellparametern → Leitstand zeigt Pass-Rate, Schema-Konformität und Kosten/Fall. Live-LLM-Evals sind nie Pflicht-CI (ADR-022).

**S5 · Leitstand liest nur (v0.6):** Leitstand-BFF konsumiert als `auditor` ausschließlich versionierte Kern-APIs und generierte Contracts; ein Architekturtest verbietet SQL-Zugriff, Provider-SDKs und Handtypen. Das beweist den **Lese- und Modulvertrag**, aber noch nicht die Wiederverwendbarkeit der Agent Runtime. Dieser stärkere Beweis folgt mit einem dünnen zweiten Fachagenten vor oder spätestens innerhalb des IDP-Meilensteins.

---

## Teil 4 – Feature-Katalog als Epics mit User Stories

Rollen: **PO** (Product Owner/PM-Studio-Nutzer), **Reviewer** (Mensch am Gate), **Admin** (Plattform), **Auditor** (Governance/Compliance), **Mod-Dev** (Modul-Entwickler), **Ops** (Betrieb), **Besucher** (Recruiter/Interessent, der das Repo klont).
Story-Format kompakt: *Als ROLLE will ich X, um Y.* – AK stichpunktartig. **Nur E1/E2 und E3.1 sind derzeit issue-reif.** Alle Stories ab v0.3 sind Roadmap-Kandidaten und werden erst nach dem vorherigen Release detailliert geschnitten. Pro PR gilt ein primäres Issue; ein Epic ist nie automatisch ein einzelnes Implementierungs-Issue.

### Epic E1 · Belastbare Foundation *(v0.2-A, blockierende Vorphase)*
| # | Story | Kern-AK |
|---|---|---|
| E1.1 | Alte lokale Projektdaten dürfen beim Update nie die App crashen. | Migration tolerant ggü. fehlendem `risks`; Fixture aus altem Schema; gesamte Unit-/Browser-Suite grün – ohne fest codierte Testanzahl |
| E1.2 | CI baut beide Container **und startet** sie. | getrennte Core-/PMS-Builds; Smoke mit Produktions-Stage: `/readyz` bzw. `/` = 200; Runtime-Abhängigkeiten werden tatsächlich importiert |
| E1.3 | Festgeschriebene Laufzeitmatrix (Py 3.12, Node 22). | Matrix in `runbooks/ci.md`; #22/#40/#41/#42 geschlossen/ersetzt, #25/#39 nach Rebase entschieden |
| E1.4 | Prod-Modus verweigert unsichere Defaults. | `STW_ENV=prod` + DevAuth = Startabbruch; Pflicht-Secrets; keine offenen Infra-Ports; Grafana-Anon aus |
| E1.5 | `/readyz` prüft den Migrationsstand. | 200 nur bei DB erreichbar + Alembic-Head; 503 mit maschinenlesbarem Grund |
| E1.6 | Hermetisch getesteter, robuster Ollama-Provider. | MockTransport statt Loopback; `trust_env` entschieden; ungültiges JSON/Shape → 502; jeder Fehler telemetriert |
| E1.7 | Korrekte Root-Doku und ehrliche Gates. | Root-Skripte delegieren; README nennt `pms`-Profil + Release; build-spec eingefroren; backend-plan superseded; kritischer Playwright-Smoke als Pflicht-Gate |
| E1.8 | Nur die unmittelbar tragenden Entscheidungen als ADRs festhalten. | ADR-011–015 einzeln geprüft und angenommen; Index aktualisiert; spätere ADR-Kandidaten bleiben `proposed` |

### Epic E2 · Erster echter Agent *(v0.2 – Update #44)*
| # | Story | Kern-AK |
|---|---|---|
| E2.1 | Core/Modul-/Runtime-Grenze entschieden. | ADR-011–015 angenommen; Vision, Agent-Doku, backend-plan und Issues konsistent |
| E2.2 | Agent-Definitionen modulverantwortet registrieren. | `agent_definitions` + `prompt_versions`; PMS-Manifest `pms.draft@1.0.0`; idempotenter Registrierungsbefehl; Core-Migration ohne PMS-Seed; Contracts driftfrei |
| E2.3 | Per Klick einen Projekt-Draft von einem echten LLM erzeugen. | BFF→Run-API→Gateway (Stub+Ollama); stabiler Idempotency-Key + Request-Hash; Output schema-validiert; max. ein Repair-Retry; Definition/Prompt/Modellparameter/request_id/Call-Links persistiert |
| E2.4 | Ehrliche Fehlerzustände mit sicherem Retry. | `schema_error`, `provider_error`, `core_unavailable` getestet; lokale Daten unangetastet; kein stiller Mock-Fallback; erneuter Versuch mit neuem Aktions-Key |
| E2.5 | Jeden Run einem Service, Dev-Nutzer, Prompt und Gateway-Call zuordnen. | `service` + `user_context(unverified_dev)` getrennt; `run.completed\|failed` als `run_event`; Korrelation über run_id/request_id; kein Compliance-Audit-Claim |
| E2.6 | Keine Zombie-Runs nach Prozessneustart. | Reconciler markiert nur Runs älter als Grenzwert als `failed(interrupted)`; Single-Instance-Annahme und Timeout getestet |

### Epic E3 · Nachvollziehbare Kosten (FinOps) *(E3.1 in v0.2; Rest ab v0.3)*
| # | Story | Kern-AK |
|---|---|---|
| E3.1 | Reale, simulierte und unbekannte Kosten unterscheiden. | `currency`/`pricing_status`/`price_version` in DB+API; unbekannt = NULL, nie 0; ADR-014 umgesetzt |
| E3.2 | Summary nach Provider+Modell mit Provenienz. | Summary-Erweiterung; Grafana-Panels beschriftet; Seed durchgängig `simulated` |
| E3.3 | Validierte Preisperioden. | Überlappung = Startfehler; Lücke = `unknown`; `last_verified` je Quelle; Tests |
| E3.4 | Kosten „meines" Laufs sehen. | Run-Detail aggregiert usage+cost+provenienz aus verlinkten Gateway-Calls; keine zweite Kostenwahrheit |

### Epic E4 · HITL: Signale & Freigaben *(v0.3 – Updates #45/#46/#47)*
| # | Story | Kern-AK |
|---|---|---|
| E4.1 | Workflow-Definitionen mit Schritten und `review_required`. | `definition_key` + SemVer; ungültige Kanten abgelehnt; PMS-Planungsworkflow modulverantwortet; ADR-016 entschieden |
| E4.2 | Ohne Freigabe läuft kein Folgeschritt (Signal-Prinzip). | `workflow_run`, `step_run` und `review_gate` getrennt; Gate blockiert nachweislich; Neustart verliert keinen Zustand; E2E-Beweis |
| E4.3 | Freigaben idempotent und konfliktsicher. | Commands mit Idempotency-Key + erwarteter Gate-Version; Doppel-Command identisch; veralteter konkurrierender Command → 409 |
| E4.4 | „Bestätigen / Bearbeiten & bestätigen / Erneut mit Feedback". | drei Commands end-to-end; Edit → `human_edited`-Version; Feedback erzeugt neuen Step-Versuch |
| E4.5 | Jeden Übergang mit Actor/Zeit/Request rekonstruieren. | `run_events` append-only chronologisch; ab v0.4 zusätzlich redigierte Audit-Events |
| E4.6 | Anstehende Freigaben gesammelt sehen (Inbox). | Inbox listet `awaiting_review` über Projekte; Badge; leerer Zustand |

### Epic E5 · Artefakte mit Gedächtnis *(v0.3 – Neuschnitt #49 vor #48)*
| # | Story | Kern-AK |
|---|---|---|
| E5.1 | Jede Artefaktversion mit Herkunft sehen. | append-only Versionen; Provenienz-Badge; Verweis auf Run/Step |
| E5.2 | Zwei Versionen vergleichen und zurückrollen. | Diff-Ansicht; „Wiederherstellen" erzeugt neue Version (nie Löschung) |
| E5.3 | Per Chat am Artefakt iterieren, ohne Historie zu verlieren. | Chat-Turns erzeugen Versionen über E5.1-Mechanik; #48 erst nach #49 |
| E5.4 | Anwendung kann keine Artefaktversion unbemerkt ändern/löschen. | kein fachlicher Update/Delete-Pfad; App-Rolle ohne UPDATE/DELETE; DB-Test; DSGVO-Löschung nur über privilegierten Prozess mit Tombstone/Audit |

### Epic E6 · Identität & Zugriff *(v0.4)*
| # | Story | Kern-AK |
|---|---|---|
| E6.1 | Standardkonformes OIDC statt DevAuth. | JWT-Validierung via JWKS; DevAuth nur dev; prod verweigert DevAuth; Keycloak als optionaler Kandidat nach Spike |
| E6.2 | Human- und Service-Principals getrennt. | `principal_type`; Service-Auth + gewählter Delegationsfluss (ADR-019); Felder aus ADR-013 stabil |
| E6.3 | Rollenbasierte Sicht (user/auditor/admin) durchgesetzt. | erste echte Autorisierung an Telemetrie/Audit/Registry; Tests je Rolle inkl. Verweigerung |
| E6.4 | Token-Rotation und Secret-Handling dokumentiert. | Security-/Ops-Doku: Tokenfluss, Rotation, lokale Demo ohne Secrets im Repo |

### Epic E7 · Gegen App-Änderungen geschütztes Audit *(v0.4)*
| # | Story | Kern-AK |
|---|---|---|
| E7.1 | Gegen App-Änderungen geschütztes Ereignis-Log. | App-Rolle ohne UPDATE/DELETE; Test nutzt exakt diese Rolle; DBA-Grenze dokumentiert |
| E7.2 | Events nach Modul/Actor/Zeit/Run filtern. | paginierte Lese-API, RBAC-geschützt; Korrelation request_id↔run_id |
| E7.3 | Redaction, damit keine Prompts/Secrets im Audit landen. | Redaction-Pipeline + Tests; Payload referenziert statt kopiert |
| E7.4 | Aufbewahrung/Export geregelt. | Archiv-/Export-Strategie dokumentiert; v1.0: Export-Job |

### Epic E8 · Cloud-Ready Gateway und Guardrails *(v0.5 – ADR-020)*
| # | Story | Kern-AK |
|---|---|---|
| E8.1 | Azure OpenAI per Settings zuschalten. | Provider hinter Registry; Deployment-Mapping validiert; Fehlkonfig = `gateway_misconfigured` |
| E8.2 | Alle Azure-Fehlerbilder ohne Netz getestet. | MockTransport: 200/401/403/429+Retry-After/5xx/Timeout/ungültige Response |
| E8.3 | Azure-Kosten mit realen Preisperioden und Provenienz. | `pricing_status=real`; Perioden aus Cost-Mapper-Muster; Währung korrekt |
| E8.4 | Kostenbudgets je Modul/Principal. | atomare Reservierung + Ist-Verrechnung; strukturiertes `budget_exceeded`; unbekannter Preis → Tokenlimit; Audit `gateway.budget.denied` |
| E8.5 | Rate-Limits je Principal. | `rate_limited` + `Retry-After`; Fenster-Isolation je Principal; Single-Instance-Grenze dokumentiert; Default aus |
| E8.6 | OpenAI-Provider als dritter Adapter. *(frühestens v0.7, nur bei Mehrwert)* | gleiche netzfreie Testmatrix wie Azure |

### Epic E9 · Leitstand (Lese-Modulvertrag) *(v0.6)*
| # | Story | Kern-AK |
|---|---|---|
| E9.1 | Kosten-/Modell-Dashboards je Provider/Modul/Zeitraum. | liest nur Kern-APIs via Contracts; Provenienz sichtbar; Filter |
| E9.2 | Audit-Trail mit Drilldown bis zum Run. | Event-Liste → Run-Detail → Artefaktversionen verkettet |
| E9.3 | Budget-Stände und -Verletzungen auf einen Blick. | Budget-Widgets; Verletzungen mit Zeit/Principal |
| E9.4 | Eval-Ergebnisse je Definition@Version vergleichen. | Vergleichsansicht Pass-Rate/Kosten/Fall über Commits |
| E9.5 | Leitstand als Beweis des Lese-Modulvertrags. | Architekturtest: kein Modul-SQL auf Core-Schemas, kein Provider-SDK, keine Handtypen; eigenes Compose-Profil; CI-Job `lst` |

### Epic E10 · Eval-Harness *(v0.6 – ADR-022)*
| # | Story | Kern-AK |
|---|---|---|
| E10.1 | Golden Sets je Definition@Version pflegen. | `eval_cases` versioniert; ≥5 Fälle für `pms.draft` |
| E10.2 | Deterministische Smokes und bewusst gestartete Modell-Evals. | Stub-Smoke automatisiert; Ollama/Azure manuell/budgetiert; kein Live-LLM im Pflicht-Gate |
| E10.3 | Modell-/Promptvergleich als Report. | Vergleich zweier Versionen; menschenlesbarer Report |
| E10.4 | Schema-Konformität als härtestes Kriterium. | Schema-Assertions Pflichtteil jedes Falls |

### Epic E11 · Vorschlags-Inbox *(v0.6)*
| # | Story | Kern-AK |
|---|---|---|
| E11.1 | Agentvorschläge in einer Inbox statt direkt im Bestand. | Vorschlag = Artefaktversion mit Status `proposed`; Annahme erzeugt Bestandsobjekt + Audit |
| E11.2 | Vorschläge annehmen/ablehnen/ändern-und-annehmen. | drei Aktionen; Provenienz gemäß ADR-017 |
| E11.3 | Abgelehnte Vorschläge einsehbar. | Ablehnungen bleiben abfragbar (append-only) |

### Epic E12 · Betrieb & Observability *(quer, v0.3–v0.6)*
| # | Story | Kern-AK |
|---|---|---|
| E12.1 | Backup/Restore der Postgres-Volumes dokumentiert und getestet. | `operations.md` mit geprobter Anleitung |
| E12.2 | Fortschritt live (SSE) statt Polling. *(v0.4, ADR-021)* | `/agent-runs/{id}/events` SSE; Panel-Upgrade ohne API-Bruch |
| E12.3 | npm-Advisories im Gate. | `npm audit`-Job mit Schwellwert + begründeter Ignore-Liste |
| E12.4 | Alerting-Basis (Budget, Fehlerrate, Gate-Stau) in Grafana. | 3 provisionierte Alerts; Runbook-Verweis je Alert |
| E12.5 | `make demo` mit erzählbarem Komplettszenario. *(v0.6, ADR-024)* | vollständig synthetischer, sichtbar simulierter Seed; README-Abschnitt „Demo-Tour" |

### Epic E13 · IDP-Modul *(v0.7 – Tier 2; zweiter Agent-Runtime-Beweis)*
| # | Story | Kern-AK |
|---|---|---|
| E13.1 | Dokumente hochladen und strukturierte Daten extrahiert bekommen. | dünner API-Slice, dann UI; `idp.extract@1.0.0` modulverantwortet; OCR→Gateway; PostgreSQL-Schema/Rolle `idp` (ADR-023); nur synthetische Beispiele; keine Core-Sonderlogik |
| E13.2 | Extraktionen im HITL-Panel prüfen/korrigieren. | wiederverwendet Gate Service + Review-Panel (E4) – kein neues HITL |
| E13.3 | Je Feld die Herkunft (OCR/LLM/Mensch) sehen. | Feld-Provenienz im Artefakt; Konfidenzwerte gespeichert |
| E13.4 | IDP-Qualität im Eval-Harness messen (F1 je Feldtyp). | Golden Set aus anonymisierten Beispieldokumenten; Leitstand-Report |

### Epic E14 · Knowledge & RAG *(v0.8 – Tier 3)*
| # | Story | Kern-AK |
|---|---|---|
| E14.1 | Dokumente fragen und Antworten mit Quellen erhalten. | `rag.answer@1.0.0`; Chunks+Zitate; pgvector (ADR-023); Embeddings via Gateway |
| E14.2 | Ingest-Läufe (Chunking, Versionierung) nachvollziehen. | `ingest_runs` mit Doku-Version; Re-Ingest idempotent |
| E14.3 | Rechteprüfung über Kern-Identity. | Dokument-Scope an Principal geprüft; Tests je Rolle |
| E14.4 | RAG-Qualität (Faithfulness/Recall) im Eval-Harness. | RAG-Metriken als Harness-Erweiterung |
| E14.5 | Plattform-Doku selbst durchsuchbar. | `docs/` als erster Korpus; Dogfooding-Demo |

### Epic E15 · Flow-Modul *(v0.9 – Tier 3)*
| # | Story | Kern-AK |
|---|---|---|
| E15.1 | Workflows visuell aus registrierten Agenten zusammenstecken. | React-Flow-Canvas erzeugt/editiert `workflow_definitions` – keine eigene Engine, nur Editor über ADR-016-Verträgen |
| E15.2 | Fake-Konnektoren (fake_jira, fake_outlook). | Konnektor-Schritte mit deklarierten IO-Schemas; deterministisch |
| E15.3 | Gates im Canvas sichtbar platzieren. | `review_required` als Knoten-Eigenschaft; Validierung beim Speichern |

### Epic E16 · v1.0-Reife *(v1.0)*
| # | Story | Kern-AK |
|---|---|---|
| E16.1 | Doku-Site (Architektur, ADR-Index, Modul-Verträge, Demo-Tour). | generierte Site aus `docs/`; Deploy via Pages |
| E16.2 | Audit-Export und Aufbewahrung produktreif. | Export-Job; Strategie umgesetzt (E7.4) |
| E16.3 | Upgrade-Runbook v0.x→v1.0. | Migrationskette getestet auf Demo-Daten |
| E16.4 | Dokumentierter „Neues-Modul-Guide" (Vertrag als Checkliste + Template). | Guide + `apps/_template`-Gerüst; Leitstand/IDP als Referenzen |

---

## Teil 5 – Meilensteinplan

| Meilenstein | Name | Inhalt (Epics) | Definition of Done (prüfbar) |
|---|---|---|---|
| **v0.2-A** *(interner Exit, kein Release)* | Foundation-Gate | E1 | Datenmigration bewiesen; beide Produktions-Stages bauen und starten in CI; Laufzeitmatrix fest; Prod-Fail-Fast und `/readyz` korrekt; Ollama-Fehler netzfrei getestet; kritischer Playwright-Smoke ist Pflicht-Gate; nur ADR-011–015 angenommen |
| **v0.2** | Erster echter Agent | E2, E3.1 | `pms.draft@1.0.0` läuft UI→BFF→Runtime→Gateway mit Stub deterministisch in CI und Ollama in einem dokumentierten lokalen Release-Smoke; Run-Erstellung idempotent; Output schema-validiert; Kostenprovenienz korrekt; kein stiller Mock-Fallback; #44 geschlossen; beide Images in GHCR |
| **v0.3** | Signale & Gedächtnis (HITL) | E4, E5, E3.2–3.4, E12.1 | #45–49 in diesem Milestone; Workflow-/Step-/Gate-Zustände getrennt; Commands idempotent; Artefaktversionierung vor Chat (#49→#48); kein Fortschritt ohne Freigabe per Browser-E2E; Backup/Restore einmal geprobt |
| **v0.4** | Identität & geschütztes Audit | E6, E7, E12.2 | providerneutrales OIDC mit Human/Service-Trennung; prod verweigert DevAuth; Rollen technisch erzwungen; Audit redigiert und gegen App-UPDATE/DELETE geschützt; SSE-Run-Events |
| **v0.5** | Cloud & Gateway-Guardrails | E8.1–E8.5 | Azure-Adapter vollständig netzfrei getestet; reale Preisprovenienz; atomare Budgetreservierung und Rate-Limits aktiv schaltbar; unbekannte Preise fallen sicher zurück |
| **v0.6** | Leitstand, Evals & Demo | E9, E10, E11, E12.3–E12.5 | Leitstand beweist den Lese-Modulvertrag; deterministische Eval-Smokes plus kontrollierte Modellvergleiche; Vorschlags-Inbox; vollständig synthetisches `make demo` |
| **v0.7** | IDP & zweiter Runtime-Beweis | E13; E8.6 nur bei Bedarf | `idp.extract@1.0.0` läuft als dünner Slice und dann mit UI/HITL, ohne Core-Sonderlogik; Feld-Provenienz und F1-Messung |
| **v0.8** | Knowledge & RAG | E14 | Antwort mit Quellen über pgvector; Schema-/Rollenisolation; Doku-Dogfooding; RAG-Metriken |
| **v0.9** | Flow | E15 | Canvas editiert Kern-Workflow-Definitionen; Fake-Konnektoren; Gates designbar; keine zweite Engine |
| **v1.0** | Plattform | E16 | Doku-Site, Audit-Export, Upgrade-Pfad, Neues-Modul-Guide; sechs logische Plattformfähigkeiten real; mindestens drei Fachmodule erfüllen den Vertrag |

**Kritischer Pfad:** ADR-011–015 und Foundation-Fixes bilden gemeinsam v0.2-A → #44/erster Run → Workflow/Gates/Artefakte → Identity/Audit → Cloud-Guardrails → Leitstand/Evals → IDP als zweiter Runtime-Beweis. Erst danach sind RAG und Flow sinnvoll. Parallelisierbar sind Kosten-Summary/Doku nach v0.2 sowie Leitstand-UX, sobald stabile Lese-APIs existieren.

**Backlog-Regel:** Es werden höchstens der aktive Meilenstein und ein unmittelbar folgender Spike in atomare Issues geschnitten. Für v0.2 existiert genau ein Feature-Fokus (#44) plus seine nachweislich blockierenden Foundation-Issues. #45–49 werden in v0.3 verschoben; spätere Epics bleiben ausschließlich in diesem Dokument.

**Bewusst NICHT geplant** (Fernziele der Vision, unpriorisiert bis ≥2 Fachmodule laufen): Agent Marketplace, Voice/Computer-Use, echter MCP-Server, echte M365/SAP-Anbindung, Mobile, Kubernetes, Multi-Tenant.

---

## Teil 6 – Nicht-funktionale Anforderungen (quer, je Release geprüft)

1. **Nachvollziehbarkeit:** Jeder agentisch erzeugte Inhalt ist auf `definition_key@semver`, Prompt-Hash, Modellparameter, Gateway-Calls, Request und spätere Freigaben rückführbar (ADR-011/012/014/017/018). Das ermöglicht Erklärung und Vergleich, behauptet aber keine deterministische Wiederholung eines LLM-Ergebnisses.
2. **Determinismus in CI:** Kein Pflicht-Gate ruft Internet oder ein reales LLM auf (ADR-006). Provider-Tests verwenden MockTransport. Unit-, Contract-, Container-Smoke- und mindestens der kritische Playwright-End-to-End-Pfad sind blockierend; Live-Ollama-/Cloud-Evals bleiben getrennt, manuell oder budgetiert und nicht blockierend.
3. **Sicherheit & Datenminimierung:** Secrets nie im Browser/Repo/Log/Audit; die BFF verwirft fremde Identitätsheader; prod fail-fast bei unsicheren Defaults; Run-Payloads folgen Klassifizierung, Redaction und Retention nach ADR-015; Trivy, CodeQL und ein begründet konfigurierter npm-Advisory-Check decken unterschiedliche Risiken ab.
4. **Degradation:** Jedes Modul startet und arbeitet sinnvoll ohne die anderen (Compose-Profil-Test je Release); Kern-Ausfall macht PMS nicht kaputt, nur agentenlos.
5. **Betreibbarkeit:** Ein-Befehl-Install bleibt heilig (`make up`); optionale Infrastruktur ist ein Profil, nie heimliche Pflicht; Datenbankmigrationen sowie Backup/Restore werden auf realistischen Fixtures geprobt.
6. **Portfolio-Tauglichkeit:** Jeder Meilenstein endet mit einer in höchstens fünf Minuten vorführbaren, dokumentierten Story; ab v0.6 standardisiert `make demo` diesen Ablauf. Simulation und echte Provider-Ausführung bleiben sichtbar unterscheidbar.
7. **Ehrliche Reifeaussagen:** Vor v0.4 heißt die Ereignishistorie nicht „Compliance-Audit"; Schutz durch eine App-DB-Rolle heißt nicht „DBA-manipulationssicher"; ein einziges PMS-Szenario heißt „Plattform-Slice", nicht „generische Runtime bewiesen".

---

## Teil 7 – Risiken & Gegenmaßnahmen

| Risiko | Wirkung | Gegenmaßnahme |
|---|---|---|
| Scope-Explosion durch diesen Katalog | v0.2 verzögert sich | Nur aktiver Meilenstein + nächster Spike geschnitten; v0.2-A und #44 mit harter WIP-Grenze; spätere Stories bleiben Katalog |
| Generische Engine wird doch PM-spezifisch | Plattform-These bricht | Architekturtest und Reviewfrage „Braucht IDP dafür eine Core-Sonderregel?"; ehrlicher Beweis erst mit `idp.extract` in v0.7 |
| LLM-Output-Qualität lokal frustriert | Demo wirkt schwach | Schema-Validierung + klar erfasster Repair-Call; Demo-Stub sichtbar `simulated`; kein stiller Ersatz einer fehlgeschlagenen Real-Ausführung |
| OIDC-/Keycloak-Komplexität frisst v0.4 | Meilenstein kippt | Providerneutraler Vertrag zuerst; kurzer Delegations-Spike; Keycloak bleibt Demonstrator |
| Ein-Personen-Projekt + KI-Agenten driften | Qualität sinkt unbemerkt | ADRs als Leitplanken; blockierende deterministische Tests sofort, Evals ab v0.6; keine Test-Skips in `ci-ok` |
| Run-Inputs/Outputs vervielfachen sensible Daten | Datenschutz-/Sicherheitsrisiko | ADR-015 bereits in v0.2; Metadaten und Inhalte trennen; Redaction/Retention; Artifact Store ab v0.3 einzige Output-Wahrheit |
| Budgetprüfung liest nur verzögerte Telemetrie | parallele Calls überschreiten Budget | atomare Reservierung + Ist-Verrechnung nach ADR-020; unbekannter Preis erzwingt sicheren Fallback |
| Audit-Schutz wird regulatorisch überverkauft | Glaubwürdigkeitsverlust | App-Rollen-Grenze explizit; Tamper-Evidence/WORM als spätere Entscheidung; keine Compliance-Zusage im README |
| DSGVO/Datenschutz bei echten Dokumenten (IDP/RAG) | rechtliches Risiko | nur synthetische/anonymisierte Demo-Daten; Feldklassifizierung und Redaction; klare Betreiberverantwortung in SECURITY.md |

---

## Teil 8 – Unmittelbare nächste Schritte (Übergabe)

1. **Board/Backlog abgleichen:** Milestone „PM Studio – v0.2 (Agent-Backend)" in „Stellwerk v0.2 – Erster echter Agent" umbenennen; nur #44 dort belassen. #45–49 ohne Duplikate in „Stellwerk v0.3 – Signale & Gedächtnis" verschieben. Bestehende Repo-Taxonomie verwenden. *(erledigt: Milestones #3/#4 umbenannt/angelegt, Issues #44–49 zugeordnet, v0.2-Foundation-Issues #53–60 angelegt.)*
2. **Fünf v0.2-Entscheidungen klären:** ADR-011–015 in Abhängigkeitsreihenfolge schreiben und reviewen (Issue #53). Kein Acht-ADR-Sammel-PR.
3. **Maximal sechs Foundation-Issues schneiden:** (a) lokale Datenmigration #54, (b) Container-Build/Start + Laufzeitmatrix #55, (c) Prod-Fail-Fast #56, (d) `/readyz`-Migrationsstand #57, (e) hermetischer Ollama-Provider #58, (f) Root-Doku + kritischer Playwright-Pflicht-Smoke #59.
4. **#44 zum dünnen vertikalen Slice umschreiben:** modulverantwortetes Manifest `pms.draft@1.0.0`, idempotente Run-Erstellung, BFF→Runtime→Gateway, schema-validierter Output, verlinkte Calls/Kosten (#60), ehrliche Fehlerzustände und Reconciler. Keine Gates, Workflows, Artefakt-Chats, OIDC oder Cloud in #44.
5. **v0.2 veröffentlichen und erst danach v0.3 schneiden:** #47/Workflow-Basis und #49/Artefakte zuerst; anschließend #45/Gates, #46/Panel und zuletzt #48/Chat-Iteration.
6. **Dokumentstatus schützen:** Bis ADR-011–015 und der v0.2-Schnitt angenommen sind, bleibt dieses Dokument `proposed`. Danach auf `status: current` heben; die eingefrorene build-spec bleibt historische Baseline.

---

*Quelle: konsolidierter Stellwerk-OS-Masterplan (RFC), transkribiert und in Docs-as-Code überführt. Der Umsetzungsstand wird über GitHub Issues, ADRs und die `current`-Architekturdokumentation geführt, nicht über dieses Zielbild.*
