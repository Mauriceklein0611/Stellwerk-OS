---
module: platform
type: adr
status: accepted
updated: 2026-07-21
owner: Maurice
related_issues: [53, 44]
related_adrs: [ADR-012, ADR-015]
supersedes: docs/pm-studio/backend-plan.md
superseded_by: null
---

# ADR-011 · Runtime- und Definitions-Ownership

- **Status:** accepted
- **Datum:** 2026-07-21
- **Betrifft:** Agent Runtime (`services/core`), Fachmodule (`apps/*`), Definitions-Registry

## Kontext

Für den ersten echten Agenten (#44) muss geklärt sein, **wer** Ausführung, Zustand
und Fachsemantik besitzt. Es gibt drei widersprüchliche Vorlagen im Repo/Backlog:

- #45/#47 planten Agent-Zustand im PMS-Frontend-Store (`apps/pm-studio/src/store`).
- [docs/pm-studio/backend-plan.md](../../pm-studio/backend-plan.md) beschreibt ein
  **separates** PMS-FastAPI/SQLite-Backend mit `POST /api/agents/draft/run`.
- Die [vision.md](../vision.md) legt Ausführung und Run-Wahrheit in den Kern.

Ohne Entscheidung entstünden entweder eine Schattenplattform je Modul oder
PM-Fachsemantik im Kern — beides bricht den Modul-Vertrag.

## Betrachtete Optionen

1. **Separates PMS-Backend (SQLite/FastAPI):** schnell, aber zweite Plattform,
   doppelte Telemetrie/Identity, LLM-Zugriff am Gateway vorbei (verletzt ADR-006).
2. **Run-Wahrheit im Frontend-Store/localStorage:** kein Serveraufwand, aber keine
   Nachvollziehbarkeit, kein serverseitiger Idempotenz-/Kostennachweis.
3. **Generische Runtime im Kern + modulverantwortetes Manifest (gewählt):** Kern
   besitzt Ausführung/Persistenz, Modul besitzt die Definition.

## Entscheidung

Der **Kern besitzt generische Ausführung und Persistenz**. Ein Modul besitzt ein
**versioniertes Manifest** mit `definition_key` (z. B. `pms.draft`), separater
SemVer (`1.0.0`), Prompt, Input-/Output-Schema, Default-Modell, **Mindest-Datenklasse**,
**maximaler Eingabegröße**, **Token-/Timeout-Limits** sowie **zulässigen Providern**.

Fehlende oder überschrittene Limits führen zu einem **maschinenlesbaren
Validierungsfehler**; Eingaben werden **niemals still gekürzt**. Ein expliziter,
**idempotenter, vom Modul verantworteter Deployment-Schritt** registriert das
Manifest über die Core-API; der Core validiert und speichert es, enthält aber
**keinen PMS-Seed in seiner eigenen Migration**. Eine veröffentlichte Definition ist
**unveränderlich**; Änderungen erzeugen eine neue Version.

Runs sind auf Definition, Prompt-Hash, Modellparameter und Gateway-Calls
rückführbar. Das ist **Nachvollziehbarkeit**, nicht die Behauptung deterministischer
LLM-Reproduzierbarkeit.

## Nicht-Ziele

- Keine Mehrschritt-Orchestrierung/Workflows/Gates (→ v0.3, ADR-016/017).
- Keine Aussage über asynchrone Ausführung/Worker (→ ADR-012).
- Kein Provider-Policy-Enforcement (Felder ja, Durchsetzung → v0.5, ADR-026).

## Konsequenzen

- **Positiv:** ein Ausführungspfad für alle Module; Fachsemantik bleibt im Modul;
  die Wiederverwendbarkeit wird mit `idp.extract` (v0.7) beweisbar.
- **Kosten:** Module brauchen einen Registrierungs-/Deployment-Schritt; der Kern
  braucht eine generische Definition-/Prompt-Registry (`agent_definitions`,
  `prompt_versions`).
- **Folgeänderungen:** [backend-plan.md](../../pm-studio/backend-plan.md) wird
  `superseded`; #44–47 werden an dieser Grenze ausgerichtet. `localStorage` bleibt
  nur für lokale PM-Daten **ohne** agentische Herkunft. Verwirft: separates
  PMS-Backend, Run-Wahrheit in localStorage, Core-Migrationen mit Fachmodul-Semantik.
