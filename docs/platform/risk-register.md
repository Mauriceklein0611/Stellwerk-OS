---
module: platform
type: risk-register
status: current
updated: 2026-07-21
owner: Maurice
source_of_truth_for: lebendes Management-/Produkt-/Delivery-Risikoregister
related_issues: [62]
review_cycle: per-release
---

# Risikoregister (lebend)

Herkunft: [roadmap.md §Teil 7](roadmap.md). Wahrscheinlichkeit/Schwere: niedrig/mittel/hoch.
Wird je Release überprüft (`review_cycle: per-release`). Owner ist im Ein-Personen-Projekt
durchgängig der Maintainer; die Spalte benennt die verantwortliche Funktion.

| ID | Risiko | W'keit | Wirkung | Gegenmaßnahme | Trigger / Frühindikator | Owner | Status | Zuletzt geprüft |
|---|---|---|---|---|---|---|---|---|
| R1 | Scope-Explosion durch den Katalog | hoch | v0.2 verzögert | nur aktiver Meilenstein + nächster Spike geschnitten; harte WIP-Grenze für v0.2-A/#44 | offene Issues wachsen über den aktiven Meilenstein hinaus | Produkt | offen | 2026-07-21 |
| R2 | Generische Engine wird doch PM-spezifisch | mittel | Plattform-These bricht | Architekturtest + Reviewfrage „Braucht IDP eine Core-Sonderregel?"; Beweis erst mit `idp.extract` (v0.7) | Core-Migration/Code mit PM-Semantik | Architektur | offen | 2026-07-21 |
| R3 | Lokale LLM-Ausgabe frustriert | mittel | Demo wirkt schwach | Schema-Validierung + erfasster Repair-Call; Stub sichtbar `simulated`; kein stiller Ersatz | wiederholt invalider Draft-Output | Produkt | offen | 2026-07-21 |
| R4 | OIDC-/Keycloak-Komplexität frisst v0.4 | mittel | Meilenstein kippt | providerneutraler Vertrag zuerst; kurzer Delegations-Spike; Keycloak nur Demonstrator | Spike überzieht, Token-Fluss unklar | Architektur | offen | 2026-07-21 |
| R5 | Ein-Personen-Projekt + KI-Agenten driften | hoch | Qualität sinkt unbemerkt | ADRs als Leitplanken; blockierende deterministische Tests sofort; Evals ab v0.6; keine Skips in `ci-ok` | widersprüchliche Änderungen, rote Gates umgangen | Architektur | laufend | 2026-07-21 |
| R6 | Run-Payloads vervielfachen sensible Daten | hoch | Datenschutz-/Sicherheitsrisiko | ADR-015: Metadaten/Inhalte trennen, Redaction, Retention; Artifact Store ab v0.3 einzige Output-Wahrheit | Payload mit PII/Secret; fehlende Klassifizierung | Security | offen | 2026-07-21 |
| R7 | Budgetprüfung liest nur verzögerte Telemetrie | mittel | parallele Calls überschreiten Budget | atomare Reservierung + Ist-Verrechnung (ADR-020); unbekannter Preis → Tokenlimit | Budget-Check gegen Snapshot statt Reservierung | Architektur | offen (v0.5) | 2026-07-21 |
| R8 | Audit-Schutz regulatorisch überverkauft | mittel | Glaubwürdigkeitsverlust | App-Rollen-Grenze explizit; Tamper-Evidence/WORM als spätere Entscheidung; keine Compliance-Zusage | „revisionssicher/compliant"-Formulierungen | Security | offen | 2026-07-21 |
| R9 | Prompt-Injection/bösartiger Modellinhalt als Aktion interpretiert | hoch | Datenabfluss, unautorisierte Außenwirkung | ADR-025: bis v0.2 keine Tools; später Allowlist/Autorisierung/Least-Privilege/Egress/Gate-Default; deterministische Sperrtests | Modellinhalt erzeugt URL/SQL/Command | Security | offen | 2026-07-21 |
| R10 | Datenklasse/Provider-Regel umgangen | hoch | vertrauliche Inhalte verlassen die lokale Grenze | ADR-026: effektive Höchstklasse, default-deny, Gateway-Enforcement, Routingprovenienz; kein stiller Failover | Modul senkt Klasse; Cloud ohne Freigabe | Security | offen (v0.5) | 2026-07-21 |
| R11 | Abbruch als sofortige Provider-Stornierung missverstanden | niedrig | Restkosten/späte Ergebnisse überraschen | `cancel_requested`/`cancelled`, Best-effort sichtbar, späte Ergebnisse reaktivieren nicht, Kosten weiter erfasst (ADR-012) | Nutzer erwartet Kostenstopp bei Cancel | Produkt | offen | 2026-07-21 |
| R12 | Contracts/Doku driften vom Code | hoch | Dritte implementieren gegen falsche Wahrheit | ADR-027 + E17; OpenAPI-/Consumer-/Doku-Gates; Owner/Reviewdatum/Update-Trigger; superseded statt Konkurrenz | veraltete Doku bei grünem Code-Test | Architektur | laufend | 2026-07-21 |
| R13 | Supply-Chain-Abhängigkeit in CI kompromittiert | mittel | fremder Code mit Repo-Rechten | externe Actions per Commit-SHA pinnen, Version kommentieren, Updates automatisieren, Rechte minimieren | ungepinnte Action-Referenz | Ops | offen (#59) | 2026-07-21 |
| R14 | Portfolio-Zeitplan wird impliziter Liefervertrag | mittel | Scope-/Qualitätsverlust vor Bewerbungs-Cut | Must/Should/Stretch; Release Charter nur für aktiven Meilenstein; Roadmap nach jedem Release neu bewerten | Wochen-Termine ohne Annahmen/Konfidenz | Produkt | laufend | 2026-07-21 |
| R15 | Öffentliche Demo erzeugt Abuse/Kosten/Datenrisiken | mittel | finanzieller Schaden, falscher Sicherheitseindruck | optional; erst nach Identity/Guardrails; synthetische Daten, read-only Principal, harte Limits, Threat Model, Kill-Switch | Wunsch nach öffentlicher Demo vor v0.4 | Ops | zurückgestellt | 2026-07-21 |
| R16 | DSGVO/Datenschutz bei echten Dokumenten (IDP/RAG) | hoch | rechtliches Risiko | nur synthetische/anonymisierte Demo-Daten; effektive Klassifizierung, Redaction, Lösch-/Aufbewahrungspfad; Hashes/IDs nicht pauschal anonym; Rechts-/Betreiberprüfung vor Echtdaten | Echtdaten in IDP/RAG geplant | Security | offen (v0.7+) | 2026-07-21 |
