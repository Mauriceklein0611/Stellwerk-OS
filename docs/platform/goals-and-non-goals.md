---
module: platform
type: reference
status: current
updated: 2026-07-21
owner: Maurice
source_of_truth_for: strategische Ziele, Nicht-Ziele und Reifegrenze bis v1.0
related_issues: [62]
---

# Ziele, Nicht-Ziele und Reifegrenze

Ableitung aus [roadmap.md §Teil 0](roadmap.md). Messbare Wirkung: [outcomes.md](outcomes.md).

## Ziele bis v1.0

- ein schlanker modularer Kern mit sechs logischen Plattformfähigkeiten,
- mindestens **drei** vertragskonforme Fachmodule,
- ein nachvollziehbarer Agent-/Workflow-Lebenszyklus,
- belastbare Kostenprovenienz,
- kontrollierte Cloud-Nutzung (Provider-Policy, Budgets),
- dokumentierter Betrieb (Backup/Restore, Runbooks, Upgrade-Pfad),
- eine reproduzierbare, vollständig synthetische Demo.

## Nicht-Ziele / bewusst nicht geplant

Unpriorisiert, bis ≥2 Fachmodule laufen: Agent Marketplace, Voice/Computer-Use,
echter MCP-Server, echte M365-/SAP-Anbindung, Mobile, Kubernetes, Multi-Tenant und
**horizontal skalierter Core**. Bis v1.0 gilt eine **Single-Instance-Annahme**; jede
In-Memory-, Streaming-, Reconciler- oder Locking-Grenze bleibt sichtbar dokumentiert.

**Bewusst zurückgestellt** (nicht vorab als Issues): Vier-Augen-/Quorum-Freigaben,
Gate-SLA/Reminder/Eskalation, Last-/Performance-Tests. Das Datenmodell soll sie nicht
verhindern; umgesetzt werden sie erst bei belegtem Bedarf.

## Reifegrenze (verbindliche Sprachregel)

Stellwerk-OS ist vor gesonderter Härtung, Rechtsprüfung, Skalierungsvalidierung und
Betreiberfreigabe **kein produktionsfreigegebenes Bankensystem**. Sprachregeln:

- Vor v0.4 heißt die Ereignishistorie **nicht** „Compliance-Audit".
- Schutz durch eine App-DB-Rolle heißt **nicht** „DBA-manipulationssicher".
- Ein einziges PMS-Szenario heißt **„Plattform-Slice"**, nicht „generische Runtime
  bewiesen" (der Beweis folgt mit `idp.extract`, v0.7).
- „auditierbar/append-only/DSGVO-fähig/EU-AI-Act-ready" nur mit der im Meilenstein
  tatsächlich bewiesenen Reichweite. Anschlussfähigkeit an regulatorische Prinzipien
  ist **keine** Konformitätszusage.

## Portfolio-Cut (Herbst 2026)

- **Must:** v0.2 und v0.3 vollständig und poliert.
- **Should:** v0.4 (providerneutrale Identity, RBAC, ehrlich begrenzter Audit-Schutz).
- **Stretch:** v0.5 (Cloud-Adapter, Provider-Policy, atomare Budgets).
- **Nordstern:** v0.6–v1.0 nur beginnen, wenn der Vor-Meilenstein abgeschlossen,
  dokumentiert und vorführbar ist.

Zeitangaben entstehen erst im jeweiligen Release Charter mit Annahme, Konfidenz und
Reviewdatum – kein versteckter Liefervertrag.
