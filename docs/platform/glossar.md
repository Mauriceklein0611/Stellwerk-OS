---
module: platform
type: reference
status: current
updated: 2026-07-07
---

# Glossar – Stellwerk-Begriffswelt

Stellwerk übernimmt Begriffe aus der Bahn-Leittechnik als konsistente Metaphern
für Plattform-Konzepte. Diese Tabelle ist verbindlich für Benennung in Code,
Doku und UI.

| Begriff | Bahn-Bedeutung | Stellwerk-Bedeutung |
|---|---|---|
| **Stellwerk** | Anlage, die Weichen und Signale zentral stellt | Die Gesamtplattform (Kern + Module) |
| **Signal** | Erlaubt/verweigert die Weiterfahrt | **Human-in-the-Loop-Gate**: Freigabepunkt, an dem ein Agent nicht ohne menschliche Zustimmung weiterläuft |
| **Weiche** | Lenkt den Zug auf ein Gleis | **Routing-Entscheidung**: Auswahl von Modell, Provider oder Pfad (z. B. im Model Gateway) |
| **Fahrstraße** | Reservierter, gesicherter Fahrweg | **Workflow**: definierte, mehrschrittige Agenten-/Prozesskette (`WorkflowDefinition`/`WorkflowRun`) |
| **Leitstand** | Zentraler Überwachungsraum | **Governance- & Analytics-Dashboard** (Fachmodul) über Kern-Telemetrie: Modelle, Kosten, Qualität, Audit |
| **Fahrplan** | Zeitliche Ablaufplanung | Geplante/orchestrierte Abläufe (Scheduling, Roadmap-Kontext) |

## Weitere Kernbegriffe

- **Kern** (`services/core`): FastAPI-Backend mit sechs geteilten Diensten
  (Identity, Model Gateway, Telemetrie, Audit, Evaluation, Agent Runtime).
- **Modul**: gleichrangige Fachanwendung, die den [Modul-Vertrag](vision.md)
  erfüllt (kein eigenes Login, LLM-Calls nur über Gateway, Audit-Pflicht,
  einzeln startbar).
- **Model Gateway**: einzige Schnittstelle für alle LLM-/Embedding-Aufrufe;
  Quelle aller Telemetrie.
- **Vorschlags-Inbox**: Agenten schreiben nie direkt in Bestandsdaten, sondern
  erzeugen Vorschläge, die ein Mensch annimmt/ablehnt (Provenienz-Prinzip).
- **Provenienz**: Herkunftskennzeichnung von Inhalten (`agent` / `human` /
  `human_edited`) im Audit-Log.
