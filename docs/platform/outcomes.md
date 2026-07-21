---
module: platform
type: reference
status: current
updated: 2026-07-21
owner: Maurice
source_of_truth_for: messbare Produktziele und Erfolgsnachweise (Outcomes, nicht Output)
related_issues: [62]
review_cycle: per-release
---

# Produktziele und Erfolgsnachweise (Outcomes)

Bewertet **Wirkung und Nachweis** – nicht geschlossene Issues oder Codezeilen. Herkunft:
[roadmap.md §0.2](roadmap.md). Status je Ziel: `offen` / `in Arbeit` / `belegt`.

| # | Ziel | Nutzer-/Plattformnutzen | Messbarer Nachweis | Zielrelease | Status |
|---|---|---|---|---|---|
| O1 | Echter End-to-End-Agent statt Mock-Insel | PO bekommt echte Hilfe statt Attrappe | `pms.draft@1.0.0` läuft UI→BFF→Runtime→Gateway, persistiert Zustände, liefert schema-validierten Output; Stub deterministisch in CI, Ollama im lokalen Release-Smoke | v0.2 | offen |
| O2 | Vollständige technische Nachvollziehbarkeit von Runs | Prüfende Person kann einen Run rekonstruieren | Run ist auf `definition_key@semver`, Prompt-Hash, Modellparameter, verlinkte Gateway-Calls, `request_id`, `service`/`user_context` rückführbar; `run.completed\|failed` als `run_event` | v0.2 (Historie); v0.4 gehärtetes Audit | offen |
| O3 | Nachvollziehbare Kostenprovenienz | Cloud-, lokale und Demo-Kosten nicht verwechseln | `pricing_status ∈ {real,simulated,unknown}`, `currency`, `price_version` in DB+API; unbekannt = NULL, nie 0; Run aggregiert ohne zweite Wahrheit | v0.2 (E3.1) | offen |
| O4 | Beweisbare menschliche Kontrolle (HITL) | Reviewer behält Kontrolle über agentische Abläufe | Workflow schreitet ohne erfülltes `review_gate` nicht fort; konkurrierende Commands idempotent/konfliktsicher (409); Browser-E2E-Beweis | v0.3 | offen |
| O5 | Lokale und Cloud-Provider hinter demselben Vertrag | Wechsel lokal↔Cloud ohne Codeänderung | Provider hinter Registry; Azure-Adapter netzfrei getestet; Default-deny-Provider-Policy je effektiver Datenklasse; kein stiller Failover | v0.5 | offen |
| O6 | Modulübergreifende Wiederverwendung der Runtime | Plattformthese statt PMS-Sonderfall | `idp.extract@1.0.0` nutzt dieselbe Runtime **ohne Core-Sonderlogik**; Architekturtest belegt die Grenze | v0.7 | offen |
| O7 | Reproduzierbare Portfolio-Demo | Dritte erleben das System in ≤ 2 Min. | `make demo` seedet vollständig synthetisch (sichtbar `simulated`); erzählbare Tour; gemeinsame Fixtures für E2E | v0.6 | offen |
| O8 | Betrieb & Weiterentwicklung für Dritte nachvollziehbar | Neue Person versteht System und Grenzen ohne Chatwissen | versionierte Architektur-, Service-, API-, Test-, Security- und Betriebsdoku mit Ownern und Update-Triggern; „Kann eine dritte Person es erklären?"-Review je Release | inkrementell ab v0.2; vollständig v1.0 | in Arbeit |

> Keine erfundenen ROI-/Umsatz-/Nutzer-/Zeitwerte: Es existiert keine Datenbasis dafür.
> Erfolg wird ausschließlich an den obigen, technisch überprüfbaren Nachweisen gemessen.
