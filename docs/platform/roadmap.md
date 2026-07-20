---
module: platform
type: roadmap
status: proposed
updated: 2026-07-20
owner: Maurice
last_reviewed: 2026-07-20
review_cycle: per-release
source_of_truth_for: Reihenfolge, Meilensteine und Zielarchitektur-Rahmen der Stellwerk-OS-Entwicklung (Nordstern)
related_adrs: [ADR-011, ADR-012, ADR-013, ADR-014, ADR-015]
related_issues: [44, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64]
update_triggers: [release, angenommener-oder-supersedierter-adr, meilensteinwechsel, geaenderte-planungspraemisse]
supersedes: docs/pm-studio/backend-plan.md
superseded_by: null
---

# Stellwerk-OS – Masterplan: Zielarchitektur, Komponenten-Entscheidungen, Feature-Katalog & Meilensteine

> **Statushinweis (Docs-as-Code):** Dieses Dokument ist die **Roadmap / das Zielbild** von
> Stellwerk. Es ist **`proposed`** und beschreibt **teilweise die Zukunft**. Inhalte hieraus
> dürfen **nicht** als bereits implementierte Ist-Architektur gelesen werden — der Ist-Zustand
> steht ausschließlich in den `current`-Architekturdokumenten, im Code, in den Migrationen und
> im generierten OpenAPI/`packages/contracts`. Die Roadmap wird auf `status: current` gehoben,
> sobald ADR-011–015 und der v0.2-Schnitt angenommen sind. Die v0.1-Build-Spec
> ([build-spec.md](build-spec.md)) bleibt als historische Baseline erhalten und wird nicht
> still durch dieses Dokument überschrieben. Die in **Teil 8** beschriebene Doku-Architektur ist
> selbst Zielbild; endgültige Pfade werden bei der Umsetzung (E17.1) gegen die vorhandene
> Struktur geprüft, bestehende kanonische Dateien werden weiterverwendet.

**Basis:** dev-Stand `3157431` (2026-07-18), konsolidiertes technisches und fachliches Review, Roadmap gemäß [vision.md](vision.md) und [build-spec.md](build-spec.md) §6. Offene Issues #44–49 werden **aktualisiert, nie dupliziert**: #44 bleibt im v0.2-Schnitt; #45–49 werden in den v0.3-Meilenstein verschoben.

**Revision:** 2026-07-20 – konsolidierter Planungsstand nach technischer Tiefenprüfung: engerer v0.2-Schnitt, getrennte Zustandsaggregate, modulverantwortete Definitionen, gestufte Audit-Reife, stabile Idempotenz, Datenminimierung, Agent-Sicherheit, Provider-Policy, Contract-Kompatibilität, Managementziele und Dokumentations-Governance. Finale Feinjustierung (2026-07-20): ADR-Nummernkreis-Abgrenzung, Heimat der vollen Browser-Suite, Coverage-Basislinie, CONTRIBUTING, explizite Dependabot-Triage im Issue-Schnitt.

**Status dieses Dokuments:** `proposed / RFC`. Es ist Zielbild und Priorisierungsrahmen, aber **kein Auftrag, alle enthaltenen Stories sofort als Issues anzulegen**. Nur der jeweils aktive Meilenstein wird atomar in Issues geschnitten. Entscheidungen werden erst nach einzeln nachvollziehbarer ADR-Annahme verbindlich; spätere Meilensteine bleiben bewusst gröber und dürfen sich durch Umsetzungserkenntnisse ändern.

**Leitprinzip (unverändert aus der Vision):** Ein schlanker Kern mit sechs geteilten Plattformfähigkeiten; Fachmodule erfüllen den Modul-Vertrag (kein eigenes Login, LLM nur via Gateway, Audit-Pflicht ab dem dafür ausgewiesenen Reifegrad, einzeln startbar, würdevolle Degradation). Jede Entscheidung unten wird gegen diesen Vertrag geprüft.

**Begriffsregel:** „Dienst" bezeichnet zunächst eine **logische Domänenkomponente innerhalb von `services/core`**, keinen eigenen deploybaren Microservice. Eine spätere Aufteilung braucht ein eigenes ADR und einen nachgewiesenen Betriebsgrund.

---

## Teil 0 – Produkt- und Managementrahmen

### 0.1 Mission, Zielgruppe und Nutzenversprechen

Stellwerk-OS ist eine lokal betreibbare, modular erweiterbare Enterprise-AI-Plattform als Portfolio- und Lernprojekt. Sie soll nicht nur LLM-Funktionen zeigen, sondern nachvollziehbar demonstrieren, wie agentische Anwendungen in einem regulierten Umfeld kontrolliert, betrieben und weiterentwickelt werden können. Primäre Zielgruppen sind technische Reviewer, potenzielle Arbeitgeber im Finanzsektor, Software-Architekten, Product Owner und Entwickler künftiger Fachmodule.

Das Nutzenversprechen lautet: **Fachmodule erhalten wiederverwendbare Agentik, Kosten- und Modelltransparenz, menschliche Kontrollpunkte und später gehärtete Identitäts-/Audit-Fähigkeiten, ohne eigene Schattenplattformen aufzubauen.**

### 0.2 Strategische Ziele und Erfolgsnachweise

| Ziel | Messbarer Nachweis | Frühester belastbarer Stand |
|---|---|---|
| Einen echten Agenten statt eines UI-Mocks liefern | `pms.draft@1.0.0` läuft UI→BFF→Runtime→Gateway, persistiert Zustände und liefert schema-validierten Output | v0.2 |
| Menschliche Kontrolle über agentische Abläufe beweisen | Ein Workflow schreitet ohne erfülltes Review-Gate nicht fort; konkurrierende Commands bleiben idempotent und konfliktsicher | v0.3 |
| Vorgänge und Kosten technisch nachvollziehbar machen | Run, Definition, Prompt-Hash, Modellparameter, Gateway-Calls, Kostenprovenienz und Freigaben sind korreliert | v0.3; gehärtetes Audit v0.4 |
| Enterprise-Sicherheitsgrenzen demonstrieren | Human-/Service-Principals, RBAC, Redaction, Provider-Policy und produktionssichere Defaults sind technisch erzwungen | v0.4–v0.5 |
| Die Plattformthese statt nur eines PMS-Sonderfalls belegen | `idp.extract@1.0.0` nutzt dieselbe Runtime ohne Core-Sonderlogik | v0.7 |
| Betrieb und Weiterentwicklung für Dritte nachvollziehbar machen | versionierte Architektur-, Service-, API-, Test-, Security- und Betriebsdokumentation mit Ownern und Aktualisierungsauslösern | inkrementell ab v0.2; vollständig v1.0 |

### 0.3 Ziele, Nicht-Ziele und Reifegrenze

**Ziele bis v1.0:** ein schlanker modularer Kern, mindestens drei vertragskonforme Fachmodule, ein nachvollziehbarer Agent-/Workflow-Lebenszyklus, belastbare Kostenprovenienz, kontrollierte Cloud-Nutzung, dokumentierter Betrieb sowie eine reproduzierbare synthetische Demo.

**Keine Behauptung dieses Projekts:** Stellwerk-OS ist vor einer gesonderten Härtung, Rechtsprüfung, Skalierungsvalidierung und Betreiberfreigabe kein produktionsfreigegebenes Bankensystem. Begriffe wie „auditierbar", „append-only", „DSGVO-fähig" oder „EU-AI-Act-ready" dürfen nur mit der im jeweiligen Meilenstein tatsächlich bewiesenen Reichweite verwendet werden. Anschlussfähigkeit an regulatorische Prinzipien ist keine Konformitätszusage.

### 0.4 Planungsprämisse und Portfolio-Cut

Der Plan bis v1.0 ist ein Nordstern, kein Terminversprechen. Für den internen Portfolio-Cut im Herbst 2026 gilt:

- **Must:** v0.2 und v0.3 vollständig und poliert.
- **Should:** v0.4 mit providerneutraler Identity, durchgesetztem RBAC und ehrlich begrenztem Audit-Schutz.
- **Stretch:** v0.5 mit Cloud-Adapter, Provider-Policy und atomaren Budgets.
- **Späterer Nordstern:** v0.6–v1.0 nur beginnen, wenn der vorherige Meilenstein abgeschlossen, dokumentiert und vorführbar ist.

Zeitangaben in Wochen werden erst in einem Release Charter festgelegt, wenn verfügbare Kapazität, Abhängigkeiten und Unsicherheit dokumentiert sind. Nach jedem Release werden Roadmap, Risiken, Outcome-Nachweise und der nächste Release Charter überprüft.

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
| `agent_definitions` | Agent Runtime/Registry | `definition_key` (z. B. `pms.draft`) + separate SemVer (`1.0.0`); Core validiert und speichert, das Modul besitzt Manifest/Prompt/Schema, Mindest-Datenklasse, Eingabe-/Tokenlimits und zulässige Provider | v0.2 |
| `prompt_versions` | Agent Runtime/Registry | Prompt-Text + Hash, unveränderlich; Run referenziert die exakte Version | v0.2 |
| `agent_runs` | Agent Runtime | `pending/running/completed/failed`, Erstell-Idempotenz + Request-Hash, `definition_key@semver`, Prompt-Hash, Modellparameter, request_id, Links zu Gateway-Calls und optionaler typisierter Business-Kontext ohne Freitext/PII | v0.2 |
| `run_payloads` | Agent Runtime | nach effektiver Datenklasse getrennte Input-/Output-Inhalte mit Retention; separat löschbar, während nur die zulässigen Metadaten sowie ggf. Hash/Tombstone erhalten bleiben (ADR-015) | v0.2 |
| `run_events` | Agent Runtime | append-only technische Zustandsübergänge; **kein** gehärtetes Compliance-Audit | v0.2 |
| `artifacts`, `artifact_versions` | Agent Runtime/Artifact Store | append-only Versionen mit Provenienz `agent→human→human_edited`, Verweis auf erzeugenden Run/Step; ab Einführung ist das Artefakt die Output-Wahrheit | v0.3 |
| `workflow_definitions`, `workflow_runs`, `step_runs` | Agent Runtime/Workflow | getrennte Mehrschritt-Orchestrierung und Step-Versuche; ein Workflow-Run pinnt seine Workflow- und Agent-Definitionsversionen beim Start | v0.3 |
| `review_gates`, `gate_commands` | Agent Runtime/Gate | offene Review-Gates und idempotente Entscheidungen; kein Status-PATCH | v0.3 |
| `audit_events` | Event/Audit | domänenübergreifend, redigiert und gegen Änderungen durch die App-Rolle geschützt; ersetzt `run_events` nicht | v0.4 |
| `principal_mappings`, `service_clients` | Identity | providerneutrale Human-/Service-Trennung; konkrete Tabellen erst nach OIDC-Spike festlegen | v0.4 |
| `budgets`, `budget_reservations`, `quota_windows` | Telemetrie/Guardrails | atomare Reservierung und Ist-Verrechnung je Principal/Modul | v0.5 |
| `provider_policies` (oder versionierte Policy-Konfiguration) | Model Gateway | Default-deny-Zuordnung von effektiver Datenklasse zu erlaubten Providern; Routingentscheidung ohne Payload protokolliert | v0.5 |
| `eval_cases`, `eval_runs`, `eval_results` | Eval Harness | Golden Sets je Definition@SemVer, Ergebnisse mit Commit-SHA und Prompt-Hash | v0.6 |
| `documents`, `chunks`, `ingest_runs` | RAG-Modulschema | eigenes PostgreSQL-Schema/eigene Rolle `rag`, konsumiert Kern-Dienste | v0.8 |

Eine Postgres-Instanz, aber **echte Schema-/Migrations-Ownership**: Kern-Tabellen migriert nur der Kern. Fachmodule mit eigener Persistenz erhalten eigene PostgreSQL-Schemas, Alembic-Bäume und Datenbankrollen mit per Grant erzwungenen Grenzen – nicht bloß Tabellenpräfixe. Zugriff auf Kern-Daten erfolgt ausschließlich über Kern-APIs, nie durch Cross-Schema-SQL.

---

## Teil 2 – Architekturentscheidungen je Komponente (ADR-Kandidaten)

Die Nummerierung schließt an ADR-010 an. Diese globale Serie gilt für plattformweite Grenzentscheidungen; rein modulinterne Entscheidungen behalten gemäß ADR-003 ihre eigenen Nummernkreise (z. B. `CORE-ADR-###`) – der erste ADR-PR hält diese Abgrenzung im Index fest. **Für v0.2 werden nur ADR-011 bis ADR-015 entschieden.** Alle späteren Kandidaten bleiben bis zu ihrem Meilenstein offen; sie werden nicht vorsorglich als „angenommen" eingecheckt. Das verhindert Architekturentscheidungen ohne Umsetzungserfahrung.

### ADR-011 · Runtime- und Definitions-Ownership
**Kontext:** #45/#47 planen Agent-Zustand im PMS-Store; `backend-plan.md` will ein separates PMS-FastAPI/SQLite; die Vision legt Ausführung und Run-Wahrheit in den Kern.
**Entscheidung:** Der Kern besitzt generische Ausführung und Persistenz. Ein Modul besitzt ein versioniertes Manifest mit `definition_key` (`pms.draft`), separater SemVer (`1.0.0`), Prompt, Input-/Output-Schema, Default-Modell, Mindest-Datenklasse, maximaler Eingabegröße, Token-/Timeout-Limits sowie zulässigen Providern. Fehlende oder überschrittene Limits führen zu einem maschinenlesbaren Validierungsfehler; Eingaben werden niemals still gekürzt. Ein expliziter, idempotenter und vom Modul verantworteter Deployment-Schritt registriert das Manifest über die Core-API; der Core validiert und speichert es, enthält aber **keinen PMS-Seed in seiner eigenen Migration**. Eine veröffentlichte Definition ist unveränderlich; Änderungen erzeugen eine neue Version. Runs sind auf Definition, Prompt-Hash, Modellparameter und Gateway-Calls rückführbar. Das ist Nachvollziehbarkeit – nicht die Behauptung einer deterministischen LLM-Reproduzierbarkeit.
**Verworfen:** separates PMS-Backend, Run-Wahrheit in localStorage, Core-Migrationen mit Fachmodul-Semantik.
**Konsequenz:** `backend-plan.md` wird `status: superseded`; #44–47 werden an dieser Grenze ausgerichtet. localStorage bleibt nur für lokale PM-Daten ohne agentische Herkunft.

### ADR-012 · Getrennte Lebenszyklen, Idempotenz und Ausführung in v0.2
**Entscheidung:** Zustände werden nicht zwischen Run, Workflow, Step und Review-Gate vermischt:

| Aggregat | Erlaubte Kernzustände |
|---|---|
| `agent_run` (v0.2) | `pending → running → completed\|failed`; ab asynchroner Ausführung zusätzlich `cancel_requested → cancelled` |
| `workflow_run` (v0.3) | `pending → running → awaiting_review → completed\|failed`; bei Abbruch `cancel_requested → cancelled` |
| `step_run` (v0.3) | `pending → running → completed\|failed`; ein Rerun erzeugt einen neuen Versuch |
| `review_gate` (v0.3) | `open → approved\|rejected\|superseded` |

`POST /agent-runs` verlangt einen für die logische Aktion stabilen Idempotency-Key. Der Core speichert Request-Hash und Ergebnis unter einer Eindeutigkeitsbedingung `(service_principal, idempotency_key)`: gleicher Key + gleicher Payload liefert denselben Run; gleicher Key + anderer Payload liefert 409. UI/BFF behalten den Key über reine Transport-Retries hinweg. Review-Aktionen sind Commands (`approve`, `reject`, `edit_and_approve`, `rerun_with_feedback`) mit Actor, erwarteter Aggregatversion und eigenem Idempotency-Key; freie Status-PATCHes sind verboten. Jeder Übergang schreibt ein `run_event`.

Ein Abbruch ist ebenfalls ein idempotenter Command. Aus `pending` kann unmittelbar nach `cancelled` gewechselt werden; aus `running` entsteht zunächst `cancel_requested`. Das Stoppen eines bereits übertragenen Provider-Calls ist **best effort**: Der Provider kann die Verarbeitung und Abrechnung trotz lokalem Abbruch fortsetzen. Späte Provider-Ergebnisse dürfen einen abgebrochenen Run nicht wieder auf `completed` setzen; Usage und Kosten werden trotzdem korreliert. Für den synchronen v0.2-Slice ist noch kein Cancel-Endpunkt Pflicht – Timeout und Reconciler bleiben die Übergangslösung, bis der Start-Endpunkt asynchron wird.

v0.2 führt den Einzelschritt synchron im Request aus, persistiert aber Zustand vor und nach jedem Gateway-Aufruf. Ein Startup-Reconciler markiert nur ausreichend alte `running`-Runs als `failed(interrupted)`; die Single-Instance-Grenze wird dokumentiert. Ein Repair-Retry ist ein eigener, kostenpflichtiger und verlinkter Gateway-Call. Ab v0.3 liefert der Start-Endpunkt `202 Accepted` + Polling. Ein Worker/Broker folgt erst bei nachgewiesener Parallelitäts- oder Laufzeitgrenze in einem neuen ADR.

### ADR-013 · BFF-Grenze und Identitäts-Propagation
**Entscheidung:** Browser-Code ruft ausschließlich eigene Next-Server-Routen auf. Die BFF hält Core-URL und Service-Credential server-only. Sie **verwirft** vom Browser gesendete `X-Stw-*`-Identitätsheader und setzt selbst zwei getrennte Kontexte: authentifizierter Service `pms` und menschlicher Nutzer aus der serverseitigen Session. In v0.2 wird der Nutzer als `unverified_dev` markiert; weder Core noch Telemetrie behandeln ihn als starke Identität. Der spätere OIDC-Fluss darf die Feldsemantik nicht brechen.
**Verworfen:** API-Key in `NEXT_PUBLIC_*`, ungeprüfte On-behalf-of-Header, Modul-Key als menschlicher Actor.

### ADR-014 · Kosten- und Preisprovenienz
**Entscheidung:** `gateway_calls` erhält `currency`, `pricing_status ∈ {real, simulated, unknown}`, `price_version`, `service`, `user_context` und optional `run_id`. Unbekannter Preis bedeutet `cost_estimate = NULL`, niemals 0. Ein Run aggregiert Kosten über verlinkte Gateway-Calls, ohne sie als zweite Wahrheit zu duplizieren. Summary und UI zeigen Provider, Modell und Provenienz; simulierte Werte sind sichtbar markiert. Preisperioden werden auf Überlappungen geprüft; Lücken sind zulässig, führen aber zu `unknown`. Jede externe Preisquelle trägt `last_verified`.
**Konsequenz:** Cloud-, lokale und Demo-Kosten bleiben fachlich unterscheidbar, bevor der Leitstand darauf aufbaut.

### ADR-015 · Run-Daten, Klassifizierung und Aufbewahrung
**Entscheidung:** Run-Metadaten und Inhalte werden getrennt behandelt. Metadaten (Definition, Version, Modellparameter, Request-ID, Call-Links, Status, zulässige Hashes) sind standardmäßig persistierbar. Vollständige Inputs/Outputs werden nur nach dokumentierter Datenklasse in getrennt löschbaren Payload-Datensätzen gespeichert; Secrets sind verboten, sensible Felder werden vor Persistenz redigiert, und die Aufbewahrungsdauer ist konfigurierbar. Die effektive Datenklasse eines Runs ist mindestens die höchste Klasse aus Definition, Request-Kontext und referenzierten Dokumenten/Payloads; ein Modul darf sie nicht herunterstufen. Fehlende Klassifizierung führt zum sichersten konfigurierten Default.

Ein Retention-/Löschlauf entfernt Inhalte und hinterlässt nur die nach Daten- und Rechtskonzept zulässigen Metadaten sowie ggf. Hash/Tombstone. Hashes, IDs und Korrelationen können weiterhin personenbeziehbar sein und sind **nicht automatisch** von Lösch- oder Aufbewahrungspflichten ausgenommen. Audit-Events enthalten nie Prompt oder Dokumentinhalt. Personen werden, soweit fachlich möglich, über pseudonyme Principal-IDs statt Klarnamen referenziert. Vor jedem Echtdatenbetrieb wird ein konkretes Lösch-, Aufbewahrungs- und Berechtigungskonzept fachlich und rechtlich geprüft; Crypto-Shredding bleibt eine spätere Option, keine pauschale Lösung.

Bis v0.3 darf der v0.2-Einzelschritt einen klassifizierten JSON-Output im Run-Payload halten; mit Einführung des Artifact Store wird das Artefakt die einzige Output-Wahrheit und der Run hält Referenz + Hash. Demo und CI verwenden ausschließlich synthetische Daten.
**Konsequenz:** Traceability wird nicht durch unkontrollierte Kopien personenbezogener oder vertraulicher Inhalte erkauft. Das Design unterstützt Löschung und Datenminimierung, behauptet aber ohne konkreten Betriebskontext keine vollständige DSGVO-Konformität.

### ADR-016 · Workflow-Ausführung und Framework-Grenze (v0.3)
**Entscheidungskandidat:** #44 benötigt kein Graph-Framework. v0.3 implementiert zunächst die kleinste persistierte Workflow-/Step-Zustandsmaschine. Ein `workflow_run` pinnt beim Start die Workflow-Definition und alle referenzierten Agent-Definitionen auf konkrete Versionen; neu veröffentlichte Versionen gelten nur für neue Runs. LangGraph darf erst übernommen werden, wenn es nachweislich Orchestrierungsaufwand reduziert; dann nur als Interpreter über Stellwerk-Definitionen. Eigene LangGraph-Checkpoint-Stores werden nicht zur zweiten Wahrheit.
**Entscheidungspunkt:** kurzer Spike mit mindestens einem Gate, Rerun und Prozessneustart; anschließend eigenes ADR-Ergebnis „nutzen" oder „vorerst nicht nutzen".

### ADR-017 · Append-only Artefakt-Versionierung (v0.3)
**Entscheidungskandidat:** Ein Artefakt ist Kopf-Datensatz plus append-only `artifact_versions`. Jede Version trägt Provenienz (`agent`, `human`, `human_edited`), erzeugenden Run/Step, Vorgänger und diff-fähigen Payload. „Bearbeiten & bestätigen" und „Wiederherstellen" erzeugen neue Versionen. Chat-Iteration (#48) schreibt ausschließlich über diesen Mechanismus; deshalb wird #49 vor #48 umgesetzt.

### ADR-018 · Audit-Härtung und ehrliche Schutzbehauptung (v0.4)
**Entscheidungskandidat:** `audit_events` erhält eine einheitliche Taxonomie `<domäne>.<objekt>.<verb>`, Redaction und Korrelation. Die App-DB-Rolle bekommt INSERT/SELECT, aber kein UPDATE/DELETE; ein Test mit genau dieser Rolle beweist den Schutz. Das verhindert Veränderungen durch die Anwendung, **nicht** durch privilegierte Datenbankadministratoren. Für stärkere Manipulationsnachweise werden Hash-Kette, signierter Export oder WORM-Zielspeicher separat bewertet. Bis v0.4 heißt `run_events` bewusst „Run-Historie", nicht Compliance-Audit.

### ADR-019 · Providerneutrales OIDC-Zielbild (v0.4)
**Entscheidungskandidat:** Core validiert standardkonforme JWTs und unterscheidet `principal_type: human|service`; Rollen `user`, `auditor`, `admin` werden an Endpunkten durchgesetzt. Keycloak ist der bevorzugte lokale Demonstrator, aber kein fachlicher Vertrag. Ein Security-Spike entscheidet, ob menschliche Delegation durch Token-Forwarding, Token-Exchange oder ein signiertes BFF-internes Delegationstoken erfolgt. `STW_ENV=prod` verweigert DevAuth fail-fast. Realm-/Client-Konfiguration ist versioniert, Secrets bleiben extern.

### ADR-020 · Gateway-Guardrails: Limits und atomare Budgetreservierung (v0.5)
**Entscheidungskandidat:** (1) Eingabe-/`max_tokens`-Limit je Definition ab v0.2, (2) Kostenbudget je Service/Principal, (3) Rate-Limit. Ein Budgetcheck darf nicht nur einen gecachten Telemetrie-Snapshot lesen: Vor dem Provider-Call wird maximaler erwarteter Betrag atomar reserviert und nach dem Call gegen Ist-Kosten verrechnet. Bei unbekannter Preisprovenienz ist nur das Tokenlimit durchsetzbar. Das API-Fehlerobjekt unterscheidet `budget_exceeded`, `rate_limited` und `provider_policy_denied`; HTTP-Status wird semantisch festgelegt (`429` für resetbare Quoten, `403` für harte Policy), nicht pauschal als `402`. Automatischer Provider-Failover ist nicht still erlaubt; jede spätere Fallback-Regel muss ausdrücklich konfiguriert, mit ADR-026 vereinbar und in Telemetrie/Audit nachvollziehbar sein. Multi-Instance-Unterstützung benötigt einen geteilten Zähler oder bleibt ausdrücklich außerhalb des Scopes.

### ADR-021 · Ereignisbasiertes Fortschritts-Streaming (v0.4)
**Entscheidungskandidat:** `GET /api/v1/agent-runs/{id}/events` streamt `run_events` per SSE. Zustands-Streaming kommt vor Token-Streaming, weil es providerneutral ist und HITL direkt verbessert. Das v0.3-Panel pollt über denselben Ereignisvertrag und kann ohne Breaking Change wechseln.

### ADR-022 · Eval-Strategie je Definition@SemVer (v0.6)
**Entscheidungskandidat:** Versionierte Golden Sets enthalten Input, Schema-Checks und fachliche Assertions. Ergebnisse tragen Commit-SHA, Definition/Version, Prompt-Hash und Modellparameter. Deterministische Stub-Smokes dürfen automatisiert laufen; Ollama-/Cloud-Evals sind manuell oder budgetiert geplant und nie Teil des Pflicht-Gates. Ein eigenes schlankes Harness startet; externe Frameworks folgen nur bei belegtem Metrikbedarf.

### ADR-023 · Erzwungene Modul-Persistenzgrenzen (ab IDP/RAG)
**Entscheidungskandidat:** Jedes serverseitig persistierende Fachmodul erhält ein eigenes PostgreSQL-Schema, einen eigenen Alembic-Baum und eine DB-Rolle ohne Schreibrecht auf Core-Schemas. Cross-Domain-Zugriff erfolgt über HTTP-APIs. RAG startet mit pgvector im bestehenden PostgreSQL; ein eigener Vektor-Dienst benötigt ein Skalierungs-/Feature-ADR.

### ADR-024 · Ehrlicher, deterministischer Demo-Modus (v0.6)
**Entscheidungskandidat:** `STW_DEMO=true` seedet ein vollständig synthetisches Szenario mit Runs, Gates, Run-Historie, später Audit und Kosten `pricing_status=simulated`. Jede Oberfläche kennzeichnet Simulation sichtbar. `make demo` liefert in höchstens zwei Minuten eine erzählbare Tour und gemeinsam genutzte Fixtures für Browser-E2E-Tests.

### ADR-025 · Agent- und Tool-Sicherheit: Modellinhalt ist untrusted (gestuft ab v0.2)
**Entscheidungskandidat:** Modell-, Nutzer-, OCR- und Retrieval-Inhalte gelten als untrusted data und sind niemals unmittelbar ausführbare Befehle. Der v0.2-Slice erzeugt ausschließlich schema-validierte Draft-Daten ohne Tools oder externe Seiteneffekte. Freitext wird in UIs kontextgerecht escaped und nie als ungeprüftes HTML gerendert. Instruktionen und Nutzdaten werden strukturell getrennt; eine Prompt-Anweisung wie „ignoriere eingebettete Befehle" ist nur Defense-in-Depth, keine Sicherheitsgrenze.

Sobald Tools/Konnektoren eingeführt werden, gelten zusätzlich: deklarierte Tool-Allowlist, schema-validierte Parameter, Autorisierung pro Aktion, Least-Privilege-Credentials, Egress-Allowlist, Zeit-/Kostenlimits und `review_required` als Default für externe Schreibaktionen. Ein LLM darf keine beliebigen URLs, Shell-Kommandos, SQL-Anweisungen oder internen Commands erzeugen und direkt ausführen. Deterministische Negativtests prüfen die technische Sperre; Injection-Fälle in Golden Sets ergänzen diese Tests, ersetzen sie aber nicht.

### ADR-026 · Datenklassifizierung und Provider-Policy (Felder ab v0.2, Enforcement v0.5)
**Entscheidungskandidat:** Die effektive Datenklasse entsteht gemäß ADR-015 aus Definition, Request und referenzierten Quellen. Die erlaubte Provider-Menge ist die Schnittmenge aus globaler Policy, Definition-Allowlist und Policy der effektiven Datenklasse. Fehlende Policy bedeutet `default deny`. Vertrauliche Inhalte erreichen keinen Cloud-Provider ohne ausdrücklich versionierte und autorisierte Freigabe. Ein Modul oder Nutzer kann die effektive Klasse nicht herabsetzen.

Jede erlaubte oder verweigerte Routingentscheidung wird ohne Inhalts-Payload mit Definition, Datenklasse, Provider, Policy-Version und Request-ID telemetriert; ab v0.4 kommt ein redigiertes Audit-Event hinzu. Stiller Failover ist verboten. Ein späterer expliziter Fallback darf nur zwischen bereits erlaubten Providern stattfinden und muss Kosten-/Routingprovenienz erhalten.

### ADR-027 · Contract-Kompatibilität und Deprecation (vor zweitem Konsumenten entscheiden)
**Entscheidungskandidat:** OpenAPI ist die maschinenlesbare Schnittstellenwahrheit; `@stellwerk/contracts` wird daraus generiert. Additive Änderungen sind zulässig, sofern bestehende Konsumenten weiter kompilieren und Contract-Tests bestehen. Breaking Changes benötigen eine bewusst erhöhte API-/Paket-Major-Version, einen dokumentierten Migrationspfad und – soweit wirtschaftlich – mindestens ein definiertes Deprecation-Fenster. CI kompiliert alle vorhandenen Konsumenten gegen den neuen Contract und erkennt Drift. Die Monorepo-Struktur ist kein Freibrief für unmarkierte synchrone Brüche.

---

## Teil 3 – Wie die Komponenten interagieren: die fünf Schlüssel-Sequenzen

Neben dem Agent-Run (1.2) definieren diese Abläufe die Verträge zwischen den Diensten:

**S2 · HITL-Review (v0.3):** Ein `workflow_run` erreicht einen Schritt mit `review_required` – der zugehörige `step_run` wird erfolgreich beendet, ein `review_gate` öffnet sich und der Workflow wechselt auf `awaiting_review`. Runtime schreibt `run_events`; ein gehärtetes `audit_event` kommt erst ab v0.4 zusätzlich hinzu. Das PMS-Panel lädt Gate und Artefakt via BFF. `edit_and_approve` erzeugt eine `human_edited`-Artefaktversion und schließt das Gate; `rerun_with_feedback` erzeugt einen **neuen Step-Versuch**, statt den alten Zustand zurückzudrehen. Ein konkurrierender Command mit veralteter Version erhält 409 (ADR-012/017).

**S3 · Budget-Durchsetzung (v0.5):** Das Gateway berechnet vor dem Provider-Call eine maximale Kostenschätzung, reserviert sie atomar je Principal/Periode und verrechnet danach die Ist-Kosten. Bei unbekanntem Preis greift nur das Tokenlimit. Überschreitung liefert ein strukturiertes `budget_exceeded`, schreibt Telemetrie und ab v0.4 Audit, und beendet den Run verständlich als `failed`. Kein Budgetversprechen basiert allein auf einem gecachten Summary-Wert (ADR-020).

**S4 · Eval-Regression (v0.6):** `workflow_dispatch` → Runner lädt Golden Sets für zwei konkrete `definition_key@semver`-Versionen → deterministische Stub-Smokes bzw. explizit gestartete Ollama-/Cloud-Evals → `eval_results` mit Commit-SHA, Prompt-Hash und Modellparametern → Leitstand zeigt Pass-Rate, Schema-Konformität und Kosten/Fall. Live-LLM-Evals sind nie Pflicht-CI (ADR-022).

**S5 · Leitstand liest nur (v0.6):** Leitstand-BFF konsumiert als `auditor` ausschließlich versionierte Kern-APIs und generierte Contracts; ein Architekturtest verbietet SQL-Zugriff, Provider-SDKs und Handtypen. Das beweist den **Lese- und Modulvertrag**, aber noch nicht die Wiederverwendbarkeit der Agent Runtime. Dieser stärkere Beweis folgt mit einem dünnen zweiten Fachagenten vor oder spätestens innerhalb des IDP-Meilensteins.

**S6 · Datenklasse und Provider-Entscheidung (v0.5):** Runtime übergibt effektive Datenklasse, Definition und gewünschtes Modell an den Gateway → Gateway bildet die Schnittmenge aus globaler Policy, Definition-Allowlist und Datenklassenregel → bei leerer Menge `403 provider_policy_denied`, ohne Provider-Call und ohne Payload im Ereignis → bei Zulassung werden Provider, Policy-Version und Request-ID telemetriert, danach folgen Budgetreservierung und Call. Fällt der gewählte Provider aus, endet der Run ehrlich als Providerfehler; es gibt keinen stillen Wechsel zu einem anderen Provider.

---

## Teil 4 – Feature-Katalog als Epics mit User Stories

Rollen: **PO** (Product Owner/PM-Studio-Nutzer), **Reviewer** (Mensch am Gate), **Admin** (Plattform), **Auditor** (Governance/Compliance), **Mod-Dev** (Modul-Entwickler), **Ops** (Betrieb), **Besucher** (Recruiter/Interessent, der das Repo klont).
Story-Format kompakt: *Als ROLLE will ich X, um Y.* – AK stichpunktartig. **Nur E1/E2 und E3.1 sind derzeit issue-reif.** Alle Stories ab v0.3 sind Roadmap-Kandidaten und werden erst nach dem vorherigen Release detailliert geschnitten. Pro PR gilt ein primäres Issue; ein Epic ist nie automatisch ein einzelnes Implementierungs-Issue.

### Epic E1 · Belastbare Foundation *(v0.2-A, blockierende Vorphase)*
| # | Story | Kern-AK |
|---|---|---|
| E1.1 | Als PO will ich, dass alte lokale Projektdaten beim Update nie die App crashen, um kein Datenverlust-Risiko zu haben. | Migration tolerant ggü. fehlendem `risks`; Fixture aus altem Schema; gesamte Unit-/Browser-Suite grün – ohne fest codierte Testanzahl |
| E1.2 | Als Ops will ich, dass CI beide Container baut **und startet**, um Builder/Runtime-Brüche vor dem Merge zu sehen. | getrennte Core-/PMS-Builds; Smoke mit Produktions-Stage: `/readyz` bzw. `/` = 200; Runtime-Abhängigkeiten werden tatsächlich importiert |
| E1.3 | Als Ops will ich eine festgeschriebene Laufzeitmatrix (Py 3.12, Node 22), um Dependabot-Majors kontrolliert zu triagieren. | Matrix in `runbooks/ci.md`; #22/#40/#41/#42 geschlossen/ersetzt, #25/#39 nach Rebase entschieden |
| E1.4 | Als Ops will ich, dass der Prod-Modus unsichere Defaults verweigert, um keinen falschen Sicherheitseindruck zu erzeugen. | `STW_ENV=prod` + DevAuth = Startabbruch; Pflicht-Secrets; keine offenen Infra-Ports; Grafana-Anon aus |
| E1.5 | Als Ops will ich, dass `/readyz` den Migrationsstand prüft, um „erreichbar ≠ bereit" zu unterscheiden. | 200 nur bei DB erreichbar + Alembic-Head; 503 mit maschinenlesbarem Grund bei DB-Ausfall, fehlender oder veralteter Migration |
| E1.6 | Als Mod-Dev will ich einen hermetisch getesteten, robusten Ollama-Provider, um Fehlerbilder garantieren zu können. | MockTransport statt Loopback; `trust_env` entschieden; ungültiges JSON/Shape → 502; jeder Fehler telemetriert |
| E1.7 | Als Besucher will ich korrekte Root-Doku und ehrliche Gates, um dem Repo in 5 Minuten zu vertrauen. | Root-Skripte delegieren; README nennt `pms`-Profil + Release; build-spec eingefroren; backend-plan superseded; mindestens der kritische Playwright-Smoke läuft als Pflicht-Gate; externe GitHub Actions sind per Commit-SHA mit Versionskommentar gepinnt und automatisiert aktualisierbar; Release-/Branch-Verfahren basiert auf dem zuvor verifizierten Ist-Modell; CONTRIBUTING.md ergänzt die OSS-Standarddateien (Verweis auf Workflow, Issue-First-Prinzip, Lizenz) |
| E1.8 | Als Mod-Dev will ich nur die unmittelbar tragenden Entscheidungen als ADRs festhalten, um Umsetzung ohne Papierstau zu ermöglichen. | ADR-011–015 einzeln geprüft und angenommen; Index aktualisiert; spätere ADR-Kandidaten bleiben `proposed` und werden **nicht** vorab als Dateien erzeugt; Abgrenzung der globalen Plattform-Serie zu den Modul-Nummernkreisen aus ADR-003 im ADR-Index festgehalten |

### Epic E2 · Erster echter Agent *(v0.2 – Update #44)*
| # | Story | Kern-AK |
|---|---|---|
| E2.1 | Als Mod-Dev will ich die Core/Modul-/Runtime-Grenze entschieden haben, um #44–49 widerspruchsfrei umzusetzen. | ADR-011–015 angenommen; Vision, Agent-Doku, backend-plan und Issues konsistent; keine Sammelannahme späterer ADRs |
| E2.2 | Als Mod-Dev will ich Agent-Definitionen modulverantwortet registrieren, um Fachsemantik aus dem Core herauszuhalten. | `agent_definitions` + `prompt_versions`; PMS-Manifest `pms.draft@1.0.0`; Eingabe-/Token-/Timeout-Limits und Provider-Allowlist; idempotenter Registrierungsbefehl; Core-Migration enthält keinen PMS-Seed; Contracts driftfrei |
| E2.3 | Als PO will ich per Klick einen Projekt-Draft von einem echten LLM erzeugen, um vom Mock zur echten Hilfe zu kommen. | BFF→Run-API→Gateway (Stub+Ollama); stabiler Idempotency-Key + Request-Hash-Vertrag; übergroße Eingabe wird abgelehnt statt gekürzt; Output schema-validiert; höchstens ein als eigener Call erfasster Repair-Retry; Definition/Prompt/Modellparameter/request_id/Call-Links persistiert |
| E2.4 | Als PO will ich bei Core-, Provider- oder Schemafehlern einen ehrlichen Zustand mit sicherem Retry, um lokale Daten und Vertrauen zu bewahren. | `schema_error`, `provider_error`, `core_unavailable` getestet; lokale Daten unangetastet; kein stiller Mock-Fallback; erneuter Versuch nutzt neuen Aktions-Key und bleibt historisch erkennbar |
| E2.5 | Als prüfende Person will ich jeden Run einem Service, Dev-Nutzer, Prompt und Gateway-Call zuordnen, um ihn technisch nachvollziehen zu können. | `service` + `user_context(unverified_dev)` getrennt; `run.completed\|failed` als `run_event`; Korrelation über run_id/request_id; ausdrücklich noch kein Compliance-Audit-Claim |
| E2.6 | Als Ops will ich nach Prozessneustart keine dauerhaft laufenden Zombie-Runs haben. | Reconciler markiert nur Runs älter als dokumentierten Grenzwert als `failed(interrupted)`; Single-Instance-Annahme und Timeout-Fall getestet |

### Epic E3 · Nachvollziehbare Kosten (FinOps) *(E3.1 in v0.2; Rest ab v0.3)*
| # | Story | Kern-AK |
|---|---|---|
| E3.1 | Als prüfende Person will ich reale, simulierte und unbekannte Kosten unterscheiden, um Run-Daten nicht falsch zu interpretieren. | `currency`/`pricing_status`/`price_version` in DB+API; unbekannt = NULL, nie 0; ADR-014 umgesetzt |
| E3.2 | Als Admin will ich Summary nach Provider+Modell mit Provenienz, um Cloud- von Demo-Kosten zu trennen. | Summary-Erweiterung; Grafana-Panels beschriftet; Seed durchgängig `simulated` |
| E3.3 | Als Ops will ich validierte Preisperioden, um stille Preisfehler auszuschließen. | Überlappung = Startfehler; Lücke = `unknown`; `last_verified` je Quelle; Tests |
| E3.4 | Als PO will ich die Kosten „meines" Laufs sehen, um Agent-Nutzen einzuschätzen. | Run-Detail aggregiert usage+cost+provenienz aus verlinkten Gateway-Calls; PMS zeigt sie am Draft; keine zweite Kostenwahrheit |
| E3.5 | Als Admin will ich Kosten einem fachlichen Kontext zuordnen, um Nutzen und Ausgaben gemeinsam bewerten zu können. | optionale versionierte Felder wie `project_ref`, `business_process` und `cost_center_ref`; kein beliebiges Freitext-JSON, keine PII; bounded length/cardinality; Telemetrie und Leitstand gruppieren nur freigegebene Dimensionen |

### Epic E4 · HITL: Signale & Freigaben *(v0.3 – Updates #45/#46/#47)*
| # | Story | Kern-AK |
|---|---|---|
| E4.1 | Als Mod-Dev will ich Workflow-Definitionen mit Schritten und `review_required` persistieren, um Ketten deklarativ zu bauen. | `definition_key` + SemVer; ungültige Kanten beim Registrieren abgelehnt; PMS-Planungsworkflow modulverantwortet registriert; ADR-016 entschieden |
| E4.2 | Als Reviewer will ich, dass ohne meine Freigabe kein Folgeschritt läuft, um die Kontrolle zu behalten (Signal-Prinzip). | `workflow_run`, `step_run` und `review_gate` getrennt; Gate blockiert nachweislich; Neustart verliert keinen Zustand; E2E-Beweis |
| E4.3 | Als Reviewer will ich Freigaben idempotent und konfliktsicher, damit Doppelklicks/zweite Reviewer nichts kaputtmachen. | Commands mit Idempotency-Key + erwarteter Gate-Version; identischer Doppel-Command liefert dasselbe Ergebnis; veralteter konkurrierender Command → 409 |
| E4.4 | Als Reviewer will ich „Bestätigen / Bearbeiten & bestätigen / Erneut mit Feedback", um Output wirksam zu steuern. | drei Commands end-to-end; Edit → `human_edited`-Version; Feedback erzeugt neuen Step-Versuch, alte Ausführung bleibt unverändert |
| E4.5 | Als prüfende Person will ich jeden Übergang mit Actor/Zeit/Request rekonstruieren können. | `run_events` append-only und chronologisch abfragbar; ab v0.4 zusätzlich redigierte Audit-Events |
| E4.6 | Als PO will ich anstehende Freigaben gesammelt sehen (Inbox), um nichts zu übersehen. | Inbox-Ansicht listet `awaiting_review` über Projekte; Badge; leerer Zustand |
| E4.7 | Als PO will ich einen laufenden oder wartenden Workflow abbrechen können, um Fehlbedienung und weitere Kosten zu begrenzen. | idempotenter Cancel-Command; `cancel_requested`/`cancelled`; späte Provider-Antwort kann Run nicht reaktivieren; Best-effort-Grenze und mögliche Restkosten sichtbar; Neustartfall getestet |

### Epic E5 · Artefakte mit Gedächtnis *(v0.3 – Neuschnitt #49 vor #48)*
| # | Story | Kern-AK |
|---|---|---|
| E5.1 | Als PO will ich jede Artefaktversion mit Herkunft sehen, um Agent- von Menschenarbeit zu unterscheiden. | append-only Versionen; Provenienz-Badge in UI; Verweis auf Run/Step |
| E5.2 | Als PO will ich zwei Versionen vergleichen und zurückrollen können, um Fehlentwicklungen zu korrigieren. | Diff-Ansicht; „Wiederherstellen" erzeugt neue Version (nie Löschung) |
| E5.3 | Als PO will ich per Chat am Artefakt iterieren, ohne Historie zu verlieren. | Chat-Turns erzeugen Versionen über E5.1-Mechanik; #48 erst nach #49 |
| E5.4 | Als Auditor will ich, dass die Anwendung keine Artefaktversion unbemerkt verändern oder löschen kann, um Nachweispflichten zu unterstützen. | kein fachlicher Update/Delete-Pfad; App-Rolle ohne UPDATE/DELETE; DB-Test; geregelte Retention/DSGVO-Löschung nur über privilegierten Prozess mit Tombstone und Audit; Admin-Grenze dokumentiert |

### Epic E6 · Identität & Zugriff *(v0.4)*
| # | Story | Kern-AK |
|---|---|---|
| E6.1 | Als Admin will ich standardkonformes OIDC statt DevAuth, um Nutzer real zu unterscheiden. | JWT-Validierung via JWKS; DevAuth nur dev; prod verweigert DevAuth; Keycloak als optionaler lokaler Kandidat nach Spike |
| E6.2 | Als Admin will ich Human- und Service-Principals getrennt, um Module und Menschen sauber zu autorisieren. | `principal_type`; Service-Authentisierung plus der in ADR-019 gewählte Delegationsfluss; Felder aus ADR-013 bleiben semantisch stabil |
| E6.3 | Als Auditor will ich rollenbasierte Sicht (user/auditor/admin) durchgesetzt, damit Rollen mehr als Deko sind. | erste echte Autorisierung an Telemetrie/Audit/Registry; Tests je Rolle inkl. Verweigerung |
| E6.4 | Als Ops will ich Token-Rotation und Secret-Handling dokumentiert, um den Betrieb zu beherrschen. | Security-/Ops-Doku: Tokenfluss, Rotation, lokale Demo ohne Secrets im Repo |

### Epic E7 · Gegen App-Änderungen geschütztes Audit *(v0.4)*
| # | Story | Kern-AK |
|---|---|---|
| E7.1 | Als Auditor will ich ein gegen Änderungen durch die Anwendung geschütztes Ereignis-Log, um nachträgliche App-Manipulation zu verhindern. | App-Rolle ohne UPDATE/DELETE; Test nutzt exakt diese Rolle; DBA-Grenze und Optionen für stärkere Tamper Evidence dokumentiert |
| E7.2 | Als Auditor will ich Events nach Modul/Actor/Zeit/Run filtern, um gezielt zu prüfen. | paginierte Lese-API, RBAC-geschützt; Korrelation request_id↔run_id |
| E7.3 | Als Admin will ich Redaction, damit keine Prompts/Secrets im Audit landen. | Redaction-Pipeline + Tests; Payload referenziert statt kopiert |
| E7.4 | Als Ops will ich Aufbewahrung/Export geregelt, um Speicher und Nachweis zu balancieren. | Archiv-/Export-Strategie dokumentiert; v1.0: Export-Job |

### Epic E8 · Cloud-Ready Gateway und Guardrails *(v0.5 – ADR-020)*
| # | Story | Kern-AK |
|---|---|---|
| E8.1 | Als Admin will ich Azure OpenAI per Settings zuschalten, um lokal→Cloud ohne Codeänderung zu wechseln. | Provider hinter Registry; Deployment-Mapping validiert; Fehlkonfig = `gateway_misconfigured` |
| E8.2 | Als Ops will ich alle Azure-Fehlerbilder ohne Netz getestet, um CI netzfrei zu halten (ADR-006). | MockTransport: 200/401/403/429+Retry-After/5xx/Timeout/ungültige Response |
| E8.3 | Als Auditor will ich Azure-Kosten mit realen Preisperioden und Provenienz, um FinOps belastbar zu machen. | `pricing_status=real`; Perioden aus Cost-Mapper-Muster; Währung korrekt |
| E8.4 | Als Admin will ich Kostenbudgets je Modul/Principal, um Ausgaben zu deckeln. | atomare Reservierung + Ist-Verrechnung; strukturiertes `budget_exceeded`; unbekannter Preis fällt sicher auf Tokenlimit zurück; Audit `gateway.budget.denied` |
| E8.5 | Als Admin will ich Rate-Limits je Principal, um Missbrauch/Amok-Agenten zu bremsen. | `rate_limited` + `Retry-After`; Fenster-Isolation je Principal; Single-Instance-Grenze dokumentiert; Default aus |
| E8.6 | Als Admin will ich Provider nach effektiver Datenklasse freigeben oder sperren, damit vertrauliche Inhalte nicht unkontrolliert die lokale Grenze verlassen. | `default deny`; Schnittmenge globaler Policy/Definition/Datenklasse; Modul kann Klasse nicht absenken; `provider_policy_denied`; Routingprovenienz ohne Payload; kein stiller Failover |
| E8.7 | Als Mod-Dev will ich einen OpenAI-Provider als dritten Adapter, um Austauschbarkeit dreifach zu belegen. *(frühestens v0.7, nur bei Mehrwert)* | gleiche netzfreie Testmatrix wie Azure; kein dritter Adapter nur für eine Kennzahl |

### Epic E9 · Leitstand (Lese-Modulvertrag) *(v0.6)*
| # | Story | Kern-AK |
|---|---|---|
| E9.1 | Als Admin will ich Kosten-/Modell-Dashboards je Provider/Modul/Zeitraum, um die Plattform zu steuern. | liest nur Kern-APIs via Contracts; Provenienz sichtbar; Filter |
| E9.2 | Als Auditor will ich den Audit-Trail mit Drilldown bis zum Run, um Vorgänge zu rekonstruieren. | Event-Liste → Run-Detail → Artefaktversionen verkettet |
| E9.3 | Als Admin will ich Budget-Stände und -Verletzungen auf einen Blick, um einzugreifen bevor es teuer wird. | Budget-Widgets; Verletzungen mit Zeit/Principal |
| E9.4 | Als Admin will ich Eval-Ergebnisse je Definition@Version vergleichen, um Modelle/Prompts datenbasiert zu wählen. | Vergleichsansicht Pass-Rate/Kosten/Fall über Commits |
| E9.5 | Als Besucher will ich den Leitstand als Beweis des Lese-Modulvertrags, um die Architektur zu verstehen. | Architekturtest: kein Modul-SQL auf Core-Schemas, kein Provider-SDK, keine Handtypen; eigenes Compose-Profil; CI-Job `lst`; Runtime-Wiederverwendung wird nicht behauptet |

### Epic E10 · Eval-Harness *(v0.6 – ADR-022)*
| # | Story | Kern-AK |
|---|---|---|
| E10.1 | Als Mod-Dev will ich Golden Sets je Definition@Version pflegen, um Qualität zu fixieren. | `eval_cases` versioniert; ≥5 Fälle für `pms.draft` |
| E10.2 | Als Mod-Dev will ich deterministische Smokes und bewusst gestartete Modell-Evals, um Regressionen zu sehen. | Stub-Smoke automatisiert; Ollama/Azure manuell oder budgetiert; kein Live-LLM im Pflicht-Gate; Ergebnisse mit SHA/Prompt-Hash/Modellparametern |
| E10.3 | Als Admin will ich Modell-/Promptvergleich als Report, um Wechselentscheidungen zu begründen. | Vergleich zweier Versionen; menschenlesbarer Report |
| E10.4 | Als Mod-Dev will ich Schema-Konformität als härtestes Kriterium, um Ausführbarkeit zu garantieren. | Schema-Assertions Pflichtteil jedes Falls |
| E10.5 | Als Security-Reviewer will ich Prompt-Injection- und untrusted-content-Fälle regressiv prüfen, um Schwächen sichtbar zu machen. | versionierte Negativfälle für Nutzer-/OCR-/Retrieval-Inhalte; Ergebnis getrennt von deterministischen Tool-/Egress-Sperrtests bewertet; kein Bestehen eines Golden Sets als alleiniger Sicherheitsnachweis |

### Epic E11 · Vorschlags-Inbox *(v0.6 – aus der Vision: Agenten schreiben nie direkt in Bestandsdaten)*
| # | Story | Kern-AK |
|---|---|---|
| E11.1 | Als PO will ich Agentvorschläge (neue Story, Risiko, Task) in einer Inbox statt direkt im Bestand, um Kontrolle zu behalten. | Vorschlag = Artefaktversion mit Status `proposed`; Annahme erzeugt Bestandsobjekt + Audit |
| E11.2 | Als PO will ich Vorschläge annehmen/ablehnen/ändern-und-annehmen, um schnell zu kuratieren. | drei Aktionen; Provenienz gemäß ADR-017 |
| E11.3 | Als Auditor will ich abgelehnte Vorschläge einsehbar, um Agentenverhalten zu bewerten. | Ablehnungen bleiben abfragbar (append-only) |

### Epic E12 · Betrieb & Observability *(quer, v0.3–v0.6)*
| # | Story | Kern-AK |
|---|---|---|
| E12.1 | Als Ops will ich Backup/Restore der Postgres-Volumes dokumentiert und getestet, um Datenverlust zu überleben. | `operations.md` mit geprobter Anleitung |
| E12.2 | Als Ops will ich Fortschritt live (SSE) statt Polling, um HITL-UX und Effizienz zu verbessern. *(v0.4, ADR-021)* | `/agent-runs/{id}/events` SSE; Panel-Upgrade ohne API-Bruch |
| E12.3 | Als Ops will ich npm-Advisories im Gate, um Dependency-Risiken nicht nur bei Docker-Images zu scannen. | `npm audit`-Job mit Schwellwert + begründeter Ignore-Liste |
| E12.4 | Als Ops will ich Alerting-Basis (Budget, Fehlerrate, Gate-Stau) in Grafana, um Probleme zu sehen bevor Nutzer sie melden. | 3 provisionierte Alerts; Runbook-Verweis je Alert |
| E12.5 | Als Besucher will ich `make demo` mit erzählbarem Komplettszenario, um das Projekt in 2 Minuten zu erleben. *(v0.6, ADR-024)* | vollständig synthetischer, sichtbar simulierter Seed: Runs, Gates, Audit, Kosten; README-Abschnitt „Demo-Tour" |
| E12.6 | Als Ops will ich einen verifizierten Release-Ablauf, um Tags, Branches, Migrationen und Rückrollbarkeit konsistent zu behandeln. | tatsächliches Branch-Modell zunächst dokumentiert; Runbook für Versionierung, Release, Tag, Images, Migration und Rollback; kein ungeprüft unterstellter `dev→main→Tag→Rücksync`-Prozess |

### Epic E13 · IDP-Modul *(v0.7 – Tier 2; zweiter Agent-Runtime-Beweis)*
| # | Story | Kern-AK |
|---|---|---|
| E13.1 | Als Sachbearbeiter will ich Dokumente hochladen und strukturierte Daten extrahiert bekommen, um manuelle Erfassung zu sparen. | zuerst dünner API-Slice, dann UI; `idp.extract@1.0.0` modulverantwortet registriert; OCR→Gateway; PostgreSQL-Schema/Rolle `idp` nach ADR-023; ausschließlich synthetische/anonymisierte Beispiele; **keine Core-Sonderlogik** |
| E13.2 | Als Sachbearbeiter will ich Extraktionen im HITL-Panel prüfen/korrigieren, um Qualität zu sichern. | **wiederverwendet** Gate Service + Review-Panel-Muster (E4) – kein neues HITL |
| E13.3 | Als Auditor will ich je Feld die Herkunft (OCR/LLM/Mensch) sehen, um Extraktionen zu verteidigen. | Feld-Provenienz im Artefakt; Konfidenzwerte gespeichert |
| E13.4 | Als Admin will ich IDP-Qualität im Eval-Harness messen (F1 je Feldtyp), um Modelle zu vergleichen. | Golden Set aus anonymisierten Beispieldokumenten; Leitstand-Report |

### Epic E14 · Knowledge & RAG *(v0.8 – Tier 3)*
| # | Story | Kern-AK |
|---|---|---|
| E14.1 | Als Nutzer will ich Dokumente fragen und Antworten mit Quellen erhalten, um Wissen auffindbar zu machen. | `rag.answer@1.0.0`; Chunks+Zitate; pgvector (ADR-023); Embeddings via Gateway |
| E14.2 | Als Admin will ich Ingest-Läufe (Chunking, Versionierung) nachvollziehen, um den Index zu beherrschen. | `ingest_runs` mit Doku-Version; Re-Ingest idempotent |
| E14.3 | Als Auditor will ich Rechteprüfung über Kern-Identity, damit Suche keine Berechtigungen umgeht. | Dokument-Scope an Principal geprüft; Tests je Rolle |
| E14.4 | Als Mod-Dev will ich RAG-Qualität (Faithfulness/Recall) im Eval-Harness, um Halluzination messbar zu machen. | RAG-Metriken als Harness-Erweiterung (Folge-ADR zu Framework) |
| E14.5 | Als Nutzer will ich, dass die Plattform-Doku selbst durchsuchbar ist (Frontmatter sei Dank), um Stellwerk mit Stellwerk zu erklären. | `docs/` als erster Korpus; Dogfooding-Demo |

### Epic E15 · Flow-Modul *(v0.9 – Tier 3)*
| # | Story | Kern-AK |
|---|---|---|
| E15.1 | Als PO will ich Workflows visuell aus registrierten Agenten zusammenstecken, um ohne Code zu automatisieren. | React-Flow-Canvas erzeugt/editiert `workflow_definitions` – **keine eigene Engine**, nur Editor über ADR-016-Verträgen |
| E15.2 | Als PO will ich Fake-Konnektoren (fake_jira, fake_outlook), um Enterprise-Flows realistisch zu demonstrieren. | Konnektor-Schritte mit deklarierten IO-Schemas; deterministisch für Demo/Eval |
| E15.3 | Als Reviewer will ich Gates im Canvas sichtbar platzieren, um Kontrollpunkte zu designen. | `review_required` als Knoten-Eigenschaft; Validierung beim Speichern |

### Epic E16 · v1.0-Reife *(v1.0)*
| # | Story | Kern-AK |
|---|---|---|
| E16.1 | Als Besucher will ich eine Doku-Site (Architektur, ADR-Index, Modul-Verträge, Demo-Tour), um das Projekt ohne Repo-Archäologie zu verstehen. | generierte Site aus `docs/` (Frontmatter-Nutzung); Deploy via Pages |
| E16.2 | Als Ops will ich Audit-Export und Aufbewahrung produktreif, um Compliance-Anforderungen abzubilden. | Export-Job; Strategie umgesetzt (E7.4) |
| E16.3 | Als Admin will ich ein Upgrade-Runbook v0.x→v1.0, um Bestandsinstallationen mitzunehmen. | Migrationskette getestet auf Demo-Daten |
| E16.4 | Als Mod-Dev will ich einen dokumentierten „Neues-Modul-Guide" (Vertrag als Checkliste + Template), um Erweiterbarkeit zu beweisen. | Guide + `apps/_template`-Gerüst; Leitstand/IDP als Referenzen verlinkt |
| E16.5 | Als Besucher will ich eine Regulatorik-Landkarte, um die Anschlussfähigkeit der Plattformfunktionen zu verstehen. | versionierte Zuordnung von Prinzipien wie Human Oversight, Logging, Transparenz und Risikosteuerung zu implementierten Features; Quelle, Stand und Owner; ausdrücklich keine Rechts- oder Konformitätsbehauptung |
| E16.6 | Als Besucher will ich optional eine öffentlich erreichbare Read-only-Demo auf synthetischen Daten, um Stellwerk ohne lokale Installation zu erleben. | frühestens nach Identity und Guardrails; Threat Model, read-only Principal, harte Kosten-/Rate-Limits, Abuse-Schutz, keine Echtdaten; Abschaltung möglich; kein Pflichtkriterium für v1.0, falls Betriebskosten/-risiken überwiegen |

### Epic E17 · Dokumentation & Management-Governance *(quer, ab v0.2-A)*
| # | Story | Kern-AK |
|---|---|---|
| E17.1 | Als neuer Mitwirkender will ich eine eindeutige Dokumentenlandkarte, um jede verbindliche Information ohne Suche nach konkurrierenden Wahrheiten zu finden. | `docs/README.md` + Source-of-Truth-Matrix; Status/Owner/Reviewdatum/Aktualisierungsauslöser im Frontmatter; Superseded-Dokumente verweisen auf Nachfolger |
| E17.2 | Als Projektverantwortlicher will ich Vision, Ziele, Nicht-Ziele, Outcome-Maße, Risiken und den aktiven Release Charter getrennt von technischen Details pflegen. | Product Brief; Goals/Non-Goals; Outcomes; Risk Register; ein Release Charter nur für den aktiven Meilenstein; Roadmap bleibt Nordstern statt Taskliste |
| E17.3 | Als Entwickler will ich Architektur, Entscheidungen, Services und Schnittstellen versionsnah dokumentiert, damit Code und Erklärmodell nicht auseinanderlaufen. | arc42-lite-Überblick; ADR-Index; Service-Handbuch je realer Fähigkeit/Modul; OpenAPI als Schnittstellenwahrheit; generierte Contracts und Beispiele driftfrei |
| E17.4 | Als Ops-, Test- oder Security-Reviewer will ich ausführbare Betriebs-, Test- und Sicherheitsdokumentation, um Verhalten und Grenzen reproduzierbar zu prüfen. | Production Handbook; Deployment/Backup/Restore/Incident-Runbooks; Teststrategie/-matrix inkl. in CI erhobener Coverage-Basislinie je Workspace (als Artefakt mit Commit-SHA referenziert, Trend statt frühem Schwellwert-Gate); Threat Model; Datenklassifizierung; Retention/Löschung; Secrets-Konzept; Nachweise verlinkt statt Marketingbehauptungen |
| E17.5 | Als Maintainer will ich Dokumentationsdrift im PR erkennen, damit Doku Teil der Definition of Done bleibt. | PR-Feld „Docs impact"; Markdown-/Link-/Frontmatter-Prüfung; OpenAPI-/Contract-Drift-Gate; ADR-Index-Prüfung; Doku-Site-Build; Feature-Issues aktualisieren betroffene Doku statt spätere Sammel-Issues zu erzeugen |

E17 ist eine Querschnittspflicht. Die Dokumentationsänderung gehört grundsätzlich in dasselbe Feature-/Architektur-Issue; nur die einmalige Dokumentationsinfrastruktur oder eine eigenständige größere Überarbeitung erhält ein separates Issue.

---

## Teil 5 – Meilensteinplan

| Meilenstein | Name | Inhalt (Epics) | Definition of Done (prüfbar) |
|---|---|---|---|
| **v0.2-A** *(interner Exit, kein Release)* | Foundation-Gate | E1, E17.1 | Datenmigration bewiesen; beide Produktions-Stages bauen und starten in CI; Laufzeitmatrix fest; Prod-Fail-Fast und `/readyz` korrekt; Ollama-Fehler netzfrei getestet; kritischer Playwright-Smoke ist Pflicht-Gate, die übrige Browser-Suite läuft nightly mit dokumentierter Promotions-/Rückstufungsregel; externe Actions SHA-gepinnt; Dokumentenlandkarte und Source-of-Truth-Regeln angelegt; nur ADR-011–015 angenommen |
| **v0.2** | Erster echter Agent | E2, E3.1, E17.2–E17.3 inkrementell | `pms.draft@1.0.0` läuft UI→BFF→Runtime→Gateway mit Stub deterministisch in CI und Ollama in einem dokumentierten lokalen Release-Smoke; Run-Erstellung ist idempotent; übergroße Eingaben werden abgelehnt; Output schema-validiert; Kostenprovenienz korrekt; kein stiller Mock-Fallback; #44 geschlossen; beide Images in GHCR; aktiver Release Charter sowie Runtime-/API-Doku aktuell |
| **v0.3** | Signale & Gedächtnis (HITL) | E4, E5, E3.2–3.5, E12.1, E17 quer | #45–49 in diesem Milestone; Workflow-/Step-/Gate-Zustände getrennt und versiongepinnt; Commands inkl. Abbruch idempotent; Artefaktversionierung vor Chat (#49→#48); kein Fortschritt ohne Freigabe per Browser-E2E; Backup/Restore einmal geprobt; Workflow-/Gate-/Artefakt-Doku aktualisiert |
| **v0.4** | Identität & geschütztes Audit | E6, E7, E12.2, E17 quer | providerneutrales OIDC mit Human/Service-Trennung; prod verweigert DevAuth; Rollen werden technisch erzwungen; Audit ist redigiert und gegen App-UPDATE/DELETE geschützt, ohne DBA-Unveränderlichkeit zu behaupten; SSE-Run-Events; Threat Model, Auth-Fluss und Audit-Grenzen dokumentiert |
| **v0.5** | Cloud & Gateway-Guardrails | E8.1–E8.6, E17 quer | Azure-Adapter vollständig netzfrei getestet; reale Preisprovenienz; atomare Budgetreservierung und Rate-Limits aktiv schaltbar; Default-deny-Provider-Policy je effektiver Datenklasse; kein stiller Failover; unbekannte Preise fallen sicher zurück; kein neuer deploybarer Dienst ohne ADR |
| **v0.6** | Leitstand, Evals & Demo | E9, E10, E11, E12.3–E12.6, E17 quer | Leitstand beweist den Lese-Modulvertrag; deterministische Eval-Smokes plus kontrollierte Modell-/Injection-Vergleiche; Vorschlags-Inbox; vollständig synthetisches `make demo`; Release-/Betriebsverfahren geprobt; noch keine Behauptung, dass ein zweites Modul die Runtime wiederverwendet |
| **v0.7** | IDP & zweiter Runtime-Beweis | E13; E8.7 nur bei belegtem Bedarf; E17 quer | `idp.extract@1.0.0` läuft zunächst als dünner Slice und dann mit UI/HITL, ohne Core-Sonderlogik; Feld-Provenienz und F1-Messung; Lösch-/Aufbewahrungskonzept für Dokumente dokumentiert; damit ist die generische Runtime erstmals modulübergreifend belegt |
| **v0.8** | Knowledge & RAG | E14 | Antwort mit Quellen über pgvector; Schema-/Rollenisolation; Doku-Dogfooding; RAG-Metriken |
| **v0.9** | Flow | E15 | Canvas editiert Kern-Workflow-Definitionen; Fake-Konnektoren; Gates designbar; keine zweite Engine |
| **v1.0** | Plattform | E16, E17 vollständig | Doku-Site, Audit-Export, Upgrade-Pfad, Neues-Modul-Guide, vollständige Dokumentenlandkarte und Regulatorik-Anschlusskarte; sechs logische Plattformfähigkeiten real; mindestens drei Fachmodule erfüllen den Vertrag; öffentliche Demo bleibt optional und sicherheitsabhängig |

**Kritischer Pfad:** ADR-011–015 und Foundation-Fixes bilden gemeinsam v0.2-A → #44/erster Run → Workflow/Gates/Artefakte → Identity/Audit → Cloud-Guardrails → Leitstand/Evals → IDP als zweiter Runtime-Beweis. Erst danach sind RAG und Flow sinnvoll. Parallelisierbar sind Kosten-Summary/Doku nach v0.2 sowie Leitstand-UX, sobald stabile Lese-APIs existieren.

**Backlog-Regel:** Es werden höchstens der aktive Meilenstein und ein unmittelbar folgender Spike in atomare Issues geschnitten. Für v0.2 existiert genau ein Feature-Fokus (#44) plus seine nachweislich blockierenden Foundation-Issues. #45–49 werden in v0.3 verschoben; spätere Epics bleiben ausschließlich in diesem Dokument.

**Bewusst NICHT geplant** (Fernziele der Vision, unpriorisiert bis ≥2 Fachmodule laufen): Agent Marketplace, Voice/Computer-Use, echter MCP-Server, echte M365/SAP-Anbindung, Mobile, Kubernetes, Multi-Tenant und horizontal skalierter Core. Die Single-Instance-Grenzen von In-Memory-Limits, Reconciler und SSE bleiben bis zu einem belegten Skalierungsbedarf ausdrücklich sichtbar.

**Bewusst zurückgestellt statt vorab als Issues angelegt:** Vier-Augen-/Quorum-Freigaben (benötigen Approval-Policy, Trennung von Rollen und eindeutige Principals), Gate-SLA/Reminder/Eskalation (benötigt Scheduler und Benachrichtigungskanal) sowie Last-/Performance-Tests (k6-Smoke frühestens bei stabilen Endpunkten, v1.0-Kandidat). Das Datenmodell soll diese Erweiterungen nicht verhindern; implementiert werden sie erst bei nachgewiesenem Bedarf.

---

## Teil 6 – Nicht-funktionale Anforderungen (quer, je Release geprüft)

1. **Nachvollziehbarkeit:** Jeder agentisch erzeugte Inhalt ist auf `definition_key@semver`, Prompt-Hash, Modellparameter, Gateway-Calls, Request und spätere Freigaben rückführbar (ADR-011/012/014/017/018). Das ermöglicht Erklärung und Vergleich, behauptet aber keine deterministische Wiederholung eines LLM-Ergebnisses. *Test ab v0.6: Eine prüfende Person rekonstruiert einen beliebigen Demo-Run ohne Entwicklerhilfe.*
2. **Determinismus in CI:** Kein Pflicht-Gate ruft Internet oder ein reales LLM auf (ADR-006). Provider-Tests verwenden MockTransport. Unit-, Contract-, Container-Smoke- und mindestens der kritische Playwright-End-to-End-Pfad sind blockierend; Live-Ollama-/Cloud-Evals bleiben getrennt, manuell oder budgetiert und nicht blockierend. Die vollständige Browser-Suite läuft nightly und vor jedem Release; die Teststrategie definiert das Promotionskriterium einzelner Fälle in `ci-ok` (z. B. fünf konsekutive grüne Läufe) und die Rückstufungsregel, falls der Pflicht-Smoke flaky wird.
3. **Sicherheit & Datenminimierung:** Secrets nie im Browser/Repo/Log/Audit; die BFF verwirft fremde Identitätsheader; prod fail-fast bei unsicheren Defaults; Run-Payloads folgen effektiver Klassifizierung, Redaction und Retention nach ADR-015; Provider-Policy ist default-deny; Trivy, CodeQL und ein begründet konfigurierter npm-Advisory-Check decken unterschiedliche Risiken ab.
4. **Degradation:** Jedes Modul startet und arbeitet sinnvoll ohne die anderen (Compose-Profil-Test je Release); Kern-Ausfall macht PMS nicht kaputt, nur agentenlos.
5. **Betreibbarkeit:** Ein-Befehl-Install bleibt heilig (`make up`); optionale Infrastruktur ist ein Profil, nie heimliche Pflicht; Datenbankmigrationen sowie Backup/Restore werden auf realistischen Fixtures geprobt.
6. **Portfolio-Tauglichkeit:** Jeder Meilenstein endet mit einer in höchstens fünf Minuten vorführbaren, dokumentierten Story; ab v0.6 standardisiert `make demo` diesen Ablauf. Simulation und echte Provider-Ausführung bleiben sichtbar unterscheidbar.
7. **Ehrliche Reifeaussagen:** Vor v0.4 heißt die Ereignishistorie nicht „Compliance-Audit"; Schutz durch eine App-DB-Rolle heißt nicht „DBA-manipulationssicher"; ein einziges PMS-Szenario heißt „Plattform-Slice", nicht „generische Runtime bewiesen".
8. **Agentische Sicherheit:** Modell-, Nutzer-, OCR- und Retrieval-Inhalte gelten als untrusted. Schema-Validierung begrenzt die Form, ist aber keine Autorisierung. Kein Modellinhalt löst ohne deklarierte, autorisierte und parametervalidierte Tool-Grenze eine externe Aktion aus; externe Schreibaktionen sind standardmäßig gate-pflichtig. UI-Ausgabe wird kontextgerecht escaped. *Test: deterministische Negativtests für Tool-/Egress-Sperren plus ergänzende Injection-Evalfälle.*
9. **Vertrags- und Dokumentationskonsistenz:** OpenAPI, generierte Contracts, Architekturentscheidungen und betroffene Handbücher werden im selben Change aktualisiert. PRs beantworten „Docs impact"; CI prüft Contract-Drift, Links, Frontmatter, ADR-Index und Doku-Build. Ein grüner Code-Test bei veralteter verbindlicher Dokumentation erfüllt die Definition of Done nicht.
10. **Explizite Skalierungsgrenze:** Bis v1.0 wird eine einzelne Core-Instanz angenommen. Jede In-Memory-, Streaming-, Reconciler- oder Locking-Grenze wird dokumentiert. Horizontale Skalierung erfordert einen belegten Bedarf, geteilte Koordination und ein eigenes ADR.

---

## Teil 7 – Risiken & Gegenmaßnahmen

| Risiko | Wirkung | Gegenmaßnahme |
|---|---|---|
| Scope-Explosion durch diesen Katalog | v0.2 verzögert sich | Nur aktiver Meilenstein + nächster Spike werden geschnitten; v0.2-A und #44 haben harte WIP-Grenze; spätere Stories bleiben Katalog |
| Generische Engine wird doch PM-spezifisch | Plattform-These bricht | Architekturtest und Reviewfrage „Braucht IDP dafür eine Core-Sonderregel?"; ehrlicher Beweis erst mit `idp.extract` in v0.7 |
| LLM-Output-Qualität lokal frustriert | Demo wirkt schwach | Schema-Validierung + klar erfasster Repair-Call; Demo-Stub ist sichtbar als `simulated` markiert; kein stiller Ersatz einer fehlgeschlagenen Real-Ausführung |
| OIDC-/Keycloak-Komplexität frisst v0.4 | Meilenstein kippt | Providerneutraler Vertrag zuerst; kurzer Delegations-Spike; Keycloak bleibt Demonstrator, nicht Architekturzwang; keine vorschnelle Token-Exchange-Festlegung |
| Ein-Personen-Projekt + KI-Agenten driften | Qualität sinkt unbemerkt | ADRs als Leitplanken; blockierende deterministische Tests sofort, Evals ab v0.6 als zusätzliches Regressionsnetz; keine Test-Skips in `ci-ok` |
| Run-Inputs/Outputs vervielfachen sensible Daten | Datenschutz- und Sicherheitsrisiko | ADR-015 bereits in v0.2; Metadaten und Inhalte trennen; Redaction/Retention; Artifact Store wird ab v0.3 einzige Output-Wahrheit |
| Budgetprüfung liest nur verzögerte Telemetrie | parallele Calls überschreiten Budget | atomare Reservierung + Ist-Verrechnung nach ADR-020; unbekannter Preis erzwingt sicheren Fallback |
| Audit-Schutz wird regulatorisch überverkauft | Glaubwürdigkeitsverlust im Finanzkontext | App-Rollen-Grenze explizit; Tamper-Evidence/WORM als spätere eigene Entscheidung; keine Compliance-Zusage im README |
| Prompt-Injection oder bösartiger Modellinhalt wird als Aktion interpretiert | Datenabfluss, unautorisierte Außenwirkung oder Systemschaden | ADR-025; bis v0.2 keine Tools; später Allowlist, Autorisierung, Least Privilege, Egress-Grenze und Gate-Default; deterministische Sperrtests statt Vertrauen in Prompts |
| Datenklasse oder Provider-Regel wird heruntergestuft/umgangen | vertrauliche Inhalte verlassen unzulässig die lokale Grenze | effektive Höchstklasse aus allen Quellen, `default deny`, Gateway-Enforcement und Routingprovenienz nach ADR-026; kein stiller Failover |
| Abbruch wird als sofortige Provider-Stornierung missverstanden | Restkosten oder späte Ergebnisse überraschen Nutzer | `cancel_requested`/`cancelled`, Best-effort-Grenze sichtbar, späte Ergebnisse können Status nicht reaktivieren, Kosten werden weiter erfasst |
| Contracts oder Dokumentation driften vom Code | dritte Personen und Agenten implementieren gegen falsche Wahrheit | ADR-027 und E17; OpenAPI-/Consumer-/Doku-Gates; Owner, Reviewdatum und Update-Trigger; superseded statt konkurrierender Dokumente |
| Supply-Chain-Abhängigkeit in CI wird kompromittiert | fremder Code läuft mit Repository-Rechten | externe Actions per Commit-SHA pinnen, Version kommentieren, Updates automatisieren und Berechtigungen minimieren |
| Portfolio-Zeitplan wird zum impliziten Liefervertrag | Scope- und Qualitätsverlust vor dem Bewerbungs-Cut | Must/Should/Stretch statt Scheingenauigkeit; Release Charter nur für aktiven Meilenstein; Roadmap nach jedem Release neu bewerten |
| Öffentliche Demo erzeugt Abuse, Kosten oder Datenrisiken | finanzieller Schaden und falscher Sicherheitseindruck | optional; erst nach Identity/Guardrails; synthetische Daten, read-only Principal, harte Limits, Threat Model und Kill-Switch |
| DSGVO/Datenschutz bei echten Dokumenten (IDP/RAG) | rechtliches Risiko | nur synthetische/anonymisierte Demo-Daten im Repo; effektive Datenklassifizierung, Redaction und dokumentierter Lösch-/Aufbewahrungspfad; Hashes/IDs nicht pauschal als anonym behandeln; konkrete Rechts-/Betreiberprüfung vor Echtdaten |

---

## Teil 8 – Dokumentationsarchitektur und Governance

### 8.1 Ablageprinzip: Docs-as-Code im Repository

Alle verbindlichen Produkt-, Architektur-, Schnittstellen-, Test-, Security- und Betriebsinformationen leben versioniert im Repository und werden gemeinsam mit dem betroffenen Code geändert. Externe Systeme wie Notion, Confluence, SharePoint oder persönliche Notizen dürfen für Entwürfe, Diskussionen und Präsentationen verwendet werden, sind aber **keine zweite technische Wahrheit**. Sobald eine externe Entscheidung verbindlich wird, wird sie in das zuständige Repo-Dokument oder einen ADR/Product Decision Record überführt und von außen nur noch verlinkt.

Generierte Nachweise wie Testreports, Coverage, Scanergebnisse oder Eval-Rohdaten müssen nicht dauerhaft ins Git geschrieben werden. Ihre Regeln und Interpretation stehen im Repo; die konkreten Ergebnisse werden als versionierte CI-/Release-Artefakte mit Commit-SHA aufbewahrt und von der Dokumentation aus referenziert.

### 8.2 Zielstruktur

Die endgültigen Pfade werden beim E17.1-Schnitt gegen die vorhandene Struktur geprüft; bestehende kanonische Dateien werden weiterverwendet statt dupliziert. (Der v0.2-A-Stand nutzt bereits `docs/README.md`, `docs/platform/documentation-policy.md`, `docs/platform/adrs/` und `docs/templates/`; die Angleichung an das Zielbild erfolgt inkrementell über E17, nicht als Big-Bang-Umbau.) Zielbild:

```text
docs/
├── README.md                         # Einstieg und Dokumentenlandkarte
├── platform/                         # bestehender Produkt-/Plattformbereich
│   ├── vision.md                     # langfristiges Warum und Zielbild
│   ├── product-brief.md              # Problem, Zielgruppen, Nutzenversprechen
│   ├── stakeholders-and-personas.md  # Rollen, Bedürfnisse, Abgrenzungen
│   ├── goals-and-non-goals.md        # strategische Ziele und Grenzen
│   ├── outcomes.md                   # messbare Wirkung/Nachweise
│   ├── roadmap.md                    # dieser Masterplan nach Annahme
│   ├── risk-register.md              # Management-/Produkt-/Delivery-Risiken
│   ├── release-charters/             # genau der aktive Meilenstein detailliert
│   └── decisions/                    # nichttechnische Product Decision Records
├── architecture/
│   ├── overview.md                   # arc42-lite: Kontext, Bausteine, Qualitätsziele
│   ├── runtime-and-dataflows.md      # Run, HITL, Budget, Provider-Policy
│   ├── deployment.md                 # Laufzeit-/Netz-/Trust-Grenzen
│   ├── data-model.md                 # Ownership, Schemas, Retention, Migration
│   └── adr/                          # technische Entscheidungen + Index
├── services/
│   ├── core-overview.md              # Deployment und gemeinsame Grenzen
│   ├── identity.md                   # je logischer Kernfähigkeit ein Handbuch
│   ├── model-gateway.md
│   ├── telemetry-costs.md
│   ├── event-audit.md
│   ├── agent-runtime.md
│   ├── eval-harness.md
│   ├── pms.md                        # je realem Fachmodul ein Handbuch
│   ├── leitstand.md
│   ├── idp.md
│   ├── rag.md
│   └── flow.md                       # erst anlegen, wenn ein realer Schnitt existiert
├── api/
│   ├── README.md                     # Auth, Versionierung, Fehler, Beispiele
│   └── compatibility.md              # ADR-027 als ausführbare Policy
├── operations/
│   ├── production-handbook.md        # Betriebsmodell und Verantwortlichkeiten
│   ├── deployment.md
│   ├── configuration.md
│   ├── backup-restore.md
│   ├── disaster-recovery.md
│   ├── incident-response.md
│   └── runbooks/                     # konkrete Alarm-/Fehlerbehebung
├── testing/
│   ├── strategy.md                   # Testpyramide, Gates, Netz-/LLM-Regeln
│   ├── test-matrix.md                # Modul × Testart × CI-Job × Verantwortlicher
│   └── acceptance/                   # releasebezogene Abnahmeszenarien
├── security/
│   ├── threat-model.md
│   ├── data-classification.md
│   ├── privacy-retention-deletion.md
│   ├── authentication-authorization.md
│   ├── agent-and-tool-safety.md
│   └── secrets-and-supply-chain.md
├── governance/
│   ├── documentation-policy.md       # Metadaten, Owner, Reviews, Update-Trigger
│   ├── traceability.md               # Ziel→Epic→Issue→ADR→Test→Release
│   └── regulatory-map.md             # Prinzip→Feature, ohne Compliance-Claim
└── releases/
    └── vX.Y.Z.md                     # ausgelieferter Stand, Migration, bekannte Grenzen
```

OpenAPI bleibt an genau **einem** bestehenden kanonischen Pfad die maschinenlesbare Schnittstellenwahrheit; `docs/api/` erklärt Nutzung und verlinkt sie, kopiert aber keine Schemata. Datenbankschema und Migrationen bleiben im Code die technische Wahrheit; `data-model.md` erklärt Ownership, Lebenszyklen und Grenzen.

Service-Handbücher für künftige Module werden erst mit ihrem ersten realen Implementierungsschnitt angelegt. Bis dahin existiert ihre Planung ausschließlich in Roadmap und Release Charter; leere Platzhalterdokumente sind ausdrücklich unerwünscht.

Jedes Service-Handbuch folgt derselben knappen Schablone: Zweck/Nicht-Zweck, Owner, Konsumenten, angebotene APIs/Ereignisse, Daten- und Migrations-Ownership, Abhängigkeiten, Auth/Rollen, Konfiguration, Health/Readiness, Fehler-/Degradationsverhalten, Observability, Betriebs-/Recovery-Verweise, relevante ADRs sowie zugehörige Contract-, Integrations- und E2E-Tests. Ein logischer Dienst erhält dadurch ein Handbuch, ohne fälschlich als eigener Microservice dargestellt zu werden.

### 8.3 Source-of-Truth-Matrix

| Information | Kanonische Wahrheit | Nicht als zweite Wahrheit verwenden |
|---|---|---|
| Mission und langfristiges Zielbild | `docs/platform/vision.md` | README, Masterplan-Kopien, Präsentationen |
| Ziele, Nicht-Ziele und Outcome-Maße | `goals-and-non-goals.md`, `outcomes.md` | unstrukturierte Issue-Listen |
| Reihenfolge und Meilensteine | `docs/platform/roadmap.md` | GitHub-Milestone-Beschreibung als alleiniger Plan |
| Aktiver Release-Scope | aktiver Release Charter + verlinkter GitHub-Milestone | gesamte Zukunft als fertiger Issue-Backlog |
| Atomare Arbeit und aktueller Status | GitHub-Issues/PRs | Roadmap-Checkboxen |
| Technische Entscheidung und Begründung | ADR | Codekommentar oder Chatverlauf |
| Nichttechnische Produktentscheidung | Product Decision Record | ADR oder Meetingnotiz |
| Implementiertes API-Verhalten | OpenAPI + Contract-Tests | handgeschriebene Payload-Kopien in Handbüchern |
| Implementiertes Datenbankschema | Migrationen/Schema + DB-Tests | Diagramm ohne Versionsbezug |
| Service-Verantwortung und Nutzung | Service-Handbuch | Komponentenbild allein |
| Betriebsverfahren | Production Handbook + spezifisches Runbook | README-Schnipsel oder persönlicher Ablauf |
| Testregeln und Gate-Zuordnung | Teststrategie/-matrix | einzelne CI-YAML als Erklärung |
| Konkreter Test-/Scan-Nachweis | CI-/Release-Artefakt mit Commit-SHA | eingecheckte, schnell veraltende Reports |
| Security-/Datenschutzannahmen | Threat Model und Security-Dokumente | Marketingformulierungen |
| Ausgelieferter Stand | Git-Tag, Release Notes und Changelog | aktueller Roadmap-Text |

Bei einem Widerspruch wird die Abweichung als Dokumentations- oder Implementierungsdefekt behandelt. Historische Dokumente werden nicht still umgeschrieben: Sie erhalten `status: superseded` (bzw. `frozen`) und einen Verweis auf den Nachfolger.

### 8.4 Metadaten, Status und Verantwortlichkeit

Jedes verbindliche Markdown-Dokument erhält ein schlankes Frontmatter. Die operative Pflichtform steht in [documentation-policy.md](documentation-policy.md) (`module`, `type`, `status`, `updated`); die folgenden Governance-Felder sind optionale Erweiterungen desselben Schemas:

```yaml
---
module: platform
type: roadmap
status: proposed | current | superseded | frozen
updated: YYYY-MM-DD
owner: maintainer | architecture | product | operations | security
last_reviewed: YYYY-MM-DD
review_cycle: per-release | quarterly | event-driven
source_of_truth_for: kurze eindeutige Beschreibung
related_adrs: []
related_services: []
update_triggers: []
superseded_by: null
---
```

ADRs behalten zusätzlich ihre fachspezifischen Zustände `proposed`, `accepted`, `rejected` oder `superseded`. Ein Release Charter wird nach Release nicht gelöscht, sondern mit Ist-Ergebnis und `superseded`/`frozen` geschlossen. In einem Ein-Personen-Projekt kann dieselbe Person mehrere Owner-Rollen innehaben; entscheidend sind die sichtbare Verantwortlichkeit und der Aktualisierungsauslöser.

### 8.5 Aktualisierungsauslöser

| Änderung | Pflichtaktualisierung im selben Change |
|---|---|
| API-/Contract-Änderung | OpenAPI, generierte Contracts, Contract-Tests, API-Guide/Beispiele, betroffene Service-Doku |
| neue/verschobene Architekturgrenze | ADR, Architekturübersicht, Laufzeitfluss, Service-Ownership |
| Datenmodell/Migration/Retention | Migration + DB-Test, `data-model.md`, Upgrade-/Backup-/Löschhinweise |
| Auth-, Rollen- oder Trust-Grenze | Threat Model, Auth-Doku, Service/API-Doku, relevante Runbooks und Negativtests |
| Provider-, Datenklassen- oder Tool-Verhalten | Provider-/Security-Doku, Policy-Version, Threat Model, Testmatrix, Telemetrie-/Audit-Erklärung |
| Deployment-/Konfigurationsänderung | Production Handbook, Konfigurationsreferenz, Deployment-/Rollback-Runbook |
| neues Feature oder Modul | aktiver Release Charter, Service-Handbuch, Akzeptanzszenario, Demo-/User-Doku, Release Notes |
| geänderte Test-/CI-Strategie | Teststrategie, Testmatrix, Branch-Protection-/Gate-Erklärung |
| angenommener oder supersedierter ADR | ADR-Index und alle direkt betroffenen Übersichts-/Service-Dokumente |
| Release | Charter mit Ist schließen, Outcome-Nachweis, Roadmap/Risiken prüfen, Release Notes/Changelog, Upgrade-Hinweise |

### 8.6 Release Charter und Managementdokumente

Der Release Charter ist das zentrale Managementdokument für genau den aktiven Meilenstein. Er enthält: Ziel/Problem, erwartetes Outcome, In-/Out-of-Scope, Abhängigkeiten, Risiken, Kapazitätsannahme, Entscheidungspunkte, messbare Definition of Done, Demo-Narrativ, Dokumentationsfolgen und Abbruch-/Verschiebekriterien. Eine Schätzung nennt Annahme, Konfidenz und Reviewdatum; sie ist kein versteckter Liefervertrag.

Das Risk Register enthält mindestens Risiko, Ursache, Auswirkung, Wahrscheinlichkeit, Schwere, Gegenmaßnahme, Owner, Frühindikator und Reviewdatum. `outcomes.md` bewertet Wirkung und Nachweise – nicht nur geschlossene Issues oder erzeugte Codezeilen. Technische Entscheidungen gehören in ADRs; Ziele, Prioritäten und Scope-Entscheidungen in Product Decision Records.

### 8.7 Dokumentations-Definition-of-Done

Ein Feature, ADR oder Release ist dokumentarisch abgeschlossen, wenn:

- das PR-Feld `Docs impact` beantwortet und alle betroffenen kanonischen Dokumente aktualisiert oder begründet als „kein Einfluss" markiert sind;
- neue Aussagen auf implementiertes Verhalten, Tests oder ausdrücklich markierte Zielbilder zurückführbar sind;
- keine konkurrierenden aktiven Dokumente dieselbe Wahrheit beanspruchen;
- Frontmatter, Links, ADR-Index, OpenAPI-/Contract-Drift und Doku-Build grün sind;
- sicherheits-, betriebs- oder migrationsrelevante Änderungen ein ausführbares Runbook bzw. Negativ-/Recovery-Szenario besitzen;
- der Release Charter mit tatsächlichem Ergebnis, bekannten Grenzen und Outcome-Nachweis geschlossen wurde.

Der empfohlene Einstieg für eine dritte Person ist: Root-README → `docs/README.md` → Product Brief/Ziele/Roadmap → Architekturübersicht/ADRs → zuständiges Service-/API-Handbuch → Test-/Security-/Betriebsdokumente. Dieses Navigationsziel wird je Release durch einen kurzen „Kann eine neue Person das System und seine Grenzen ohne Chatwissen erklären?"-Review geprüft.

---

## Teil 9 – Unmittelbare nächste Schritte (Übergabe)

1. **Board/Backlog abgleichen:** Milestone „PM Studio – v0.2 (Agent-Backend)" in „Stellwerk v0.2 – Erster echter Agent" umbenennen; nur #44 dort belassen. #45–49 ohne Duplikate in „Stellwerk v0.3 – Signale & Gedächtnis" verschieben. Bestehende Repo-Taxonomie (`module:* type:* prio:* size:*`) verwenden. *(erledigt: Milestones #3/#4, Issues #44–49 zugeordnet, Foundation-/E3.1-Issues #53–60 angelegt.)*
2. **Fünf v0.2-Entscheidungen klären:** ADR-011–015 in Abhängigkeitsreihenfolge schreiben und reviewen (#53). Kein Acht-ADR-Sammel-PR; höchstens eng gekoppelte Entscheidungen gemeinsam. Alle übrigen Kandidaten bleiben ausschließlich in diesem RFC.
3. **Maximal sechs Foundation-Issues schneiden:** (a) lokale Datenmigration #54, (b) Container-Build/Start + Laufzeitmatrix samt expliziter Dependabot-Entscheidungen (#22/#40/#41/#42 schließen oder ersetzen, #25/#39 nach Rebase entscheiden) #55, (c) Prod-Fail-Fast #56, (d) `/readyz`-Migrationsstand #57, (e) hermetischer Ollama-Provider #58, (f) Root-/Dokumentenlandkarte + CONTRIBUTING + Actions-SHA-Pins + kritischer Playwright-Pflicht-Smoke #59. Abhängigkeiten explizit setzen und v0.2-A vollständig schließen; E17 wird nicht in zahlreiche Doku-Einzelissues zerlegt (Doku-Infrastruktur in #61–64).
4. **#44 zum dünnen vertikalen Slice umschreiben:** modulverantwortetes Manifest `pms.draft@1.0.0`, Eingabe-/Tokenlimits ohne stilles Kürzen, idempotente Run-Erstellung, BFF→Runtime→Gateway, schema-validierter untrusted Output ohne Tools/Außenwirkung, klassifizierter und löschbarer Payload, verlinkte Calls/Kosten, ehrliche Fehlerzustände und Reconciler. Keine Gates, Workflows, Artefakt-Chats, OIDC oder Cloud in #44.
5. **v0.2 veröffentlichen und erst danach v0.3 schneiden:** aktiven Release Charter mit Ist-Ergebnis schließen; #47/Workflow-Basis und #49/Artefakte zuerst, anschließend #45/Gates, #46/Panel und zuletzt #48/Chat-Iteration. Erkenntnisse aus v0.2 dürfen die vorgeschlagenen ADR-016/017 verändern. Cancel sowie typisierter Business-Kontext werden im v0.3-Schnitt bewertet, nicht nachträglich in #44 gedrückt.
6. **Dokumentstatus schützen:** Bis ADR-011–015 und der v0.2-Schnitt angenommen sind, bleibt dieses Dokument `proposed`. Danach auf `status: current` heben; die eingefrorene build-spec bleibt historische Baseline statt still überschrieben zu werden. Vor jeder Strukturänderung bestehende Repo-Pfade prüfen, damit keine zweite Roadmap entsteht.
7. **Spätere Kandidaten nicht vorsorglich materialisieren:** ADR-016–027, E8+, Vier-Augen-Prinzip, Gate-Eskalation, Performance und öffentliche Demo bleiben Roadmap-/Backlog-Kandidaten, bis ihr Meilenstein aktiv wird. Provider-Policy, Agent-Sicherheit und Dokumentationsregeln dürfen als NFR berücksichtigt werden, ohne einen Sammel-ADR-PR oder Zukunfts-Issue-Teppich zu erzeugen.

---

*Quelle: konsolidierter Stellwerk-OS-Masterplan (RFC, Revision 2026-07-20), transkribiert und in Docs-as-Code überführt. Der Umsetzungsstand wird über GitHub Issues, ADRs und die `current`-Architekturdokumentation geführt, nicht über dieses Zielbild.*
